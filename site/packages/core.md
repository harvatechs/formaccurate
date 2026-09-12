# @formaccurate/core

The core validation engine, schema definitions, state machine, and receipt hashing algorithms for FormAccurate.

- **Zero dependencies on Node.js or DOM**: Pure TypeScript/ESM.
- **Portability**: Runs in any JavaScript runtime (Node, Bun, Deno, browsers, Cloudflare Workers).

## Installation

```bash
pnpm add @formaccurate/core
```

## Public API Reference

### `validateForm(schema, values)`

Deterministically validates a form's field values against an `AgentFormSchema`.

- Respects conditional visibility rules (`visibleWhen`): hidden fields are skipped during validation.
- Validates field types, regex patterns, number bounds, select options, and required consent declarations.

```typescript
import { validateForm, type AgentFormSchema } from "@formaccurate/core";

const errors = validateForm(schema, {
  legal_name: "Acme Corp",
  email: "invalid-email",
});

// Returns array of FieldError:
// [{ fieldId: "email", code: "type", message: "Contact Email must be a valid email address" }]
```

### `evaluateVisibility(rule, values)`

Evaluates whether a field is currently visible given the current form values:

```typescript
import { evaluateVisibility } from "@formaccurate/core";

const isVisible = evaluateVisibility(
  { field: "business_type", equals: "llc" },
  { business_type: "llc" }
); // true
```

### `createFormStateMachine(schema, initialState?)`

Creates a deterministic state machine managing transitions (`DRAFT` -> `VALIDATING` -> `VALID` / `INVALID` -> `SUBMITTING` -> `SUBMITTED` / `FAILED`).

```typescript
import { createFormStateMachine } from "@formaccurate/core";

const machine = createFormStateMachine(schema);
machine.send({ type: "SET_VALUES", values: { legal_name: "Acme" } });
console.log(machine.getState().status); // "draft"
```

### `computeReceiptChecksum(data)`

Computes a canonical SHA-256 digest (`sha256:...`) over sorted JSON data, guaranteeing deterministic receipts across runtimes.

```typescript
import { computeReceiptChecksum } from "@formaccurate/core";

const checksum = computeReceiptChecksum({
  submissionId: "sub_01M2...",
  formId: "permit-app",
  values: { a: 1, b: 2 }
});
```

### `toJsonSchema(schema)`

Converts an `AgentFormSchema` to standard JSON Schema (Draft 7 / 2020-12) for external tools and LLM function-calling declarations.
