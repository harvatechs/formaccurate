# Contributing to FormAccurate

Thanks for considering a contribution. This project is infrastructure other people's forms will
depend on, so the bar is: **correct, tested, documented** — not fast-and-loose. If that's not the
kind of PR you're up for today, small docs fixes and issue triage are just as valuable.

Before contributing code, please read [`AGENTS.md`](./AGENTS.md) — it's the actual rulebook, not
boilerplate. This file is the practical "how do I get set up" companion to it.

## Prerequisites

- Node.js 20 or later
- pnpm 9 or later (`corepack enable` will get you the right version automatically)
- Git

## Getting set up

```bash
git clone https://github.com/harvatechs/formaccurate.git
cd formaccurate
pnpm install
pnpm build
pnpm test
```

If all of that goes green, you're ready. If it doesn't, that's a bug — please open an issue
with your OS, Node version, and the failing output before working around it.

## Repository layout

```
formaccurate/
├── packages/
│   ├── core/          @formaccurate/core
│   ├── web/            @formaccurate/web
│   ├── server/         @formaccurate/server
│   ├── react/           @formaccurate/react
│   ├── mcp/             @formaccurate/mcp
│   └── cli/             @formaccurate/cli
├── examples/
│   ├── vanilla-html/
│   ├── react-app/
│   └── demo-server/     the Business Permit Application reference demo
├── docs/                 the specs and guides linked from README.md
└── .github/workflows/    CI
```

See [`docs/architecture.md`](./docs/architecture.md) for what belongs where.

## Day-to-day commands

```bash
pnpm dev              # runs affected packages in watch mode (Turborepo)
pnpm --filter @formaccurate/core test:watch
pnpm lint --fix
pnpm typecheck
pnpm changeset        # record a user-facing change before opening the PR
```

## Branching & commits

- Branch from `main`: `feat/short-description`, `fix/short-description`, `docs/short-description`
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(core): add visibleWhen anyOf support`
  - `fix(server): return 409 on idempotency key replay with different body`
  - `docs(spec-protocol): document file upload token flow`
- Keep PRs scoped to one package where possible. Cross-package PRs are fine when the change
  genuinely spans layers (e.g., adding a new field type touches `core`, `web`, and both spec
  docs) — just say so in the description.

## Changesets

Every user-facing change (new export, changed behavior, new endpoint, new schema field) needs a
changeset:

```bash
pnpm changeset
```

Write the summary from the consumer's perspective: *"Added `visibleWhen.anyOf` support to
conditional field visibility"*, not *"refactored the evaluator function."* This becomes the
changelog entry.

## Before opening a PR

Run through [`docs/quality-checklist.md`](./docs/quality-checklist.md). At minimum:

```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

PRs that don't pass CI won't be reviewed until they do — please don't ask for an exception.

## Changing the schema or protocol

`docs/spec-schema.md` and `docs/spec-protocol.md` describe a *protocol*, not just this
repo's implementation. Other people may build FormAccurate-compatible servers in other
languages. Because of that, changes to field types, the discovery format, REST endpoint shapes,
or MCP tool signatures need an RFC before code:

1. Open an issue titled `RFC: <change>` describing the problem, the proposed shape, and
   backward-compatibility impact.
2. Once there's rough consensus (a maintainer approval is enough pre-1.0), open the
   implementation PR referencing the RFC issue, updating the relevant spec doc in the same PR.

Bug fixes and additive, backward-compatible field options don't need an RFC — use judgment, and
a maintainer will ask for one if needed.

## Code of Conduct

Be respectful, assume good faith, keep disagreements about the work and not the person. Reports
go to the maintainers via the email in `SECURITY.md`.

## Good first contributions

- New field type validators in `@formaccurate/core` (with full test coverage)
- Storage adapters for `@formaccurate/server` (Postgres, Redis, SQLite) — implemented against
  the `StorageAdapter` interface in `docs/architecture.md`
- Additional examples under `examples/`
- Docs corrections — if a code sample in `docs/` doesn't actually run, that's a real bug, please
  report or fix it
