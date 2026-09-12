# Architecture

## System overview

```
┌──────────────────────┐        ┌───────────────────────────┐
│   Website / Portal    │        │          Agent             │
│                        │        │  (LLM app, script, MCP     │
│  existing HTML form    │        │   client, browser agent)   │
│         +              │        └──────────┬─────────────────┘
│  @formaccurate/web      │                    │
│  (browser bridge)       │◄───────────────────┤ in-page calls
└──────────┬─────────────┘        window.FormAccurate.*
           │
           │ same schema/state model
           ▼
┌──────────────────────────────────────────────────────────┐
│                @formaccurate/server                        │
│  discovery · schema · state · validate · submit · receipts │
│  auth middleware · rate limiting · storage adapter          │
└──────────┬──────────────────────────────┬──────────────────┘
           │ HTTP                          │ HTTP
           ▼                                ▼
┌────────────────────┐          ┌─────────────────────────┐
│  @formaccurate/mcp   │          │  Any HTTP client / SDK   │
│  MCP tools for       │          │  (curl, LangChain,        │
│  agent frameworks     │          │   custom agent runtime)   │
└────────────────────┘          └─────────────────────────┘

Everything above is built on:
┌──────────────────────────────────────────────────────────┐
│                    @formaccurate/core                       │
│  schema types · Zod validators · state machine · IDs        │
│  zero DOM, zero Node APIs, zero I/O — pure functions         │
└──────────────────────────────────────────────────────────┘
```

Two integration paths exist side by side, not as competing designs:

- **Browser-first** (`web`, `react`): fastest to adopt, no backend change required, good for
  demos and low-sensitivity forms.
- **Server-first** (`server`, `mcp`): the production-grade path for anything involving auth,
  consent, file uploads, or auditability. `web` and `server` share the exact same schema and
  state shapes from `core`, so a site can start browser-only and add a server later without
  changing the form schema.

## Monorepo layout

```
formaccurate/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── schema/           field & form schema types + Zod definitions
│   │   │   ├── validate/          validation engine (schema + values -> errors)
│   │   │   ├── state/             state machine (draft/validating/valid/...)
│   │   │   ├── visibility/        visibleWhen rule evaluator
│   │   │   ├── ids/               formId/submissionId/idempotency helpers
│   │   │   ├── json-schema/       Zod -> JSON Schema export
│   │   │   └── index.ts           public exports only
│   │   ├── src/**/*.test.ts       colocated unit tests
│   │   └── package.json
│   ├── web/
│   │   ├── src/
│   │   │   ├── bind.ts             data-fa-* attribute scanning/binding
│   │   │   ├── bridge.ts           window.FormAccurate implementation
│   │   │   ├── dom-adapter.ts      reading/writing real input elements
│   │   │   └── index.ts
│   │   └── e2e/                    Playwright specs against html fixtures
│   ├── server/
│   │   ├── src/
│   │   │   ├── discovery.ts        /.well-known/formaccurate.json handler
│   │   │   ├── routes/              schema.ts, state.ts, validate.ts, submit.ts, files.ts
│   │   │   ├── auth/                AuthProvider interface + bearer token middleware
│   │   │   ├── storage/             StorageAdapter interface + in-memory adapter
│   │   │   ├── rate-limit/          RateLimiter interface + token-bucket adapter
│   │   │   └── index.ts             createFormAccurateServer()
│   │   └── src/**/*.test.ts        integration tests against a real Hono app instance
│   ├── react/
│   │   └── src/  provider.tsx, use-form-accurate.ts, index.ts
│   ├── mcp/
│   │   └── src/  tools/*.ts (one file per tool), server.ts, index.ts
│   └── cli/
│       └── src/  commands/lint.ts, commands/validate.ts, commands/scaffold.ts, index.ts
├── examples/
│   ├── vanilla-html/        static HTML + @formaccurate/web, no build step
│   ├── react-app/            Vite + React + @formaccurate/react
│   └── demo-server/          Business Permit Application — human flow + agent flow, side by side
├── docs/                       this spec set + VitePress site config
├── .github/workflows/          ci.yml, release.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json                 root scripts only, no runtime deps
```

## Package deep dive

### `@formaccurate/core`

**In scope:** field/form schema types, Zod schema definitions mirroring
`docs/spec-schema.md`, the validation engine (`validateForm(schema, values) -> FieldError[]`),
the visibility rule evaluator, the form state machine, ID generation (form session ids,
submission ids, idempotency key handling), and JSON Schema export for the discovery/schema
endpoints.

**Out of scope:** anything that touches a DOM, a filesystem, a network socket, or `process.env`.
This package must be usable unmodified in a browser bundle, a Node server, a Cloudflare Worker,
or a Deno script. This constraint is enforced in CI by an ESLint rule banning `node:*` and DOM
lib imports in `packages/core/src/**`.

**Key exports:** `AgentFormSchema`, `FieldSchema`, `FormState`, `FieldError`,
`validateForm()`, `evaluateVisibility()`, `createFormState()`, `applyValues()`,
`toJsonSchema()`.

### `@formaccurate/web`

**In scope:** scanning the DOM for `data-fa-form` / `data-fa-field` / `data-fa-action`
attributes, building a `FormState` from real input values, writing agent-set values back into
real inputs (dispatching native `input`/`change` events so frameworks like React notice the
change), and the `window.FormAccurate` bridge.

**Out of scope:** network calls to a backend (that's `server`'s job) — `web` operates purely on
the in-page DOM and `core`'s pure functions. If a page also has a server integration, `web` can
optionally proxy `submit()` to a configured endpoint, but the default is local-only.

### `@formaccurate/server`

**In scope:** the HTTP protocol surface — discovery, schema, state, validate, submit, file
upload — auth middleware, rate limiting, and a `StorageAdapter` interface with an in-memory
reference implementation for dev/test.

```ts
// packages/server/src/storage/adapter.ts
export interface StorageAdapter {
  getState(formId: string, sessionId: string): Promise<FormState | null>;
  saveState(formId: string, sessionId: string, state: FormState): Promise<void>;
  createSubmission(formId: string, sessionId: string, values: Record<string, unknown>): Promise<SubmissionReceipt>;
  getSubmission(submissionId: string): Promise<SubmissionReceipt | null>;
  checkIdempotency(key: string): Promise<SubmissionReceipt | null>;
  recordIdempotency(key: string, receipt: SubmissionReceipt): Promise<void>;
}
```

Real deployments swap the in-memory adapter for Postgres/Redis/etc. by implementing this
interface — the HTTP layer never assumes a specific store.

### `@formaccurate/react`

Thin wrapper: `<FormAccurateProvider formId>` mounts `@formaccurate/web` against its subtree,
and `useFormAccurate()` returns `{ state, setValues, validate, submit }` backed by the same
bridge. No parallel state management — React state is a view over the bridge's state, not a
second source of truth.

### `@formaccurate/mcp`

Wraps a running `@formaccurate/server` instance (local or remote, given a base URL + token) as
MCP tools. This package does not reimplement validation or storage — it is a thin, typed HTTP
client with MCP tool schemas attached. See `docs/spec-protocol.md §MCP tools`.

### `@formaccurate/cli`

`fa lint <schema.json>` runs the same Zod validators from `core` against an authored schema file
and reports errors with file/line context. `fa scaffold <form-id>` generates a starter schema +
example server route. `fa validate <schema.json> --values values.json` runs the validation engine
standalone, useful in CI for teams who author schemas as static JSON.

## Data flow: agent fills and submits a form (server-first path)

1. Agent calls `GET /.well-known/formaccurate.json` → gets the list of forms and their URLs.
2. Agent calls `GET /agent/forms/business-permit-application/schema` → gets the full
   `AgentFormSchema`.
3. Agent calls `PATCH /agent/forms/business-permit-application/values` with a `sessionId` and
   partial values → server calls `core.applyValues()`, persists via `StorageAdapter.saveState`,
   returns the updated `FormState`.
4. Agent calls `POST /agent/forms/business-permit-application/validate` → server calls
   `core.validateForm()`, returns `FormState` with `status: "valid" | "invalid"` and any
   `FieldError[]`.
5. If `schema.consent.required`, agent (or the human it's acting for) must supply a matching
   consent confirmation on submit.
6. Agent calls `POST /agent/forms/business-permit-application/submit` with an `Idempotency-Key`
   header → server re-validates server-side (never trusts client-reported "valid"), calls
   `StorageAdapter.createSubmission`, returns a `SubmissionReceipt`.
7. Server emits a `form.submitted` audit event and, if configured, a `form.submitted` webhook.

Every step operates on the same `FormState`/`AgentFormSchema` shapes whether the caller is the
browser bridge, a raw HTTP client, or an MCP tool — that shared shape, defined once in `core`, is
the entire point of the architecture.
