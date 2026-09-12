# Quality Checklists

Concrete, checkable lists — use these directly, don't paraphrase them from memory.

## Before opening a PR

- [ ] `pnpm build` succeeds for every package touched
- [ ] `pnpm typecheck` — zero errors, zero new `@ts-ignore`/`@ts-expect-error` without a
      justifying comment
- [ ] `pnpm lint` — zero errors, zero warnings
- [ ] `pnpm test` — green, and includes new tests for new behavior (happy path + at least one
      failure/edge path per new function)
- [ ] `pnpm test:e2e` — green, if `web`, `server`, `react`, or `examples/*` changed
- [ ] Every new/changed public export has a TSDoc comment
- [ ] The touched package's `README.md` reflects the change
- [ ] `docs/spec-schema.md` and/or `docs/spec-protocol.md` updated if the schema or protocol
      shape changed
- [ ] `pnpm changeset` added, written from the consumer's perspective
- [ ] No `console.log`, no commented-out code, no `TODO` left in the diff
- [ ] No new runtime dependency without a one-line justification in the PR description
      (see `docs/coding-standards.md §6`)
- [ ] If the change touches `web` or `react`: checked with a screen reader or at minimum
      verified labels/ARIA attributes are preserved through the DOM adapter
- [ ] If the change touches auth, consent, or validation: re-read `SECURITY.md` and confirm
      nothing regresses the threat model

## Reviewer checklist

- [ ] Does the diff match what the PR description claims it does?
- [ ] Are the new tests asserting meaningful output, or just exercising the code path without
      checking results? (Coverage percentage is not sufficient — read the assertions.)
- [ ] Does any new function silently swallow an error or return a fake/default value on an
      unhandled case? (See `AGENTS.md §2`.)
- [ ] Does `packages/core` remain free of DOM/Node imports?
- [ ] Is anything here pseudocode, a stub, or described in a comment as "for now"/"temporary"
      without a tracked issue? If so, request changes — this is a hard blocker per `AGENTS.md`.
- [ ] If the PR touches the schema or protocol spec, was an RFC issue linked (per
      `CONTRIBUTING.md §Changing the schema or protocol`), or is this a backward-compatible
      additive change that doesn't need one?
- [ ] Would a developer reading only the updated README be able to actually use this change?

## Definition of Done by package type

**`core` change:** typed, pure, tested with both valid and invalid inputs, zero DOM/Node
imports, TSDoc present, JSON Schema export still round-trips if schema shape changed.

**`web`/`react` change:** works against a real browser (Playwright), doesn't break framework
change-detection (dispatches native events), accessible (labels/ARIA intact), demo example
updated if the public API changed.

**`server`/`mcp` change:** integration-tested against a real app instance (not mocked handlers),
every new error path returns a documented `code`, auth/scope checks present on every new
state-changing route, idempotency preserved for `submit`-adjacent changes.

**`cli` change:** exit codes tested (0 success, non-zero failure), error messages include
enough context (file, JSON path) to fix the problem without reading source.

**Docs-only change:** every code sample in the diff was actually run against the current API
before committing — a `.md` file with a broken example is a bug, not a docs nit.

## Release checklist (v0.1.0 and beyond)

- [ ] `AGENTS.md §9` "done" definition fully satisfied
- [ ] All six packages build, typecheck, lint, and test cleanly in a fresh clone
      (`rm -rf node_modules && pnpm install && pnpm build && pnpm test`)
- [ ] `examples/demo-server`'s agent-flow script runs start-to-finish and produces a valid
      receipt
- [ ] `examples/vanilla-html` and `examples/react-app` both demonstrate the identical flow
- [ ] Every package has a current, accurate README with a working quickstart
- [ ] `docs/spec-schema.md` and `docs/spec-protocol.md` describe exactly what's implemented —
      no aspirational/future sections mixed in without a clear "not yet implemented" label
- [ ] `SECURITY.md` reporting contact is a real, monitored address (not a placeholder)
- [ ] `pnpm audit --audit-level=high` clean
- [ ] Changesets consumed, versions bumped, changelogs generated, git tag pushed
- [ ] GitHub release notes published
