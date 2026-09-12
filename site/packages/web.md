# @formaccurate/web

Browser SDK for FormAccurate. Progressively enhances standard HTML forms using HTML `data-fa-*` attributes and establishes the `window.FormAccurate` runtime bridge.

## Installation

```bash
pnpm add @formaccurate/web
```

## Public API Reference

### `initFormAccurate(options?)`

Initializes the `window.FormAccurate` singleton, registers DOM mutation observers, and scans the document for forms annotated with `data-fa-form`.

```typescript
import { initFormAccurate } from "@formaccurate/web";

const bridge = initFormAccurate({
  autoScan: true,
  debug: false,
});
```

### `window.FormAccurate` Bridge Methods

Once initialized, the bridge exposes standard methods:

- `bridge.listForms()`: Lists all detected form IDs on the page.
- `bridge.getSchema(formId)`: Returns the registered `AgentFormSchema`.
- `bridge.getState(formId)`: Returns current `{ status, values, errors, isDirty }`.
- `bridge.setValues(formId, values)`: Updates DOM input values and triggers change events.
- `bridge.validate(formId)`: Runs client-side validation and highlights DOM error containers.
- `bridge.submit(formId, options?)`: Submits the form and returns a `SubmissionReceipt`.
- `bridge.subscribe(formId, listener)`: Subscribes to reactive state updates.

### HTML Attributes Reference

| Attribute | Target Element | Description |
|---|---|---|
| `data-fa-form="form-id"` | `<form>` | Identifies the form container |
| `data-fa-field="field_id"` | `<input>`, `<select>`, `<textarea>` | Binds DOM input to schema field ID |
| `data-fa-action="submit"` | `<button>` | Binds form submission action button |
| `data-fa-errors` | `<div>` | Container for rendering error messages |
