# Roadmap

Work through these milestones **in order** — see `AGENTS.md §5` for why. Each milestone lists a
goal, concrete deliverables, and exit criteria you can actually check against, not vibes.

## M0 — Repository scaffolding

**Goal:** a monorepo that builds nothing yet, but is fully wired for the tooling every later
milestone depends on.

- [ ] `pnpm-workspace.yaml` covering `packages/*` and `examples/*`
- [ ] Root `package.json` with scripts: `build`, `dev`, `lint`, `typecheck`, `test`, `test:e2e`,
      `changeset`, delegating to Turborepo
- [ ] `turbo.json` with correct task dependency graph (`build` depends on upstream packages'
      `build`; `test` depends on `build`)
- [ ] Root `tsconfig.base.json` (strict: true, ESM, noUncheckedIndexedAccess: true) extended by
      each package
- [ ] ESLint flat config (typescript-eslint) + Prettier config at root, shared by all packages
- [ ] Custom ESLint rule or `eslint-plugin-boundaries` config enforcing `AGENTS.md §6`'s
      package dependency table
- [ ] `.github/workflows/ci.yml`: install → build → typecheck → lint → test → test:e2e
- [ ] `.github/workflows/release.yml`: Changesets publish flow on merge to `main`
- [ ] `LICENSE` (MIT), `.gitignore`, `.npmrc` (pnpm strict peer deps)
- [ ] Empty package skeletons for all six packages: `package.json`, `tsup.config.ts`,
      `src/index.ts` exporting nothing yet, each building successfully via `pnpm build`

**Exit criteria:** `pnpm install && pnpm build && pnpm lint && pnpm typecheck` succeed on a
freshly cloned repo with zero source logic written yet.

## M1 — `@formaccurate/core`

**Goal:** the schema types, validation engine, and state machine are correct, complete, and
fully tested — everything downstream is an adapter around this.

- [ ] `schema/` — Zod definitions for every field type in `docs/spec-schema.md` (`string`,
      `textarea`, `email`, `url`, `tel`, `integer`, `number`, `boolean`, `date`, `datetime`,
      `time`, `select`, `radio`, `multiselect`, `file`, `signature`, `address`, `group`), plus
      `AgentFormSchema`, `FormStep`, `FormAction`, `AuthRequirement`, `ConsentRequirement`
- [ ] `visibility/evaluate.ts` — `evaluateVisibility(rule, values): boolean` supporting `equals`,
      `notEquals`, `in`, `notIn`, `allOf`, `anyOf`, with tests for every combinator including
      nested `allOf`/`anyOf`
- [ ] `validate/validate-form.ts` — `validateForm(schema, values): FieldError[]` implementing
      every rule in `docs/spec-schema.md §Validation semantics (normative)`, including hidden
      fields being excluded and consent-required form-level errors
- [ ] `state/state-machine.ts` — `createFormState()`, `applyValues()`,
      status transitions (`draft → validating → valid|invalid`, `valid → submitting →
      submitted|failed`), with a test asserting every legal and illegal transition
- [ ] `ids/` — `generateSessionId()`, `generateSubmissionId()` (ULID-based for sortability),
      idempotency key validation helper
- [ ] `json-schema/to-json-schema.ts` — `toJsonSchema(schema): object` round-trip tested against
      the Business Permit Application example from `docs/spec-schema.md`
- [ ] `index.ts` exporting only the public surface listed in `docs/architecture.md`
- [ ] Test coverage: every field type has at least one passing-value test and one
      failing-value test per constraint it supports (min/max/pattern/etc.)
- [ ] `packages/core/README.md` with real, runnable usage examples

**Exit criteria:** `pnpm --filter @formaccurate/core test` is green with no skipped tests; a
consumer can `import { validateForm, AgentFormSchema } from "@formaccurate/core"` and validate the
Business Permit Application example end-to-end from the README alone.

## M2 — `@formaccurate/web`

**Goal:** a real HTML page with a real form becomes agent-operable via the browser bridge.

- [ ] `bind.ts` — scans for `data-fa-form` / `data-fa-field` / `data-fa-action` / `data-fa-step`,
      builds an internal registry, observes `MutationObserver` for dynamically added forms
- [ ] `dom-adapter.ts` — reads values from real inputs (text, select, checkbox, radio, file
      input triggering the upload flow) into a `FormState.values` shape; writes agent-set values
      back by setting `.value`/`.checked` and dispatching native `input`/`change` events
- [ ] `bridge.ts` — implements the full `FormAccurateBridge` interface from
      `docs/spec-protocol.md`, backed by `core`'s pure functions
- [ ] `initFormAccurate()` — the single public entry point, idempotent if called twice
- [ ] `examples/vanilla-html/index.html` — the Business Permit Application form, annotated,
      with a small script demonstrating both a human typing into it and a simulated agent call
      to `window.FormAccurate.setValues(...)`
- [ ] Playwright test: loads the fixture in a real browser, calls the bridge from page context,
      asserts the DOM reflects agent-set values and that validation errors surface correctly
- [ ] `packages/web/README.md`

**Exit criteria:** opening `examples/vanilla-html/index.html` in a browser and running the
provided script in the devtools console fills, validates, and reports a submission — no backend
required.

## M3 — `@formaccurate/server`

**Goal:** the full REST protocol from `docs/spec-protocol.md` works end-to-end against the
Business Permit Application, backed by the in-memory storage adapter.

- [ ] `storage/adapter.ts` — `StorageAdapter` interface (see `docs/architecture.md`)
- [ ] `storage/memory-adapter.ts` — full in-memory implementation, including idempotency key
      tracking with TTL
- [ ] `auth/auth-provider.ts` — `AuthProvider` interface (`verifyToken(token): { subject,
      scopes } | null`) + a `staticApiKeyAuthProvider(keys)` reference implementation
- [ ] `rate-limit/` — `RateLimiter` interface + in-memory token-bucket implementation
- [ ] `discovery.ts` — generates `/.well-known/formaccurate.json` from the configured `forms`
      array
- [ ] `routes/schema.ts`, `routes/state.ts`, `routes/validate.ts`, `routes/submit.ts`,
      `routes/files.ts`, `routes/receipts.ts` — implementing every endpoint and error code in
      `docs/spec-protocol.md`
- [ ] `createFormAccurateServer(options)` — the public entry point returning a mountable Hono
      app
- [ ] Integration tests (Vitest + Hono's test client, no real network): every endpoint, every
      documented error code, idempotency replay (same key/same body, same key/different body),
      consent-required rejection, expired file token rejection
- [ ] `examples/demo-server/` — a runnable Node server exposing the Business Permit Application,
      with a `scripts/agent-flow.ts` that plays out the full discover → fill → validate →
      consent → submit → receipt sequence via plain `fetch()` calls, printable/runnable with one
      command
- [ ] `packages/server/README.md`

**Exit criteria:** `pnpm --filter demo-server dev` then `pnpm --filter demo-server agent-flow`
completes a real submission and prints a receipt with a valid checksum.

## M4 — `@formaccurate/react`

- [ ] `<FormAccurateProvider formId>` mounting `@formaccurate/web` against its subtree on mount,
      tearing down the observer on unmount
- [ ] `useFormAccurate()` returning `{ state, setValues, validate, submit }`, re-rendering on
      bridge `change`/`validate`/`submit` events
- [ ] `examples/react-app/` — the same Business Permit Application as a React form using the hook
- [ ] React Testing Library tests for the provider/hook
- [ ] `packages/react/README.md`

**Exit criteria:** `examples/react-app` demonstrates the identical agent-fill flow as the vanilla
HTML example, proving the schema/state shapes are truly framework-agnostic.

## M5 — `@formaccurate/mcp`

- [ ] One file per tool under `tools/`, each a thin typed HTTP client call against a configured
      `@formaccurate/server` base URL, matching `docs/spec-protocol.md §MCP tools` exactly
- [ ] `server.ts` registering all tools with static, non-form-derived descriptions
- [ ] Tested against the MCP Inspector CLI and against `examples/demo-server`, completing a full
      discover→submit flow purely through MCP tool calls
- [ ] `packages/mcp/README.md` including a config snippet for at least one popular MCP client

**Exit criteria:** an MCP client can complete the full Business Permit Application flow without
any code beyond configuring the server URL and token.

## M6 — `@formaccurate/cli`

- [ ] `fa lint <schema.json>` — runs `core`'s Zod schemas against an authored file, reports
      errors with a clear path (`fields[3].maxLength`) and message
- [ ] `fa validate <schema.json> --values <values.json>` — runs `validateForm` standalone
- [ ] `fa scaffold <form-id>` — generates a starter schema file + a snippet for registering it
      with `createFormAccurateServer`
- [ ] Tests covering exit codes (0 for valid, non-zero for invalid) so it's CI-usable
- [ ] `packages/cli/README.md`

**Exit criteria:** `npx @formaccurate/cli lint examples/demo-server/forms/business-permit.json`
exits 0 against the real example schema, and exits non-zero with a clear message against a
deliberately broken copy.

## M7 — Cross-cutting demo polish

- [ ] `examples/demo-server` shows the human-fill flow (plain HTML form, no agent) and the
      agent-fill flow (the `agent-flow.ts` script) against the *same* schema and server, side by
      side, so the value proposition is visible without reading code
- [ ] README at repo root links to and briefly narrates this demo

## M8 — Documentation site

- [ ] VitePress site under `docs/` (or `site/` if that avoids conflicting with the existing
      `docs/*.md` spec files — resolve this with an ADR before starting)
- [ ] API reference generated via TypeDoc from each package's public exports
- [ ] The spec docs (`spec-schema.md`, `spec-protocol.md`) published as the canonical protocol
      reference, since third parties should be able to implement against them without reading
      TypeScript

## M9 — v0.1.0 release

- [ ] Full pass through `docs/quality-checklist.md`'s release checklist
- [ ] Every package has a real, current README
- [ ] `pnpm changeset version` + `pnpm changeset publish` produces correctly-scoped npm packages
- [ ] Tag `v0.1.0`, GitHub release notes generated from changesets
- [ ] Confirm `AGENTS.md §9`'s "done" definition is fully met
