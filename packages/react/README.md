# @formaccurate/react

React integration for FormAccurate. Provides `<FormAccurateProvider>` and the `useFormAccurate()` hook to make React forms agent-readable and agent-operable without losing native React reactivity.

- **Native React State**: Automatically re-renders host components when an AI agent or browser extension mutates values via the `window.FormAccurate` bridge.
- **Single Source of Truth**: Reads directly from the underlying FormAccurate web bridge, eliminating state divergence and double-handling bugs.
- **Zero Configuration**: Works with standard HTML form inputs and `data-fa-*` annotations.

## Installation

```bash
pnpm add @formaccurate/react @formaccurate/web @formaccurate/core
```

## Quickstart

### 1. Define Schema & Wrap with Provider

```tsx
import React from "react";
import { FormAccurateProvider, useFormAccurate } from "@formaccurate/react";
import type { AgentFormSchema } from "@formaccurate/core";

const contactSchema: AgentFormSchema = {
  $schema: "https://formaccurate.dev/schema/v1.json",
  formId: "contact-form",
  version: "1.0",
  title: "Contact Us",
  actions: [{ id: "submit", label: "Send Message", type: "submit" }],
  fields: [
    { id: "name", type: "string", label: "Full Name", required: true },
    { id: "email", type: "email", label: "Email Address", required: true },
    { id: "message", type: "textarea", label: "Your Message", required: true },
  ],
};

function ContactForm() {
  const { formId, values, errors, isValid, isSubmitting, setValues, submit } =
    useFormAccurate();

  return (
    <form data-fa-form={formId} onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          data-fa-field="name"
          value={(values.name as string) ?? ""}
          onChange={(e) => setValues({ name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          data-fa-field="email"
          value={(values.email as string) ?? ""}
          onChange={(e) => setValues({ email: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          data-fa-field="message"
          value={(values.message as string) ?? ""}
          onChange={(e) => setValues({ message: e.target.value })}
        />
      </div>

      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((err) => (
            <li key={err.fieldId ?? err.code}>{err.message}</li>
          ))}
        </ul>
      )}

      <button type="submit" data-fa-action="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Send Message"}
      </button>
    </form>
  );
}

export function App() {
  return (
    <FormAccurateProvider formId="contact-form" schema={contactSchema}>
      <ContactForm />
    </FormAccurateProvider>
  );
}
```

## API Reference

### `<FormAccurateProvider>`

Wraps a form component subtree to provide context and mount the FormAccurate bridge.

| Prop | Type | Description |
|---|---|---|
| `formId` | `string` | Unique form identifier matching the schema and `data-fa-form` |
| `schema` | `AgentFormSchema` (optional) | Schema to register on mount |
| `debug` | `boolean` (optional) | Enables bridge debug logging in console |
| `children` | `React.ReactNode` | Child elements within this form scope |

### `useFormAccurate(formIdOverride?: string)`

Returns the current reactive form state and mutation methods.

```typescript
const {
  formId,        // Form identifier
  state,         // Current FormState object
  schema,        // Registered AgentFormSchema
  values,        // Key-value record of current field values
  errors,        // Current FieldError array
  isValid,       // True if state.status === "valid"
  isSubmitting,  // True if state.status === "submitting"
  isSubmitted,   // True if state.status === "submitted"
  setValues,     // (newValues: Record<string, unknown>) => FormState
  validate,      // () => FormState
  submit,        // (options?: { consent?: { confirmed: boolean } }) => Promise<SubmissionReceipt>
  bridge,        // Underlying FormAccurateBridge instance
} = useFormAccurate();
```
