import { serve } from "@hono/node-server";
import {
  createFormAccurateServer,
  MemoryStorageAdapter,
  staticApiKeyAuthProvider,
} from "@formaccurate/server";
import { businessPermitSchema } from "./schema.js";

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";
const SITE_ORIGIN = process.env.SITE_ORIGIN || `http://localhost:${PORT}`;

export const authProvider = staticApiKeyAuthProvider({
  "demo-agent-key-12345": {
    subject: "demo-agent-service",
    scopes: ["form:read", "form:write", "form:upload", "form:submit", "form:read_receipt"],
  },
});

export const storage = new MemoryStorageAdapter();

export const app = createFormAccurateServer({
  forms: [businessPermitSchema],
  siteOrigin: SITE_ORIGIN,
  storage,
  auth: authProvider,
  logSink: (event) => {
    console.log(`[AUDIT LOG] ${event.timestamp} | ${event.event} | form=${event.formId} sub=${event.submissionId ?? "-"}`);
  },
});

// Human root landing page
app.get("/", (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FormAccurate Demo Server</title>
  <link rel="agent-forms" href="/.well-known/formaccurate.json" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 780px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; background: #f8fafc; }
    h1 { color: #0f172a; margin-bottom: 8px; }
    .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>FormAccurate Demo Server <span class="badge">v0.1.0</span></h1>
  <p>Standardized, agent-operable web form HTTP API and discovery endpoint.</p>

  <div class="card">
    <h2>Discovery & Endpoints</h2>
    <ul>
      <li><a href="/.well-known/formaccurate.json"><code>GET /.well-known/formaccurate.json</code></a> — Agent discovery manifest</li>
      <li><a href="/healthz"><code>GET /healthz</code></a> — Server health check</li>
      <li><code>GET /agent/forms/business-permit-application/schema</code> — JSON Schema & field constraints</li>
      <li><code>POST /agent/forms/business-permit-application/submit</code> — Idempotent agent submission</li>
    </ul>
  </div>

  <div class="card">
    <h2>Run the Autonomous Agent Flow</h2>
    <p>Run the sample agent script to discover, validate, upload documents, and submit via the API:</p>
    <pre>pnpm --filter demo-server agent</pre>
  </div>
</body>
</html>
  `);
});

export function startServer(port: number = PORT) {
  console.log(`[FormAccurate] Server starting at http://localhost:${port}`);
  console.log(`[FormAccurate] Discovery: http://localhost:${port}/.well-known/formaccurate.json`);
  return serve({
    fetch: app.fetch,
    port,
  });
}

// Auto-start when executed directly (e.g. `pnpm start` / `tsx src/server.ts`)
const isDirectEntry =
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js"));

if (isDirectEntry) {
  startServer();
}
