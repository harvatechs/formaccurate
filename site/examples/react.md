# React 18 Integration Example

The `examples/react-app` example demonstrates how to build responsive React applications that are natively accessible to both humans and AI agents.

## Running the Example

```bash
pnpm --filter react-app dev
```

Navigate to `http://localhost:5173` to see the side-by-side demonstration:
- **Left Column**: Interactive React form utilizing the `useFormAccurate()` hook.
- **Right Column**: Live Agent Bridge Inspector that monitors `window.FormAccurate` and allows triggering simulated agent actions.

## Key Code Snippet

```tsx
import { FormAccurateProvider, useFormAccurate } from "@formaccurate/react";
import { businessPermitSchema } from "./schema.js";

function FormContainer() {
  return (
    <FormAccurateProvider formId="business-permit-application" schema={businessPermitSchema}>
      <BusinessPermitForm />
    </FormAccurateProvider>
  );
}

function BusinessPermitForm() {
  const { values, errors, setValues, submit, isSubmitting } = useFormAccurate();

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <input
        type="text"
        data-fa-field="legal_name"
        value={(values.legal_name as string) ?? ""}
        onChange={(e) => setValues({ legal_name: e.target.value })}
      />
      <button type="submit" disabled={isSubmitting}>Submit</button>
    </form>
  );
}
```
