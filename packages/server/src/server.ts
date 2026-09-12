import { Hono, type MiddlewareHandler } from "hono";
import { generateUlid, type AgentFormSchema } from "@formaccurate/core";
import {
  staticApiKeyAuthProvider,
  type AuthContext,
  type AuthProvider,
} from "./auth/auth-provider.js";
import { buildDiscoveryDocument } from "./discovery.js";
import {
  TokenBucketRateLimiter,
  type RateLimiter,
} from "./rate-limit/rate-limiter.js";
import { handleFileUpload } from "./routes/files.js";
import { handleGetReceipt } from "./routes/receipts.js";
import { handleGetSchema } from "./routes/schema.js";
import { handleGetState, handlePatchValues } from "./routes/state.js";
import { handleSubmit, type AuditEvent } from "./routes/submit.js";
import { handleValidate } from "./routes/validate.js";
import type { StorageAdapter } from "./storage/adapter.js";
import { MemoryStorageAdapter } from "./storage/memory-adapter.js";

export interface FormAccurateServerOptions {
  /** List of registered form schemas. */
  forms: AgentFormSchema[];
  /** Storage adapter instance or "memory" for in-memory storage (default). */
  storage?: StorageAdapter | "memory" | undefined;
  /** AuthProvider instance or static API keys array. */
  auth?: AuthProvider | string[] | Record<string, AuthContext> | undefined;
  /** Rate limiter instance or "memory" (default). */
  rateLimiter?: RateLimiter | "memory" | undefined;
  /** Site origin prefix for discovery (e.g. "https://example.gov"). */
  siteOrigin?: string | undefined;
  /** Base path for agent API routes (defaults to "/agent/forms"). */
  apiPrefix?: string | undefined;
  /** Audit log sink for recording security and form events. */
  logSink?: ((event: AuditEvent) => void) | undefined;
  /** Allow plain HTTP in production (intended only behind reverse proxies). */
  allowInsecureTransport?: boolean | undefined;
}

export interface FormAccurateEnv {
  Variables: {
    requestId: string;
    auth?: AuthContext | undefined;
  };
}

/**
 * Creates a mountable Hono application implementing the FormAccurate Agent Protocol.
 *
 * Mounts:
 * - `GET /.well-known/formaccurate.json`
 * - `GET /healthz`
 * - `GET /agent/forms/:formId/schema`
 * - `GET /agent/forms/:formId/state`
 * - `PATCH /agent/forms/:formId/values`
 * - `POST /agent/forms/:formId/validate`
 * - `POST /agent/forms/:formId/files`
 * - `POST /agent/forms/:formId/submit`
 * - `GET /receipts/:submissionId`
 *
 * @param options - Configuration options for schemas, storage, auth, and logging.
 * @returns Configured Hono app instance.
 */
export function createFormAccurateServer(
  options: FormAccurateServerOptions,
): Hono<FormAccurateEnv> {
  const app = new Hono<FormAccurateEnv>();

  // Storage initialization
  const storage: StorageAdapter =
    !options.storage || options.storage === "memory"
      ? new MemoryStorageAdapter()
      : options.storage;

  // Rate limiter initialization
  const rateLimiter: RateLimiter | null =
    options.rateLimiter === "memory" || !options.rateLimiter
      ? new TokenBucketRateLimiter({ maxTokens: 60, refillRatePerSec: 1 })
      : options.rateLimiter;

  // Auth provider initialization
  let authProvider: AuthProvider | null = null;
  if (Array.isArray(options.auth)) {
    authProvider = staticApiKeyAuthProvider(options.auth);
  } else if (
    options.auth &&
    typeof options.auth === "object" &&
    "verifyToken" in options.auth
  ) {
    authProvider = options.auth as AuthProvider;
  } else if (options.auth && typeof options.auth === "object") {
    authProvider = staticApiKeyAuthProvider(
      options.auth as Record<string, AuthContext>,
    );
  }

  // Map forms by ID
  const formMap = new Map<string, AgentFormSchema>();
  for (const form of options.forms) {
    formMap.set(form.formId, form);
  }

  const apiPrefix = options.apiPrefix ?? "/agent/forms";
  const siteOrigin = options.siteOrigin ?? "";

  // 1. Middleware: Request ID tracing (X-FormAccurate-Request-Id)
  app.use("*", async (c, next) => {
    const reqId = `req_${generateUlid()}`;
    c.set("requestId", reqId);
    c.header("X-FormAccurate-Request-Id", reqId);
    await next();
  });

  // 2. Middleware: Insecure transport check in production
  const globalEnv = (
    globalThis as unknown as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  if (globalEnv?.NODE_ENV === "production") {
    const allowInsecure =
      options.allowInsecureTransport ||
      globalEnv.ALLOW_INSECURE_TRANSPORT === "true";

    if (!allowInsecure) {
      app.use("*", async (c, next) => {
        const proto =
          c.req.header("x-forwarded-proto") || new URL(c.req.url).protocol;
        if (proto !== "https:" && proto !== "https") {
          return c.json(
            {
              error: {
                code: "insecure_transport",
                message: "HTTPS is required in production environments",
              },
            },
            403,
          );
        }
        await next();
      });
    }
  }

  // Auth & Scope Checking Helper Middleware
  const requireScope = (
    requiredScope: string,
  ): MiddlewareHandler<FormAccurateEnv> => {
    return async (c, next) => {
      const formId = c.req.param("formId");
      const schema = formId ? formMap.get(formId) : undefined;

      const isAuthRequired = Boolean(
        authProvider || (schema && schema.auth && schema.auth.required),
      );

      if (!isAuthRequired) {
        await next();
        return;
      }

      const authHeader = c.req.header("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json(
          {
            error: {
              code: "unauthorized",
              message: "Authorization header with Bearer token is required",
            },
          },
          401,
        );
      }

      const token = authHeader.slice(7).trim();
      const authContext = authProvider ? await authProvider.verifyToken(token) : null;

      if (!authContext) {
        return c.json(
          {
            error: {
              code: "unauthorized",
              message: "Invalid or expired authorization token",
            },
          },
          401,
        );
      }

      if (!authContext.scopes.includes(requiredScope)) {
        return c.json(
          {
            error: {
              code: "invalid_scope",
              message: `token missing scope: ${requiredScope}`,
            },
          },
          403,
        );
      }

      c.set("auth", authContext);
      await next();
    };
  };

  // Rate Limiting Helper Middleware
  const applyRateLimit: MiddlewareHandler<FormAccurateEnv> = async (c, next) => {
    if (!rateLimiter) {
      await next();
      return;
    }

    const auth = c.get("auth") as AuthContext | undefined;
    const clientKey =
      auth?.subject ??
      c.req.header("x-forwarded-for") ??
      "anonymous";

    const result = await rateLimiter.check(clientKey);
    c.header("X-RateLimit-Remaining", String(result.remaining));

    if (!result.allowed) {
      c.header("Retry-After", String(Math.ceil(result.resetMs / 1000)));
      return c.json(
        {
          error: {
            code: "rate_limited",
            message: "Too many requests. Rate limit exceeded.",
          },
        },
        429,
      );
    }

    await next();
  };

  // Discovery Route
  app.get("/.well-known/formaccurate.json", (c) => {
    const doc = buildDiscoveryDocument(options.forms, siteOrigin, apiPrefix);
    return c.json(doc, 200);
  });

  // Health check
  app.get("/healthz", (c) => {
    return c.json({ status: "ok", uptime: 100 }, 200);
  });

  // Schema Route
  app.get(
    `${apiPrefix}/:formId/schema`,
    requireScope("form:read"),
    (c) => handleGetSchema(c, formMap),
  );

  // State Routes
  app.get(
    `${apiPrefix}/:formId/state`,
    requireScope("form:read"),
    (c) => handleGetState(c, formMap, storage),
  );

  app.patch(
    `${apiPrefix}/:formId/values`,
    requireScope("form:write"),
    (c) => handlePatchValues(c, formMap, storage),
  );

  // Validation Route
  app.post(
    `${apiPrefix}/:formId/validate`,
    requireScope("form:read"),
    applyRateLimit,
    (c) => handleValidate(c, formMap, storage),
  );

  // File Upload Route
  app.post(
    `${apiPrefix}/:formId/files`,
    requireScope("form:upload"),
    (c) => handleFileUpload(c, formMap, storage),
  );

  // Submit Route
  app.post(
    `${apiPrefix}/:formId/submit`,
    requireScope("form:submit"),
    applyRateLimit,
    (c) => handleSubmit(c, formMap, storage, options.logSink),
  );

  // Receipt Route
  app.get(
    "/receipts/:submissionId",
    requireScope("form:read_receipt"),
    (c) => handleGetReceipt(c, storage),
  );

  return app;
}
