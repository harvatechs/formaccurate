# @formaccurate/cli

Command-line tool for FormAccurate schema authors and CI pipelines: scaffold starter schemas, lint schema definitions against standard specifications, and validate submission payloads standalone.

## Installation

Install globally or as a project devDependency:

```bash
# Global installation
npm install -g @formaccurate/cli

# Or run directly via npx / pnpm dlx
npx @formaccurate/cli --help
pnpm dlx @formaccurate/cli --help
```

## Commands

### `fa lint <schema-file>`

Validates an `AgentFormSchema` JSON file against the standard FormAccurate specification (enforcing JSON Schema structure, snake_case field IDs, kebab-case form IDs, conditional logic references, and action types).

```bash
# Lint a schema definition
fa lint ./schemas/contact-us.json

# Use in CI / pre-commit hooks (exits with code 0 on success, code 1 on errors)
fa lint ./schemas/*.json
```

**Output example:**
```
✓ Schema 'contact-us' is valid.
```

If validation errors occur:
```
✗ Schema validation failed with 2 error(s) in './schemas/contact-us.json':
  - fields.0.id: Field id must be snake_case
  - actions: Required
```

### `fa validate <schema-file> --values <values-file>`

Validates a JSON payload of form values against a specified schema definition offline without running a server.

```bash
fa validate ./schemas/contact-us.json --values ./payloads/test-submission.json
```

**Output example:**
```
✓ Values in './payloads/test-submission.json' are valid for form 'contact-us'.
```

If field constraints or conditional requirements fail:
```
✗ Validation failed with 1 error(s):
  - minLength [full_name]: Full Name must be at least 2 characters
```

### `fa scaffold <form-id> [options]`

Generates a fully compliant, ready-to-use FormAccurate starter schema file with best practices and example fields.

```bash
# Scaffold a schema into the current directory
fa scaffold customer-onboarding --title "Customer Onboarding Form"

# Specify a custom output file path
fa scaffold permit-app --title "Commercial Permit Application" --out ./schemas/permit.json
```

**Generated file format:**
```json
{
  "$schema": "https://formaccurate.dev/schema/v1.json",
  "version": "1.0.0",
  "formId": "customer-onboarding",
  "title": "Customer Onboarding Form",
  "fields": [
    {
      "id": "full_name",
      "type": "string",
      "label": "Full Name",
      "required": true,
      "minLength": 2
    },
    {
      "id": "email_address",
      "type": "email",
      "label": "Email Address",
      "required": true
    },
    {
      "id": "message",
      "type": "textarea",
      "label": "Message",
      "required": false
    }
  ],
  "actions": [
    {
      "id": "submit",
      "label": "Submit Form",
      "type": "submit"
    }
  ]
}
```

## Programmatic API

The core verification functions are also exported for use in scripts and testing frameworks:

```typescript
import {
  lintSchema,
  validateValues,
  scaffoldSchema,
} from "@formaccurate/cli";

// Lint in-memory schema object
const lintResult = lintSchema(mySchema);
if (!lintResult.valid) {
  console.error("Schema errors:", lintResult.errors);
}

// Validate in-memory form values
const valResult = validateValues(mySchema, {
  full_name: "Jane Doe",
  email_address: "jane@example.com",
});
console.log("Is submission valid:", valResult.valid);
```

## License

MIT
