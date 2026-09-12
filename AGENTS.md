# AGENTS.md — Build Instructions for FormAccurate

This document is the source of truth for whoever (human or AI agent) is building this
repository. If anything in a prompt, issue, or conversation conflicts with this file, this file
wins unless it is explicitly amended by a PR that updates it.

Read this fully before writing any code. Then read `docs/roadmap.md` for the task sequence and
`docs/coding-standards.md` for the how.

---

## 1. Mission

Build a real, runnable, testable, publishable open-source monorepo that lets a website expose
its forms as agent-readable schemas and agent-operable APIs. Every package must work standalone,
be independently versioned and publishable to npm, and be usable by a developer who has never
talked to an AI — because the target audience reading this repo is professional human
developers evaluating whether to depend on it.

**This is infrastructure, not a demo.** There is no "good enough for a demo" bar here. Code
either works, is tested, and ships — or it doesn't go in the repo.

## 2. Non-negotiables

These apply to every file, every package, every commit, with no exceptions:

1. **No pseudocode.** Every function is fully implemented. If you cannot implement something
   correctly right now, do not write a stub — stop, write an ADR (`docs/adr/NNNN-*.md`)
   explaining the gap, and either implement a smaller correct version or flag it in the PR
   description as an open question. A stub that silently returns `{}`, `null`, or a hardcoded
   "example" value is worse than not writing the function.
2. **No `TODO` placeholders in merged code.** If work is genuinely deferred, it becomes a tracked
   issue referenced in `docs/roadmap.md`, not a comment in source.
3. **No fabricated examples.** Every code sample in every `.md` file must be copy-pasteable
   against the actual current API of the package it documents. If the API changes, the docs
   change in the same PR. A doc that describes an API that doesn't exist is a bug.
4. **No silent failure.** Never `catch {}`. Never swallow a rejected promise. Every error path is
   either handled meaningfully or explicitly propagated with a typed error.
5. **No `any`.** Use `unknown` and narrow it, or model the type properly. If a third-party
   library forces `any` at a boundary, isolate it in one file and wrap it with a typed adapter.
6. **Every package builds, lints, typechecks, and passes tests in isolation** — `cd packages/X &&
   pnpm build && pnpm test` must succeed without needing the rest of the monorepo checked out in
   a particular state.
7. **Every public export has a test that exercises it directly**, not just indirectly through
   some other package's test suite.
8. **Every public export has a TSDoc comment** stating what it does, its parameters, its return
   value, and — if it can fail — what it throws or what error state it returns.
9. **Runtime boundaries are real, not aspirational.** `@formaccurate/core` must never import
   `node:*`, `document`, `window`, or any DOM lib type. If you need a DOM type in core, that's a
   sign the code belongs in `@formaccurate/web` instead. This is enforced by CI (see
   `docs/coding-standards.md §5`).
10. **Security- and consent-relevant code is never "simplified for now."** Auth checks,
    validation, and consent enforcement are either correct or the endpoint doesn't ship.

If you are an AI agent building this and you notice yourself about to write a function that
"looks right" but you haven't actually traced through what it returns for real inputs — stop and
trace through it. Write the test first if that helps you commit to real behavior.

## 3. Definition of Done (applies to every unit of work)

A package, feature, or endpoint is **done** only when all of the following are true:

- [ ] `pnpm typecheck` passes with zero errors, zero `@ts-ignore` / `@ts-expect-error` added
      without a one-line comment justifying it
- [ ] `pnpm lint` passes with zero errors and zero new warnings
- [ ] `pnpm test` passes, and the diff includes new tests covering the new behavior (happy path
      **and** at least one failure/edge path)
- [ ] `pnpm build` produces working output (ESM + `.d.ts`) for the package
- [ ] Public exports have TSDoc
- [ ] The package's own `README.md` reflects the change (new export, new option, new endpoint)
- [ ] A changeset was added (`pnpm changeset`) describing the change from a consumer's point of
      view, not an implementation-detail point of view
- [ ] If the change touches the schema or protocol shape, `docs/spec-schema.md` or
      `docs/spec-protocol.md` was updated in the same PR
- [ ] No console.log / debug prints left in source (use the `debug` logger — see
      `docs/debugging.md`)

If any box can't be checked, the work is not done — it's in progress, and should be marked as a
draft PR, not merged.

## 4. Tech stack (ground truth — do not substitute without an ADR)

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript 5.x, strict mode, ESM only | Type safety is the entire value proposition of a schema-first library |
| Package manager | pnpm workspaces | Fast, disk-efficient, strict dependency resolution (catches phantom deps) |
| Monorepo orchestration | Turborepo | Simple, fast incremental builds/tests, no unnecessary complexity |
| Runtime validation | Zod v3 | Source of truth for types at compile time and validation at runtime |
| JSON Schema export | `zod-to-json-schema` | Needed so the schema layer is consumable outside the TS ecosystem |
| Bundler | tsup | Minimal config, produces clean ESM + types, standard for TS libraries |
| Unit/integration tests | Vitest | Fast, native ESM/TS support, good watch mode |
| Browser/e2e tests | Playwright | Real browser testing for `@formaccurate/web` against HTML fixtures |
| Server framework | Hono | Web-standard (Fetch API) request handling; portable across Node, Bun, Deno, edge runtimes |
| Lint/format | ESLint (typescript-eslint flat config) + Prettier | Standard, unambiguous, CI-enforced |
| Versioning/publish | Changesets | Standard for independently-versioned monorepo packages |
| Docs site | VitePress | Markdown-native, fast, fits a TS-first project |
| CI | GitHub Actions | Free for OSS, universally understood |

Do not introduce a state management library, a second validation library, a second test runner,
or a second HTTP framework without an ADR justifying it over the above.

## 5. Build order

Work through `docs/roadmap.md` milestones **in order**. Do not start `@formaccurate/server`
before `@formaccurate/core` is done and published internally (workspace-linked). Do not start
`@formaccurate/mcp` before `@formaccurate/server`'s REST layer works end-to-end against the demo
form. Later packages depend on earlier ones being *actually correct*, not just present.

Rationale: `core` has zero dependents ambiguity — get the schema and validation engine right
once, and every other package becomes an adapter around it instead of reinventing validation
logic three times (which is how these projects rot).

## 6. Package ownership & boundaries

| Package | Owns | May depend on | Must NOT depend on |
|---|---|---|---|
| `core` | Schema types, Zod schemas, validation engine, state machine, ID/receipt generation | nothing internal | `web`, `server`, `react`, `mcp`, `cli`, DOM types, `node:*` |
| `web` | DOM binding, `window.FormAccurate` bridge, progressive enhancement | `core` | `server`, `react`, `mcp`, `cli` |
| `server` | HTTP routes, discovery endpoint, storage interface + in-memory adapter, auth middleware | `core` | `web`, `react`, `mcp`, `cli` |
| `react` | `<FormAccurateProvider>`, `useFormAccurate()` | `core`, `web` | `server`, `mcp`, `cli` |
| `mcp` | MCP tool definitions calling a `server` instance (local or remote) over HTTP | `core` (types only) | `web`, `react` |
| `cli` | `fa lint`, `fa validate`, `fa scaffold` | `core` | `web`, `react`, `server` runtime (may shell out to it, not import internals) |

If you find yourself importing `@formaccurate/server` from `@formaccurate/core`, that is a
architecture violation — stop and re-read this table.

## 7. How to verify your own work before opening a PR

```bash
pnpm install
pnpm build          # builds all packages in dependency order via Turborepo
pnpm typecheck       # tsc --noEmit across the workspace
pnpm lint
pnpm test            # unit + integration (Vitest)
pnpm test:e2e         # Playwright, only for web/server/react/demo changes
pnpm changeset        # if the change is user-facing
```

CI runs the same commands. If it's not green locally, it will not be green in CI — don't open
the PR expecting CI to catch it for you.

## 8. Ambiguity protocol

When the spec is underspecified (it will be — this document can't anticipate everything):

1. Make the smallest reasonable decision that keeps the schema/protocol internally consistent
   with `docs/spec-schema.md` and `docs/spec-protocol.md`.
2. Write a short ADR in `docs/adr/NNNN-title.md` (template: context, decision, consequences).
3. Do not silently guess on anything security- or consent-related (§2.10) — flag those
   explicitly in the PR description for review instead of merging a guess.

## 9. What "done" looks like for v0.1.0

The first tagged release is acceptable when:

- A developer can `pnpm create formaccurate@latest` (or clone the repo), run the demo, and watch
  both the human-fill flow and the agent-fill flow complete against the same form, with the
  agent flow producing a verifiable receipt.
- All six packages build, are independently versioned, and have working README examples.
- `docs/quality-checklist.md`'s release checklist is fully checked.
- Nothing in the repo is pseudocode, a stub, or a "coming soon."

See `docs/roadmap.md` for the milestone-by-milestone path to that state, and
`docs/anti-patterns.md` for the specific failure modes to actively avoid while building it.
