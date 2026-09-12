# Coding Standards

These are enforced, not suggested — CI fails the build if they're violated where tooling can
check them, and reviewers block PRs where it can't.

## 1. TypeScript configuration baseline

Every package extends the root `tsconfig.base.json`:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are not negotiable — they catch the
exact class of bug ("field exists on the type but not at runtime") this project cannot afford.

## 2. Naming conventions

| What | Convention | Example |
|---|---|---|
| Files | kebab-case | `validate-form.ts`, `state-machine.ts` |
| Types / interfaces | PascalCase | `AgentFormSchema`, `FieldError` |
| Functions / variables | camelCase | `validateForm`, `sessionId` |
| Constants (true constants, not config) | UPPER_SNAKE_CASE | `DEFAULT_TOKEN_TTL_MS` |
| Schema field ids (in JSON, not TS) | snake_case | `legal_name`, `employee_count` |
| Test files | colocated, `*.test.ts` next to the file under test | `validate-form.ts` → `validate-form.test.ts` |

## 3. File structure per package

```
packages/<name>/
├── src/
│   ├── <feature>/
│   │   ├── <thing>.ts
│   │   └── <thing>.test.ts
│   └── index.ts        # public exports ONLY — no logic lives here
├── README.md
├── package.json
└── tsup.config.ts
```

`index.ts` is a pure re-export barrel. If you find business logic in an `index.ts`, move it.

## 4. Exports: named only, no default exports

```ts
// ✅
export function validateForm(schema: AgentFormSchema, values: FormValues): FieldError[] { /* ... */ }

// ❌
export default function validateForm(...) { /* ... */ }
```

Named exports make refactors, auto-imports, and re-exports unambiguous, and prevent the
"default export renamed differently in every file that imports it" drift that makes large
codebases hard to navigate. This is enforced via `eslint-plugin-import`'s
`import/no-default-export` rule, with a narrow exception for framework-mandated defaults (none
currently exist in this project — React components use named exports too).

## 5. Runtime boundary enforcement

`@formaccurate/core` must not import `node:*` modules or reference DOM lib types (`Window`,
`Document`, `HTMLElement`, etc.). This is enforced by an ESLint override scoped to
`packages/core/src/**` using `no-restricted-imports` for `node:*` and a `tsconfig` for `core`
that does not include the `dom` lib. If a core test genuinely needs a Node API (e.g., reading a
fixture file), that code lives in the test file, not in `src/`.

## 6. Dependency policy

Every new runtime dependency added to any package must be justified in the PR description:
what it does, why it can't be reasonably hand-rolled, and its approximate bundle size impact for
browser-facing packages (`web`, `react`). Dev-only tooling dependencies (test runners, linters)
don't need this justification. Prefer zero new dependencies over one — this is a library other
people's `node_modules` will contain; every dependency is inherited by every consumer.

## 7. Error handling pattern

Two distinct failure categories, handled two different ways:

**Expected, data-shaped failures** (validation errors, "form not found," "consent required") are
**returned as typed values**, never thrown:

```ts
export function validateForm(schema: AgentFormSchema, values: FormValues): FieldError[] {
  // returns [] on success, never throws for "the data was invalid"
}
```

**Unexpected/programmer/infra failures** (a malformed schema passed where a valid one was
required, a storage adapter's connection drop) are **thrown as typed errors**:

```ts
export class InvalidSchemaError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid AgentFormSchema: ${issues.join(", ")}`);
    this.name = "InvalidSchemaError";
  }
}
```

Never throw a bare `Error("something went wrong")` — always a named subclass or a typed return.
Never `catch (e) {}` — at minimum, log and rethrow or return a typed failure.

## 8. Documentation requirements

Every exported function, type, and class gets a TSDoc block:

```ts
/**
 * Validates form values against a schema's field constraints and consent requirements.
 *
 * Hidden fields (per `visibleWhen`) are excluded from required-ness checks. This function is
 * pure and deterministic: the same schema and values always produce the same result, since both
 * the browser bridge and the server rely on that guarantee independently.
 *
 * @param schema - the form schema to validate against
 * @param values - the current field values, keyed by field id
 * @returns an empty array if the form is submittable, otherwise one entry per violation
 */
export function validateForm(schema: AgentFormSchema, values: FormValues): FieldError[] {
```

## 9. Testing standards

- Every module gets a colocated `*.test.ts`.
- Every public function gets at least one happy-path test and one failure/edge-case test.
- `core`: unit tests only, no I/O, no mocking needed since there's nothing to mock.
- `web`: Playwright tests against real HTML fixtures in `e2e/fixtures/`, not JSDOM
  simulations — DOM event dispatch behavior (native `input`/`change` events, framework
  detection) must be verified in a real browser engine.
- `server`: integration tests using Hono's built-in test client against a real app instance with
  the in-memory storage adapter — not mocked route handlers.
- Coverage is a signal, not a target to game: a 100%-covered validator that never asserts on
  actual output values is worse than an 80%-covered one with meaningful assertions. Reviewers
  check assertion quality, not just the coverage percentage.

## 10. Formatting & linting enforcement

- Prettier formats on save / pre-commit via a git hook (`simple-git-hooks` + `lint-staged`, kept
  intentionally lightweight rather than pulling in Husky's full feature set).
- `pnpm lint` runs ESLint across the workspace; zero warnings allowed in CI (`--max-warnings=0`).
- Import order is enforced (`eslint-plugin-simple-import-sort`): node builtins → external
  packages → internal workspace packages → relative imports.

## 11. Comments

Comments explain **why**, not **what** — the code already says what. A comment justifying an
`@ts-expect-error`, a non-obvious ordering dependency, or a deliberate deviation from an
otherwise-expected pattern is welcome. A comment restating the function name in prose is not.
