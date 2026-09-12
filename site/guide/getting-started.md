# Getting Started with FormAccurate

FormAccurate provides a unified way to expose web forms to autonomous agents while preserving standard human web experiences.

## Core Concepts

1. **Schema**: A declarative, versioned JSON Schema object declaring every field, input constraint, conditional visibility rule (`visibleWhen`), and consent requirement.
2. **Bridge**: A lightweight client-side runtime (`window.FormAccurate`) or server runtime (`@formaccurate/server`) managing form states, values, validation, and submission.
3. **Agent Protocol**: Standardized REST API endpoints and MCP tools allowing agents to discover and interact with forms programmatically.
4. **Verifiable Receipt**: A cryptographic SHA-256 digest calculated over canonical sorted JSON of the submission, ensuring non-repudiation and auditability.

---

## 1. Annotating Existing HTML Forms

In browser applications, annotate existing standard HTML inputs with `data-fa-*` attributes. No rewrite of existing forms is required.

```html
<form data-fa-form="business-permit-application">
  <label for="legal_name">Legal Business Name *</label>
  <input id="legal_name" name="legal_name" data-fa-field="legal_name" type="text" required />

  <label for="email">Primary Contact Email *</label>
  <input id="email" name="email" data-fa-field="email" type="email" required />

  <button type="submit" data-fa-action="submit">Submit Application</button>
</form>

<script type="module">
  import { initFormAccurate } from "@formaccurate/web";

  // Initializes the window.FormAccurate bridge and scans DOM
  const bridge = initFormAccurate();
</script>
```

---

## 2. Setting Up an Agent-Operable Server

Use `@formaccurate/server` to serve discovery documents, validation endpoints, and receipt storage.

```typescript
import { createFormAccurateServer, MemoryStorageAdapter, staticApiKeyAuthProvider } from "@formaccurate/server";
import { serve } from "@hono/node-server";
import { businessPermitSchema } from "./schema.js";

const app = createFormAccurateServer({
  forms: [businessPermitSchema],
  storage: new MemoryStorageAdapter(),
  auth: staticApiKeyAuthProvider({
    "agent-api-key-123": {
      subject: "procurement-agent",
      scopes: ["form:read", "form:write", "form:submit"],
    },
  }),
});

serve({ fetch: app.fetch, port: 3000 });
```

This automatically mounts:
- `GET /.well-known/formaccurate.json` (Public discovery manifest)
- `GET /healthz` (Liveness check)
- `GET /agent/forms/:formId/schema` (JSON Schema)
- `GET /agent/forms/:formId/state` (Draft session initialization)
- `PATCH /agent/forms/:formId/values` (Incremental field updates)
- `POST /agent/forms/:formId/validate` (Server-side validation)
- `POST /agent/forms/:formId/files` (Attachment uploads)
- `POST /agent/forms/:formId/submit` (Idempotent submission)
- `GET /receipts/:submissionId` (Cryptographic submission receipts)
