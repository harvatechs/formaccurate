# @formaccurate/react

## 0.1.0

### Minor Changes

- 1611ff9: Implement React bindings for FormAccurate.

  - `<FormAccurateProvider formId schema debug>` providing React context and auto-mounting `@formaccurate/web` bridge
  - `useFormAccurate(formId?)` reactive hook returning `{ formId, state, schema, values, errors, isValid, isSubmitting, isSubmitted, setValues, validate, submit, bridge }`
  - Single source of truth synchronized directly with the web bridge without duplicate state
  - Automatic re-rendering when agent or human mutates form state
  - Interactive `examples/react-app` implementation of the Commercial Operating Permit Application

### Patch Changes

- Updated dependencies [7b81bb6]
- Updated dependencies [a3340a9]
  - @formaccurate/core@0.1.0
  - @formaccurate/web@0.1.0
