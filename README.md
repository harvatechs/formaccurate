# FormAccurate

Turn web forms into agent-readable schemas and programmable APIs without screenshots, vision models, or DOM guessing.

FormAccurate gives web applications an opt-in protocol to expose forms directly to AI agents. Agents discover field definitions, inspect validation rules, patch values, handle required consent, and submit payloads over HTTP or in-page JavaScript, receiving a verifiable SHA-256 receipt for every submission.

```
Visual automation:  screenshot -> vision model -> guess elements -> click and type -> brittle failure
FormAccurate:       discover schema -> set typed values -> validate -> submit -> verifiable receipt
```

> **Status:** Pre-1.0. The schema and protocol specifications are versioned independently of package versions. See [`docs/spec-schema.md`](./docs/spec-schema.md) for versioning rules.

---

## The Problem

Vision-based browser automation fails on complex forms:

- Multi-step wizards lose context between page transitions.
- Dynamic dropdowns and dependent fields require heuristic waits.
- File uploads, masked inputs, and date pickers break visual OCR.
- Legal checkboxes and consent banners get clicked without auditable records.

FormAccurate removes visual guessing entirely. Site owners declare form structure once. AI agents and scripts read that structure directly through standardized endpoints and in-browser APIs.

This is opt-in infrastructure for site owners. It does not scrape unannotated websites, bypass CAPTCHAs, or evade bot detection. Read [`SECURITY.md`](./SECURITY.md) for the authorization model and [`docs/anti-patterns.md`](./docs/anti-patterns.md) for architectural boundaries.

---

## Architecture

| Layer               | Responsibility                                                                     | Packages               |
| ------------------- | ---------------------------------------------------------------------------------- | ---------------------- |
| **Schema**          | JSON Schema definitions for fields, types, steps, conditions, and consent          | `@formaccurate/core`   |
| **Runtime Bridge**  | In-browser form binding and DOM synchronization via `window.FormAccurate`          | `@formaccurate/web`    |
| **Server Protocol** | REST endpoints (`/.well-known`, schema, state, validate, submit) and storage       | `@formaccurate/server` |
| **Client UI**       | React 18 provider and hooks for reactive form state                                | `@formaccurate/react`  |
| **Agent Tools**     | Model Context Protocol (MCP) server for Claude Desktop, Cursor, and agent runtimes | `@formaccurate/mcp`    |
| **Developer CLI**   | Schema linting, offline payload validation, and scaffolding                        | `@formaccurate/cli`    |

---

## Packages

Every package is written in strict TypeScript, published as pure ESM with type definitions, and tested in isolation.

| Package                                     | Purpose                                                                                                               | Runtime               | Version |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------- | ------- |
| [`@formaccurate/core`](./packages/core)     | Zod validation engine, state machine, JSON Schema generator, and receipt hashing. Zero I/O, zero DOM, zero Node APIs. | Universal             | `0.1.0` |
| [`@formaccurate/web`](./packages/web)       | Browser SDK. Binds to standard forms via `data-fa-*` attributes and registers `window.FormAccurate`.                  | Browser               | `0.1.0` |
| [`@formaccurate/server`](./packages/server) | Hono HTTP application with discovery endpoints, session state, rate limiting, and storage adapters.                   | Node, Bun, Deno, Edge | `0.1.0` |
| [`@formaccurate/react`](./packages/react)   | `<FormAccurateProvider>` and `useFormAccurate()` hook for React 18.                                                   | React 18+             | `0.1.0` |
| [`@formaccurate/mcp`](./packages/mcp)       | MCP server exposing 7 form automation tools over stdio.                                                               | Node >= 20            | `0.1.0` |
| [`@formaccurate/cli`](./packages/cli)       | Command-line tools: `fa lint`, `fa validate`, and `fa scaffold`.                                                      | Node >= 20            | `0.1.0` |

---

## Quickstart

### 1. Browser Form (Vanilla HTML)

Add `data-fa-*` attributes to an existing form and initialize the web runtime:

```html
<form data-fa-form="permit-application" action="/api/permits" method="POST">
  <label for="company">Company Name</label>
  <input id="company" name="company" data-fa-field="company" required />

  <label for="email">Contact Email</label>
  <input id="email" name="email" type="email" data-fa-field="email" required />

  <button type="submit" data-fa-action="submit">Submit</button>
</form>

<script type="module">
  import { initFormAccurate } from "@formaccurate/web";
  initFormAccurate();
</script>
```

An agent running in the browser can now inspect and drive the form programmatically:

```js
const schema = window.FormAccurate.getSchema("permit-application");
window.FormAccurate.setValues("permit-application", {
  company: "Acme Industrial Corp",
  email: "ops@acme.com",
});
const result = await window.FormAccurate.submit("permit-application");
console.log(result.receipt.submissionId, result.receipt.sha256);
```

### 2. HTTP Server (Node, Bun, Deno, Edge)

Mount FormAccurate routes inside a Hono backend:

```ts
import { Hono } from "hono";
import { createFormAccurateServer, MemoryStorageAdapter } from "@formaccurate/server";
import { FormSchema } from "@formaccurate/core";

const permitSchema: FormSchema = {
  $schema: "https://formaccurate.dev/schema/v1.json",
  formId: "permit-application",
  version: "1.0.0",
  title: "Operating Permit Application",
  fields: [
    {
      id: "company",
      type: "string",
      label: "Company Name",
      required: true,
      constraints: { minLength: 2, maxLength: 100 },
    },
    {
      id: "email",
      type: "email",
      label: "Contact Email",
      required: true,
    },
  ],
  actions: { submit: { label: "Submit Application" } },
};

const app = new Hono();

app.route(
  "/",
  createFormAccurateServer({
    forms: [permitSchema],
    storage: new MemoryStorageAdapter(),
  }),
);

export default app;
```

The server automatically exposes these endpoints:

- `GET /.well-known/formaccurate.json` (lists available forms)
- `GET /agent/forms/:formId/schema` (returns the full schema)
- `POST /agent/forms/:formId/sessions` (initializes a draft session)
- `PATCH /agent/forms/:formId/sessions/:sessionId` (updates values)
- `POST /agent/forms/:formId/sessions/:sessionId/validate` (runs server validation)
- `POST /agent/forms/:formId/sessions/:sessionId/submit` (submits and issues receipt)

### 3. Model Context Protocol (MCP)

Connect Claude Desktop or Cursor to any FormAccurate server. Add this to your MCP configuration:

```json
{
  "mcpServers": {
    "formaccurate": {
      "command": "npx",
      "args": ["-y", "@formaccurate/mcp"],
      "env": {
        "FORMACCURATE_SERVER_URL": "http://localhost:3000"
      }
    }
  }
}
```

The agent gains 7 standard tools:

- `formaccurate_discover_forms`
- `formaccurate_get_schema`
- `formaccurate_init_session`
- `formaccurate_fill_form`
- `formaccurate_validate_session`
- `formaccurate_confirm_consent`
- `formaccurate_submit_form`

---

## Verifiable Receipts

When a form submission succeeds, FormAccurate creates a receipt containing a SHA-256 digest of the canonical submission payload:

```json
{
  "receipt": {
    "submissionId": "sub_01M2A47ETTEK0A2T9B5PM2TP77",
    "formId": "permit-application",
    "version": "1.0.0",
    "receivedAt": "2026-09-12T06:17:41.978Z",
    "sha256": "sha256:58beff9a480d6d0bb216b49091aad9d1f659a79d023db1b1170f1f682a45f85c",
    "status": "submitted"
  }
}
```

The hash is calculated over sorted JSON keys with normalized line endings. Both the submitting client and the receiving server can verify independently that the payload was not altered after submission.

---

## Running the Demos

### Demo Server & Autonomous Agent Flow

Start the demo server:

```bash
pnpm --filter demo-server start
```

Open `http://localhost:3000` to inspect the human HTML form. In a separate terminal, run the autonomous agent flow:

```bash
pnpm --filter demo-server agent
```

The script executes 10 sequential steps:

1. Discovers forms at `/.well-known/formaccurate.json`
2. Fetches and parses the schema
3. Creates a draft session (`sess_*`)
4. Uploads a PDF document and obtains a file token (`filetok_*`)
5. Patches 8 fields incrementally
6. Validates the session server-side
7. Confirms legal attestation and consent requirements
8. Submits with an idempotency key
9. Verifies duplicate submission replay returns the identical receipt
10. Retrieves the stored receipt and verifies the SHA-256 hash

### React 18 Application

```bash
pnpm --filter react-app dev
```

Provides a side-by-side layout: a reactive human form on the left and an interactive agent console on the right driving `window.FormAccurate`.

---

## Documentation

| Document                                                 | Audience                 | Focus                                                                      |
| -------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| [`docs/spec-schema.md`](./docs/spec-schema.md)           | Form authors, developers | Schema definition format, field types, constraints, conditional visibility |
| [`docs/spec-protocol.md`](./docs/spec-protocol.md)       | Integration engineers    | Discovery format, REST endpoints, in-page JS bridge, MCP tools             |
| [`docs/architecture.md`](./docs/architecture.md)         | Contributors             | Package boundaries, data flow, and runtime constraints                     |
| [`docs/coding-standards.md`](./docs/coding-standards.md) | Contributors             | TypeScript guidelines, error patterns, and testing conventions             |
| [`docs/deployment.md`](./docs/deployment.md)             | Operators                | Self-hosting, cloud deployment, and rate-limiting setup                    |
| [`SECURITY.md`](./SECURITY.md)                           | All users                | Threat model, consent controls, and vulnerability reporting                |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md)                   | Contributors             | Local setup, workflow conventions, and pull request process                |

---

## License

MIT License. Copyright (c) 2026 Harsha Vardhan and FormAccurate Contributors. See [`LICENSE`](./LICENSE).
