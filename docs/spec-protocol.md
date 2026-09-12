# Agent Protocol Specification (v1)

This document defines every way an agent can talk to a FormAccurate-enabled site: discovery, the
REST API, the browser JS bridge, HTML annotation attributes, MCP tools, and webhooks. All of
these operate on the same `AgentFormSchema` / `FormState` / `SubmissionReceipt` shapes defined in
[`docs/spec-schema.md`](./spec-schema.md).

## Discovery

Every FormAccurate-enabled site serves:

```
GET /.well-known/formaccurate.json
```

```json
{
  "version": "1.0",
  "site": "https://example.gov",
  "forms": [
    {
      "id": "business-permit-application",
      "title": "Business Permit Application",
      "description": "Apply for a new business permit",
      "schemaUrl": "/agent/forms/business-permit-application/schema",
      "stateUrl": "/agent/forms/business-permit-application/state",
      "submitUrl": "/agent/forms/business-permit-application/submit"
    }
  ]
}
```

Sites may additionally advertise discovery via an HTML `<link>` so a browser-context agent can
find it without knowing the well-known path convention:

```html
<link rel="agent-forms" href="/.well-known/formaccurate.json" />
```

`@formaccurate/server`'s `createFormAccurateServer()` generates this file automatically from the
`forms` array passed to it — it is never hand-authored.

## REST API

All endpoints are relative to the site origin. All request/response bodies are JSON. All
state-changing endpoints require `Authorization: Bearer <token>` and are checked against the
scopes in `docs/spec-schema.md`'s `auth.scopes`.

### `GET /agent/forms/:formId/schema`

Returns the `AgentFormSchema` verbatim (no session needed — schemas are public metadata unless
`auth.required` restricts even reading them).

**Response 200:**
```json
{ "$schema": "...", "formId": "business-permit-application", "version": "1.0.0", "...": "..." }
```

**Response 404:** `{ "error": { "code": "form_not_found", "message": "..." } }`

### `GET /agent/forms/:formId/state?sessionId=<id>`

Returns the current `FormState` for a session. If `sessionId` is omitted, the server creates a
new session and returns a fresh draft state including the generated `sessionId`.

**Response 200:**
```json
{
  "formId": "business-permit-application",
  "sessionId": "sess_01J...",
  "values": {},
  "errors": [],
  "status": "draft",
  "step": { "current": "applicant_info", "completed": [] },
  "updatedAt": "2026-01-01T10:00:00Z"
}
```

### `PATCH /agent/forms/:formId/values`

Merges the given values into the session's state. Does not validate — call `validate`
separately. This lets an agent fill incrementally across multiple calls (e.g., one call per
form step) without premature error noise.

**Request:**
```json
{ "sessionId": "sess_01J...", "values": { "legal_name": "Acme LLC", "email": "owner@acme.com" } }
```

**Response 200:** the updated `FormState` (status stays `draft` unless previously `invalid`, in
which case it resets to `draft` since values changed).

### `POST /agent/forms/:formId/validate`

Runs `core.validateForm()` against the session's current values.

**Request:** `{ "sessionId": "sess_01J..." }`

**Response 200:**
```json
{
  "formId": "business-permit-application",
  "sessionId": "sess_01J...",
  "status": "invalid",
  "errors": [
    { "fieldId": "email", "code": "type", "message": "must be a valid email address" }
  ],
  "updatedAt": "2026-01-01T10:05:00Z"
}
```

`status` is `"valid"` and `errors` is `[]` when the form is submittable.

### `POST /agent/forms/:formId/files`

Uploads a file against a `file` or `signature` field before it can be referenced in `values`.
Multipart request; `fieldId` identifies which field this upload is for so size/type constraints
can be enforced immediately.

**Response 200:**
```json
{ "fileToken": "filetok_01J...", "fieldId": "supporting_documents", "filename": "articles.pdf", "sizeBytes": 245678, "expiresAt": "2026-01-01T11:00:00Z" }
```

The agent then includes `"supporting_documents": ["filetok_01J..."]` in a `PATCH .../values`
call. Tokens expire; an expired token used at validate/submit time produces a `code: "custom"`
field error, not a silent pass-through.

### `POST /agent/forms/:formId/submit`

**Headers:** `Idempotency-Key: <uuid>` (required — see below)

**Request:**
```json
{
  "sessionId": "sess_01J...",
  "consent": { "confirmed": true }
}
```

The server **always re-validates server-side** before accepting a submission, regardless of what
the client last reported — client-side validation is a UX convenience, never a trust boundary.

**Response 200:**
```json
{
  "submissionId": "sub_01JXYZ",
  "status": "submitted",
  "receivedAt": "2026-01-01T10:10:00Z",
  "receiptUrl": "/receipts/sub_01JXYZ",
  "checksum": "sha256:3b1c...9f"
}
```

**Response 422** (validation failed): same shape as the `validate` response, submission rejected.

**Response 409** (`CONSENT_REQUIRED`): the form declares `consent.required: true` but no matching
confirmation was supplied.

**Idempotency:** the same `Idempotency-Key` replayed with the same request body returns the
original `SubmissionReceipt` without creating a second submission. The same key replayed with a
*different* body returns `409 IDEMPOTENCY_KEY_CONFLICT`. Keys are UUIDs generated by the caller,
not the server.

### `GET /receipts/:submissionId`

Returns the `SubmissionReceipt`, requires `form:read_receipt` scope.

### Error format (all endpoints)

```json
{ "error": { "code": "invalid_scope", "message": "token missing scope: form:submit" } }
```

Standard `code` values: `form_not_found`, `session_not_found`, `unauthorized`, `invalid_scope`,
`validation_failed`, `consent_required`, `idempotency_key_conflict`, `rate_limited`,
`internal_error`.

## Browser JS bridge

`@formaccurate/web` attaches `window.FormAccurate`:

```ts
interface FormAccurateBridge {
  listForms(): FormSummary[];
  getSchema(formId: string): AgentFormSchema;
  getState(formId: string): FormState;
  setValues(formId: string, values: Record<string, unknown>): FormState;
  validate(formId: string): FormState;
  submit(formId: string, options?: { consent?: { confirmed: boolean } }): Promise<SubmissionReceipt>;
  on(event: "change" | "validate" | "submit" | "error", handler: (payload: unknown) => void): () => void;
}
```

`submit()` is the one method that's async even in browser-only mode, because it may proxy to a
configured server endpoint; everything else operates synchronously on in-page DOM state for
immediate agent feedback.

## HTML annotation attributes

| Attribute | Placed on | Meaning |
|---|---|---|
| `data-fa-form="<formId>"` | `<form>` | Registers this element as a FormAccurate-managed form |
| `data-fa-field="<fieldId>"` | input/select/textarea | Binds this control to a schema field id |
| `data-fa-action="submit"` \| `"next"` \| `"previous"` \| `"saveDraft"` | button | Binds this control to a `FormAction` |
| `data-fa-step="<stepId>"` | container element | Marks the boundary of a step for multi-step forms |

`initFormAccurate()` scans the document once at call time and observes DOM mutations afterward,
so dynamically-inserted forms (SPAs, step transitions) are picked up automatically.

## MCP tools

`@formaccurate/mcp` exposes a fixed, static set of tools — descriptions are never derived from
per-form content (see `SECURITY.md §Prompt-injection defense`):

| Tool | Input | Output |
|---|---|---|
| `formaccurate_discover_forms` | `{ origin: string }` | discovery document |
| `formaccurate_get_schema` | `{ formId: string }` | `AgentFormSchema` |
| `formaccurate_get_state` | `{ formId: string, sessionId?: string }` | `FormState` |
| `formaccurate_set_values` | `{ formId: string, sessionId: string, values: object }` | `FormState` |
| `formaccurate_validate` | `{ formId: string, sessionId: string }` | `FormState` |
| `formaccurate_submit` | `{ formId: string, sessionId: string, consent?: object }` | `SubmissionReceipt` |
| `formaccurate_get_receipt` | `{ submissionId: string }` | `SubmissionReceipt` |

Each tool is a thin, typed wrapper around the corresponding REST call — `@formaccurate/mcp` holds
no independent business logic.

## Webhooks

Configured per-server, delivered as `POST` to a configured URL with an HMAC signature header
(`X-FormAccurate-Signature`) computed over the raw body using a shared secret.

| Event | Payload |
|---|---|
| `draft.created` | `{ formId, sessionId, createdAt }` |
| `form.validation_failed` | `{ formId, sessionId, errors, occurredAt }` |
| `form.review_required` | `{ formId, sessionId, reason: "consent_mode_review", occurredAt }` |
| `form.submitted` | `{ formId, submissionId, receivedAt }` |

Webhook delivery is at-least-once; consumers should treat delivery as idempotent using
`submissionId`/`sessionId` + event type as the dedupe key.
