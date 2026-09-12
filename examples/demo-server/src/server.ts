import { fileURLToPath } from "node:url";
import path from "node:path";
import { serve } from "@hono/node-server";
import {
  createFormAccurateServer,
  MemoryStorageAdapter,
  staticApiKeyAuthProvider,
} from "@formaccurate/server";
import { businessPermitSchema } from "./schema.js";

const PORT = Number(process.env.PORT || 3000);
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

// Human root landing page with side-by-side form and agent runner
app.get("/", (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FormAccurate Demo — Human & Agent Flows</title>
  <link rel="agent-forms" href="/.well-known/formaccurate.json" />
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --card-border: #334155;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #06b6d4;
      --success: #10b981;
      --error: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 32px 20px; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { margin-bottom: 28px; border-bottom: 1px solid var(--card-border); padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    h1 { font-size: 1.75rem; font-weight: 700; }
    .badge { display: inline-block; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; border: 1px solid rgba(99, 102, 241, 0.4); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
    .card { background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 24px; }
    h2 { font-size: 1.2rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    input[type="text"], input[type="email"], input[type="number"], select {
      width: 100%; padding: 10px 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); border-radius: 8px; color: white; font-size: 0.95rem; outline: none;
    }
    input:focus, select:focus { border-color: var(--primary); }
    .checkbox-row { display: flex; align-items: flex-start; gap: 10px; margin-top: 20px; }
    .btn { padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.95rem; transition: background 0.15s; }
    .btn-primary { background: var(--primary); color: white; width: 100%; margin-top: 12px; }
    .btn-primary:hover { background: var(--primary-hover); }
    .terminal { background: #030712; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; font-family: ui-monospace, monospace; font-size: 0.85rem; color: #a5f3fc; height: 320px; overflow-y: auto; white-space: pre-wrap; line-height: 1.4; }
    code { background: rgba(255, 255, 255, 0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.88em; }
    pre { background: #030712; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; color: #38bdf8; margin: 8px 0 16px 0; }
    .receipt { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 16px; margin-top: 16px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>FormAccurate Demo Server <span class="badge">v0.1.0</span></h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Opt-in agent discoverability and deterministic submission without vision models.</p>
      </div>
      <div>
        <a href="/.well-known/formaccurate.json" class="badge">Discovery: /.well-known/formaccurate.json</a>
      </div>
    </header>

    <div class="grid">
      <!-- Human Flow Column -->
      <div class="card">
        <h2><span>👤</span> Human Flow: Plain HTML Form</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
          Standard web form annotated with <code>data-fa-field</code>. Works for humans with standard validation and accessibility.
        </p>

        <form id="human-form" onsubmit="handleHumanSubmit(event)">
          <div class="form-group">
            <label for="businessName">Legal Business Name *</label>
            <input id="businessName" name="businessName" type="text" required value="Acme Industrial Logistics LLC" />
          </div>

          <div class="form-group">
            <label for="entityType">Entity Structure *</label>
            <select id="entityType" name="entityType" required>
              <option value="llc" selected>Limited Liability Company (LLC)</option>
              <option value="corp">Corporation (C-Corp or S-Corp)</option>
              <option value="soleProp">Sole Proprietorship</option>
            </select>
          </div>

          <div class="form-group">
            <label for="taxId">Federal EIN (XX-XXXXXXX) *</label>
            <input id="taxId" name="taxId" type="text" pattern="^\\d{2}-\\d{7}$" required value="12-3456789" />
          </div>

          <div class="form-group">
            <label for="primaryContactEmail">Contact Email *</label>
            <input id="primaryContactEmail" name="primaryContactEmail" type="email" required value="authorized@acme.com" />
          </div>

          <div class="form-group">
            <label for="estimatedEmployees">Estimated Employees *</label>
            <input id="estimatedEmployees" name="estimatedEmployees" type="number" min="1" max="10000" required value="25" />
          </div>

          <div class="checkbox-row">
            <input id="confirmTruthful" name="confirmTruthful" type="checkbox" required checked />
            <label for="confirmTruthful" style="font-size: 0.8rem; margin: 0;">
              I declare under penalty of perjury that the statements made herein are true and correct.
            </label>
          </div>

          <button type="submit" class="btn btn-primary" id="btn-human-submit">Submit Form (Human Flow)</button>
        </form>

        <div id="human-receipt" class="receipt" style="display: none;">
          <h3 style="color: var(--success); font-size: 0.95rem; margin-bottom: 8px;">✓ Submission Verified</h3>
          <p id="receipt-details" style="font-size: 0.8rem; font-family: monospace; word-break: break-all;"></p>
        </div>
      </div>

      <!-- Agent Flow Column -->
      <div class="card">
        <h2><span>🤖</span> Agent Flow: Protocol Telemetry</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;">
          Autonomous agents discover schema, validate state, upload docs, confirm consent, and submit with cryptographic receipts.
        </p>

        <label>Run Autonomous Agent in Terminal:</label>
        <pre>pnpm --filter demo-server agent</pre>

        <label>Live Agent Protocol Simulation:</label>
        <div class="terminal" id="terminal-log">[Agent] Ready. Click "Simulate Agent Execution" below to run the HTTP flow in real-time.</div>

        <button class="btn btn-primary" style="background: var(--accent); color: #021219;" onclick="runBrowserAgentSimulation()">
          ⚡ Simulate Agent Execution
        </button>
      </div>
    </div>
  </div>

  <script>
    async function handleHumanSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const btn = document.getElementById("btn-human-submit");
      btn.disabled = true;
      btn.textContent = "Submitting...";

      try {
        // Human submits directly to the FormAccurate server submit endpoint
        const idempotencyKey = crypto.randomUUID();
        const payload = {
          formId: "business-permit-application",
          values: {
            businessName: form.businessName.value,
            entityType: form.entityType.value,
            taxId: form.taxId.value,
            primaryContactEmail: form.primaryContactEmail.value,
            estimatedEmployees: Number(form.estimatedEmployees.value),
            confirmTruthful: form.confirmTruthful.checked
          },
          consent: { confirmed: form.confirmTruthful.checked }
        };

        const res = await fetch("/agent/forms/business-permit-application/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
            "Authorization": "Bearer demo-agent-key-12345"
          },
          body: JSON.stringify(payload)
        });

        const receipt = await res.json();
        const receiptDiv = document.getElementById("human-receipt");
        const detailsP = document.getElementById("receipt-details");
        detailsP.innerHTML = \`
          Submission ID: <b>\${receipt.submissionId}</b><br/>
          Status: \${receipt.status}<br/>
          Checksum: \${receipt.checksum}<br/>
          Receipt URL: <a href="\${receipt.receiptUrl}" target="_blank">\${receipt.receiptUrl}</a>
        \`;
        receiptDiv.style.display = "block";
      } catch (err) {
        alert("Submission failed: " + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "Submit Form (Human Flow)";
      }
    }

    async function runBrowserAgentSimulation() {
      const term = document.getElementById("terminal-log");
      term.textContent = "";
      const log = (msg) => { term.textContent += msg + "\\n"; term.scrollTop = term.scrollHeight; };

      log("[1/6] Querying GET /.well-known/formaccurate.json...");
      const disc = await fetch("/.well-known/formaccurate.json").then(r => r.json());
      log(\`      Discovered \${disc.forms.length} form(s): \${disc.forms[0].id}\`);

      log("[2/6] Querying GET /agent/forms/\${disc.forms[0].id}/schema...");
      const schema = await fetch(\`/agent/forms/\${disc.forms[0].id}/schema\`).then(r => r.json());
      log(\`      Title: "\${schema.title}", Fields declared: \${schema.fields.length}\`);

      log("[3/6] Initializing session via GET /agent/forms/\${disc.forms[0].id}/state...");
      const state = await fetch(\`/agent/forms/\${disc.forms[0].id}/state\`, {
        headers: { "Authorization": "Bearer demo-agent-key-12345" }
      }).then(r => r.json());
      log(\`      Session active: \${state.sessionId}\`);

      log("[4/6] Sending PATCH /agent/forms/\${disc.forms[0].id}/values...");
      await fetch(\`/agent/forms/\${disc.forms[0].id}/values\`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer demo-agent-key-12345" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          values: {
            businessName: "Autonomous Logistics AI Corp",
            entityType: "corp",
            taxId: "98-7654321",
            primaryContactEmail: "agent@autonomous-corp.ai",
            estimatedEmployees: 15,
            confirmTruthful: true
          }
        })
      });
      log("      Form values successfully applied to session.");

      log("[5/6] Validating state via POST /agent/forms/\${disc.forms[0].id}/validate...");
      const val = await fetch(\`/agent/forms/\${disc.forms[0].id}/validate\`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer demo-agent-key-12345" },
        body: JSON.stringify({ sessionId: state.sessionId })
      }).then(r => r.json());
      log(\`      Server validation: \${val.status.toUpperCase()}\`);

      log("[6/6] Submitting with Idempotency-Key...");
      const sub = await fetch(\`/agent/forms/\${disc.forms[0].id}/submit\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
          "Authorization": "Bearer demo-agent-key-12345"
        },
        body: JSON.stringify({
          formId: disc.forms[0].id,
          sessionId: state.sessionId,
          consent: { confirmed: true }
        })
      }).then(r => r.json());
      log(\`>>> SUCCESS! Submission ID: \${sub.submissionId}\`);
      log(\`    Cryptographic Checksum: \${sub.checksum}\`);
      log(\`    Receipt URL: \${sub.receiptUrl}\`);
    }
  </script>
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
const entryArg = process.argv[1];
const isDirectEntry =
  entryArg !== undefined && path.resolve(entryArg) === fileURLToPath(import.meta.url);

if (isDirectEntry) {
  startServer();
}
