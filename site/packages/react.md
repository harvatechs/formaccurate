# @formaccurate/react

React 18+ component and hook bindings for FormAccurate, connecting human UI state seamlessly with the in-browser agent bridge.

## Installation

```bash
pnpm add @formaccurate/react @formaccurate/web @formaccurate/core
```

## Public API Reference

### `<FormAccurateProvider>`

Context provider initializing the underlying bridge, registering schemas, and exposing form state to child components.

```tsx
import { FormAccurateProvider } from "@formaccurate/react";
import { businessPermitSchema } from "./schema.js";

function App() {
  return (
    <FormAccurateProvider formId="business-permit-application" schema={businessPermitSchema}>
      <MyPermitForm />
    </FormAccurateProvider>
  );
}
```

### `useFormAccurate(formId?)`

Hook providing reactive form values, validation status, error messages, and submission triggers.

```tsx
import { useFormAccurate } from "@formaccurate/react";

function MyPermitForm() {
  const { values, errors, isSubmitting, setValues, submit } = useFormAccurate();

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <input
        value={values.legal_name ?? ""}
        onChange={(e) => setValues({ legal_name: e.target.value })}
      />
      <button type="submit" disabled={isSubmitting}>Submit</button>
    </form>
  );
}
```
