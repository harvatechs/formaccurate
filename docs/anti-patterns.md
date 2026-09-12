# Anti-Patterns — What This Project Will Not Do or Accept

Two categories: code-quality anti-patterns (how AI-assisted codebases tend to rot) and product
anti-patterns (how this specific project could tip from "agent infrastructure" into "bot-evasion
tool"). Both are hard blockers, not style preferences.

## Code-quality anti-patterns

### Stub functions disguised as implementations

```ts
// ❌ looks implemented, isn't
export function validateForm(schema: AgentFormSchema, values: FormValues): FieldError[] {
  // TODO: implement real validation
  return [];
}
```

An empty-happy-path stub is more dangerous than an obvious `throw new Error("not implemented")`,
because it passes a shallow smoke test and ships. If it's not implemented, it throws loudly or
it doesn't exist yet — it never silently returns success.

### Fabricated example output

Writing a doc example's *expected output* by imagining what the function probably returns,
rather than running the function and pasting real output. Every JSON response body in
`docs/spec-protocol.md` and every package README must be something that was actually produced by
running the code, not authored to look plausible.

### Silent error swallowing

```ts
// ❌
try {
  await storage.saveState(formId, sessionId, state);
} catch {
  // ignore
}
```

If a write fails, the caller needs to know — return a typed failure or let it throw. A `catch`
with no handling is never acceptable (`AGENTS.md §2.4`).

### `any`-driven type escapes

```ts
// ❌
function applyValues(state: any, values: any): any { ... }
```

If you can't express the type, that's a signal the design is unclear — fix the design, don't
paper over it with `any`. See `docs/coding-standards.md §1`.

### Comment-driven honesty theater

```ts
// ❌
// In a real implementation, this would check the database
function sessionExists(id: string): boolean {
  return true;
}
```

If a function can't do the real thing yet, it doesn't get merged with a comment admitting it's
fake. Either implement it or don't add the code path that depends on it yet.

### Copy-pasted validation logic outside `core`

If `web` or `server` reimplements a required-field check or a regex pattern check instead of
calling `core.validateForm()`, that's a bug waiting to happen the moment the two copies drift.
`core` is the single source of truth for validation — see `AGENTS.md §6`.

### Tests that assert nothing meaningful

```ts
// ❌ passes regardless of correctness
it("validates a form", () => {
  const result = validateForm(schema, values);
  expect(result).toBeDefined();
});
```

A test must assert on the actual expected value/shape, including for the negative case (which
field, which error code).

### Over-engineering before the MVP works

Building a plugin system, a visual drag-and-drop form builder, or a generic rules engine for
`visibleWhen` before the core discover→fill→validate→submit loop works end-to-end for one real
form. Follow `docs/roadmap.md`'s order — breadth-first speculation before depth-first correctness
is how these projects stall.

## Product-scope anti-patterns

### CAPTCHA bypass or bot evasion

FormAccurate is not allowed to add features whose purpose is defeating anti-automation measures
on sites that haven't opted in. If a form has a CAPTCHA, the correct behavior is to surface a
`review_required` state and hand off to a human — never to solve, relay, or route around the
challenge. See `SECURITY.md §Consent model`.

### Arbitrary JavaScript in schemas

```jsonc
// ❌ never allowed in a schema
{ "visibleWhen": "values.business_type === 'llc' && Date.now() > 1700000000000" }
```

`visibleWhen` is a closed, declarative rule language (`docs/spec-schema.md`) precisely so a
schema can never smuggle executable logic into an agent's runtime. If a real use case needs logic
this can't express, extend the declarative grammar with an RFC — don't add an `eval` escape
hatch.

### Treating form content as agent instructions

A field's `label` or `description` is data to display or reason about, never a command to
follow. An MCP tool or prompt template that concatenates raw schema text into a system-level
instruction context is a prompt-injection vector — see `SECURITY.md §Prompt-injection defense`.
This applies to every layer, including example agent-integration code in `examples/`.

### Silent PII persistence

No storage adapter may persist submitted field values by default beyond what's needed to compute
a submission's checksum, unless the site operator has explicitly configured persistence and
documented retention. "Just store everything so debugging is easier later" is not an acceptable
justification — see `SECURITY.md §Data handling`.

### Fully autonomous submission as the default

A form with `consent.required: true` must never be submittable without an explicit,
schema-matching consent confirmation, regardless of how convenient a "just auto-submit" mode
would be for a demo. Autonomy is a per-form, per-site opt-in (`SECURITY.md`'s mode 4), never the
library's default behavior.

### Scraping or inferring un-annotated forms

FormAccurate does not include, and will not accept contributions for, heuristics that infer form
structure from arbitrary HTML a site hasn't annotated (e.g., guessing field purposes from
placeholder text or nearby labels using fuzzy matching). That's the vision-model-adjacent
brittleness this project exists to replace — if a form isn't exposed via the schema, it isn't a
FormAccurate form.

### Positioning drift in docs or marketing copy

Any README, blog post, or example that frames this project as "let your agent fill out any
website automatically" instead of "let your website opt into secure agent-assisted form
submission" is a bug in the docs, not a harmless simplification — it invites exactly the misuse
this project's design explicitly refuses to support. Fix the copy in the same PR you notice it.
