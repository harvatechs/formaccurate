# @formaccurate/server

Hono-based HTTP layer, discovery endpoint, and storage adapters for FormAccurate. Exposes standard REST endpoints implementing the FormAccurate Agent Protocol specification (`spec-protocol.md`).

- **Web Standard HTTP**: Built on [Hono](https://hono.dev/), portable across Node.js, Cloudflare Workers, Deno, Bun, and Fastly Compute.
- **Protocol Conformance**: Full discovery manifest (`/.well-known/formaccurate.json`), schema inspection, session state, server-side validation, file uploads, consent enforcement, and receipt retrieval.
- **Production Hardened**: UUID idempotency enforcement (200 on identical payload replay, 409 on body conflict), token-bucket rate limiting, and Bearer token auth scoping (`form:read`, `form:write`, `form:upload`, `form:submit`, `form:read_receipt`).

## Installation

```bash
pnpm add @formaccurate/server @formaccurate/core hono
```

## Quickstart

```typescript
import { createFormAccurateServer, MemoryStorageAdapter, staticApiKeyAuthProvider } from "@formaccurate/server";
import type { AgentFormSchema } from "@formaccurate/core";

const businessPermitForm: AgentFormSchema = {
  version: "1.0",
  formId: "business-permit",
  title: "Business Operating Permit",
  fields: [
    { id: "businessName", type: "text", label: "Business Name", required: true },
    { id: "ownerEmail", type: "email", label: "Owner Email", required: true },
  ],
  consent: {
    required: true,
    statement: "I certify that all information provided is accurate.",
  },
};

// 1. Create server instance
const app = createFormAccurateServer({
  forms: [businessPermitForm],
  siteOrigin: "https://example.gov",
  storage: new MemoryStorageAdapter(),
  auth: staticApiKeyAuthProvider({
    "agent-key-secret": {
      subject: "agent-service",
      scopes: ["form:read", "form:write", "form:upload", "form:submit", "form:read_receipt"],
    },
  }),
});

// 2. Mount with your Node / Bun / Cloudflare worker entrypoint
export default app;
```

## Protocol Endpoints

| Method | Path | Description | Required Scope |
|---|---|---|---|
| `GET` | `/.well-known/formaccurate.json` | Discovery manifest of registered forms | None |
| `GET` | `/healthz` | Health check endpoint | None |
| `GET` | `/agent/forms/:formId/schema` | Form schema definition | `form:read` |
| `GET` | `/agent/forms/:formId/state` | Session state (creates new if sessionId omitted) | `form:read` |
| `PATCH` | `/agent/forms/:formId/values` | Merges field values into session | `form:write` |
| `POST` | `/agent/forms/:formId/validate` | Validates session values server-side | `form:read` |
| `POST` | `/agent/forms/:formId/files` | File upload (JSON or multipart) returning file token | `form:upload` |
| `POST` | `/agent/forms/:formId/submit` | Submits form with `Idempotency-Key` and consent verification | `form:submit` |
| `GET` | `/receipts/:submissionId` | Retrieves verifiable submission receipt | `form:read_receipt` |

## Pluggable Storage

Implement the `StorageAdapter` interface for database persistence (e.g. Postgres, SQLite, Redis):

```typescript
import type { StorageAdapter, StoredFileRecord, IdempotencyRecord } from "@formaccurate/server";
import type { FormState, SubmissionReceipt } from "@formaccurate/core";

export class MyCustomStorageAdapter implements StorageAdapter {
  async getState(formId: string, sessionId: string): Promise<FormState | null> { /* ... */ }
  async saveState(formId: string, sessionId: string, state: FormState): Promise<void> { /* ... */ }
  async createSubmission(formId: string, sessionId: string, values: Record<string, unknown>): Promise<SubmissionReceipt> { /* ... */ }
  async getSubmission(submissionId: string): Promise<SubmissionReceipt | null> { /* ... */ }
  async checkIdempotency(key: string): Promise<IdempotencyRecord | null> { /* ... */ }
  async recordIdempotency(key: string, receipt: SubmissionReceipt, requestBodyHash: string): Promise<void> { /* ... */ }
  async saveFile(formId: string, fieldId: string, file: { filename: string; sizeBytes: number; mimeType: string }, ttlMs?: number): Promise<StoredFileRecord> { /* ... */ }
  async getFile(fileToken: string): Promise<StoredFileRecord | null> { /* ... */ }
}
```

## Security & Scopes

- **Insecure Transport**: In `NODE_ENV=production`, HTTPS is enforced by default. Set `allowInsecureTransport: true` only if terminating SSL behind a trusted reverse proxy.
- **Idempotency Replay**: Prevents double submissions. The same `Idempotency-Key` replayed with identical payload returns the previous receipt (`200 OK`). Replay with a conflicting payload returns `409 Conflict`.
- **Consent Checks**: If `consent.required: true`, submissions without `consent: { confirmed: true }` are rejected with `409 Conflict`.
