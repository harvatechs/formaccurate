/**
 * @packageDocumentation
 * \@formaccurate/server
 *
 * Hono-based HTTP protocol implementation, discovery endpoint,
 * storage adapters, auth, and receipt generation for FormAccurate.
 */

export {
  createFormAccurateServer,
  type FormAccurateServerOptions,
  type FormAccurateEnv,
} from "./server.js";

export {
  type StorageAdapter,
  type StoredFileRecord,
  type IdempotencyRecord,
} from "./storage/adapter.js";

export {
  MemoryStorageAdapter,
  type MemoryStorageAdapterOptions,
} from "./storage/memory-adapter.js";

export {
  type AuthProvider,
  type AuthContext,
  staticApiKeyAuthProvider,
} from "./auth/auth-provider.js";

export {
  type RateLimiter,
  type RateLimitResult,
  TokenBucketRateLimiter,
  type TokenBucketOptions,
} from "./rate-limit/rate-limiter.js";

export {
  buildDiscoveryDocument,
  type DiscoveryDocument,
  type DiscoveredFormEntry,
} from "./discovery.js";

export { type AuditEvent } from "./routes/submit.js";

