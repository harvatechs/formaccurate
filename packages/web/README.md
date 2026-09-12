# @formaccurate/web

Browser SDK for FormAccurate. Progressively enhances standard HTML forms via `data-fa-*` attributes and exposes the `window.FormAccurate` bridge for browser agents, automated workflows, and in-page scripts.

- **Progressive enhancement**: Works with standard HTML forms without requiring full application rewrites.
- **Framework friendly**: Dispatches native events with prototype setter bindings, ensuring React, Vue, and Svelte state updates seamlessly.
- **Zero DOM guessing**: Exposes programmatic schemas, typed states, and deterministic validation directly to agents.

## Installation

```bash
pnpm add @formaccurate/web @formaccurate/core
```

## Quickstart

### 1. Annotate your HTML Form

```html
<form data-fa-form="contact-form">
  <label for="name">Full Name</label>
  <input id="name" name="name" data-fa-field="name" type="text" required>

  <label for="email">Email</label>
  <input id="email" name="email" data-fa-field="email" type="email" required>

  <button type="submit" data-fa-action="submit">Submit</button>
</form>

<script type="module">
  import { initFormAccurate } from "@formaccurate/web";
  initFormAccurate();
</script>
```

### 2. Operate via `window.FormAccurate` Bridge

An AI agent or browser extension can interact directly with the form without screenshots or vision models:

```js
// 1. Discover registered forms
const forms = window.FormAccurate.listForms();
// [{ formId: "contact-form", title: "contact-form" }]

// 2. Read schema
const schema = window.FormAccurate.getSchema("contact-form");

// 3. Set values programmatically (updates real DOM inputs)
window.FormAccurate.setValues("contact-form", {
  name: "Jane Doe",
  email: "jane@example.com",
});

// 4. Validate
const state = window.FormAccurate.validate("contact-form");
if (state.status === "valid") {
  // 5. Submit and receive cryptographic receipt
  const receipt = await window.FormAccurate.submit("contact-form");
  console.log("Submitted with ID:", receipt.submissionId);
  console.log("Checksum:", receipt.checksum);
}
```

## HTML Data Attributes Reference

| Attribute | Placed on | Description |
|---|---|---|
| `data-fa-form="<formId>"` | `<form>` or container | Registers element as a managed form |
| `data-fa-field="<fieldId>"` | `input`, `select`, `textarea` | Binds element to a field in the schema |
| `data-fa-action="submit\|next\|previous\|saveDraft"` | `<button>` | Binds element to a FormAction |
| `data-fa-step="<stepId>"` | container | Marks a step boundary in multi-step forms |
| `data-fa-errors` | container | Target element for rendering form-level errors |

## Events API

Subscribe to form lifecycle events:

```js
const unsubscribe = window.FormAccurate.on("change", ({ formId, values }) => {
  console.log(`Form ${formId} values changed:`, values);
});

window.FormAccurate.on("validate", ({ formId, status, errors }) => {
  console.log(`Validation result: ${status}`, errors);
});

window.FormAccurate.on("submit", ({ formId, receipt }) => {
  console.log(`Form submitted: ${receipt.submissionId}`);
});
```
