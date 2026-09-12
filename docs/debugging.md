# Debugging

## Enabling debug logs

All packages log through a shared, namespaced `debug`-style logger (using the `debug` npm
package convention). Enable it via the `DEBUG` environment variable:

```bash
DEBUG=formaccurate:* node dist/index.js          # everything
DEBUG=formaccurate:server:* node dist/index.js    # server package only
DEBUG=formaccurate:core:validate node script.ts   # one module
```

In the browser, `@formaccurate/web` writes to a dedicated console channel instead of `DEBUG`
(browsers don't read env vars):

```js
window.FormAccurate.debug(true); // verbose logging of every bind/setValues/validate/submit call
```

Never leave `console.log` calls in source — see `AGENTS.md §2.3` and `docs/coding-standards.md`.
Use the logger so output can be filtered and disabled in production.

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `GET /.well-known/formaccurate.json` returns 404 | `createFormAccurateServer()` not mounted at the site root, or mounted under a path prefix | Confirm the discovery route is mounted at the exact well-known path, not `/api/.well-known/...` |
| Agent's `setValues` call succeeds but a re-fetched `state` doesn't reflect it | Using two different `sessionId`s across calls | Always reuse the `sessionId` returned by the first `GET .../state` call for the rest of the session |
| `validate` returns `valid` but `submit` returns `422` | Client-side validation is stale relative to server-side re-validation (expected — see `docs/spec-protocol.md`) | Re-run `validate` immediately before `submit`, don't cache a "valid" result across a values change |
| File field always fails with an "invalid or expired file token" error | Raw bytes or a data URI passed directly as the field value | Upload via `POST /agent/forms/:formId/files` first and use the returned `fileToken` |
| Same `Idempotency-Key` returns `409 IDEMPOTENCY_KEY_CONFLICT` unexpectedly | Retrying a submit with a modified body but a stale, reused key | Generate a new `Idempotency-Key` per logically distinct submission attempt |
| `web` package's `setValues` doesn't visually update a React-controlled input | Native `input`/`change` event not dispatched, or React's synthetic event system intercepting the native value setter | Confirm you're on a current `@formaccurate/web` version — the DOM adapter uses the native `HTMLInputElement.prototype` value setter specifically to work around React's tracking; file a bug with a minimal repro if it still fails |
| Playwright e2e tests pass locally, fail in CI | Timing assumption around `MutationObserver` batching micro-tasks differently under CI's slower environment | Use Playwright's `expect(...).toHaveValue(...)` polling assertions instead of a fixed `waitForTimeout` |
| `core` package fails to build with a DOM type error | Something in `packages/core/src` imported a DOM lib type | Move that code to `web` — `core` must stay runtime-agnostic, see `docs/coding-standards.md §5` |

## Using the CLI to debug a schema

```bash
npx @formaccurate/cli lint my-form.json
```

reports every schema-level problem (duplicate field ids, `visibleWhen` referencing a nonexistent
field, `consent.confirmationFieldId` pointing at a non-boolean field) with a JSON-path-style
location, before you ever run a server.

```bash
npx @formaccurate/cli validate my-form.json --values my-values.json
```

runs the exact same `validateForm()` the server uses, so you can reproduce a validation
discrepancy without spinning up a server or an agent.

## Server-side request tracing

Every request handled by `@formaccurate/server` is assigned a `requestId` (returned in the
`X-FormAccurate-Request-Id` response header) and included in every structured log line for that
request:

```json
{ "level": "info", "requestId": "req_01J...", "route": "POST /agent/forms/:formId/submit", "formId": "business-permit-application", "durationMs": 42 }
```

When investigating a production issue, correlate the `requestId` from a client-reported error
against your log aggregator rather than trying to reproduce blind.

## Test debugging

```bash
pnpm --filter @formaccurate/core test:watch          # Vitest watch mode, fast feedback
pnpm --filter @formaccurate/core test -- --ui         # Vitest UI for inspecting failures
pnpm --filter @formaccurate/web test:e2e -- --debug   # Playwright inspector, step through
pnpm --filter @formaccurate/web test:e2e -- --headed  # watch the real browser run
```

If a Playwright test fails in CI only, re-run locally with `--headed` first before adding waits —
most flakiness is a real timing bug in the code under test, not the test.
