# Form Schema Specification (v1)

This document defines the **Form Schema Layer** — the machine-readable description of a form
that everything else in FormAccurate is built on. It is a protocol, not just a TypeScript type:
anyone should be able to implement a FormAccurate-compatible server in any language by reading
this document alone.

## Versioning

- The spec itself is versioned independently of any npm package: `$schema:
  "https://formaccurate.dev/schema/v1.json"` (placeholder domain until the project has one).
  Breaking changes to the spec bump this to `v2`; both may be supported by a server
  simultaneously during a migration window.
- Each individual form schema also carries its own `version` (semver), controlled by the form
  author, independent of the spec version. A form's `version` changes when its fields or
  validation rules change in a way that could affect a previously-generated `FormState`.

## Top-level shape

```ts
interface AgentFormSchema {
  $schema: "https://formaccurate.dev/schema/v1.json";
  formId: string;                 // stable, kebab-case or snake_case, unique per site
  version: string;                // semver, e.g. "1.2.0"
  title: string;
  description?: string;
  locale?: string;                // BCP-47, e.g. "en-US"
  auth?: AuthRequirement;
  consent?: ConsentRequirement;
  steps?: FormStep[];              // omit for single-step forms
  fields: FieldSchema[];
  actions: FormAction[];
}

interface AuthRequirement {
  required: boolean;
  scopes: string[];                // see SECURITY.md for the standard scope names
}

interface ConsentRequirement {
  required: boolean;
  statement: string;                // human-readable declaration text
  confirmationFieldId: string;      // id of the boolean field representing agreement
}

interface FormStep {
  id: string;
  title: string;
  fields: string[];                 // field ids belonging to this step, in order
}

interface FormAction {
  id: string;
  label: string;
  type: "submit" | "saveDraft" | "next" | "previous";
}
```

## Field schema

Every field shares a base shape, then extends it per type.

```ts
interface FieldBase {
  id: string;                       // stable machine id: snake_case, unique within the form
  type: FieldType;
  label: string;
  description?: string;
  required?: boolean;               // default false
  autocomplete?: string;            // HTML autocomplete token, e.g. "email", "organization"
  defaultValue?: unknown;
  visibleWhen?: VisibilityRule;      // omit = always visible
}

type FieldType =
  | "string" | "textarea" | "email" | "url" | "tel"
  | "integer" | "number" | "boolean"
  | "date" | "datetime" | "time"
  | "select" | "radio" | "multiselect"
  | "file" | "signature" | "address" | "group";
```

### `string`, `textarea`, `email`, `url`, `tel`

```ts
interface StringField extends FieldBase {
  type: "string" | "textarea" | "email" | "url" | "tel";
  minLength?: number;
  maxLength?: number;
  pattern?: string;                // ECMA-262 regex, anchored implicitly (^...$)
}
```

```json
{
  "id": "legal_name",
  "type": "string",
  "label": "Legal Business Name",
  "required": true,
  "maxLength": 200,
  "autocomplete": "organization"
}
```

### `integer`, `number`

```ts
interface NumberField extends FieldBase {
  type: "integer" | "number";
  minimum?: number;
  maximum?: number;
}
```

### `boolean`

```ts
interface BooleanField extends FieldBase {
  type: "boolean";
}
```

Used for checkboxes and, notably, consent/declaration confirmations
(`consent.confirmationFieldId` must reference a field of this type).

### `date`, `datetime`, `time`

```ts
interface DateField extends FieldBase {
  type: "date" | "datetime" | "time";
  minDate?: string;   // ISO 8601
  maxDate?: string;   // ISO 8601
}
```

### `select`, `radio`, `multiselect`

```ts
interface ChoiceField extends FieldBase {
  type: "select" | "radio" | "multiselect";
  options: FieldOption[];
  minSelections?: number;  // multiselect only
  maxSelections?: number;  // multiselect only
}

interface FieldOption {
  value: string;
  label: string;
  description?: string;
}
```

```json
{
  "id": "business_type",
  "type": "select",
  "label": "Business Type",
  "required": true,
  "options": [
    { "value": "sole_proprietor", "label": "Sole Proprietor" },
    { "value": "llc", "label": "LLC" },
    { "value": "corporation", "label": "Corporation" }
  ]
}
```

### `file`

```ts
interface FileField extends FieldBase {
  type: "file";
  accept: string[];       // MIME types
  maxFiles: number;
  maxSizeMb: number;
}
```

File values are never raw bytes in `FormState.values` — they are **file tokens** obtained by
uploading through the protocol's file endpoint first. See `docs/spec-protocol.md §File uploads`.

### `signature`

```ts
interface SignatureField extends FieldBase {
  type: "signature";
  format: "drawn" | "typed" | "uploaded";
}
```

A signature value is also a token (image or structured signature data), obtained the same way as
a file upload, never inlined as a data URI in `FormState`.

### `address`

```ts
interface AddressField extends FieldBase {
  type: "address";
  countryRestriction?: string[];   // ISO 3166-1 alpha-2 codes; omit = any
}
```

An address field's value is a structured object: `{ line1, line2?, city, region, postalCode,
country }`. This is one field id in the schema, one key in `values`, holding an object — not five
separate flat fields — so agents can reason about "the address" as a unit.

### `group` (repeating sections)

```ts
interface GroupField extends FieldBase {
  type: "group";
  fields: FieldSchema[];    // the repeatable sub-schema
  minItems?: number;
  maxItems?: number;
}
```

A group's value in `FormState.values` is an array of objects, each shaped by `fields`. Example:
a "Business Owners" repeating group where each entry has `full_name`, `title`, `ownership_pct`.

## Visibility rules (`visibleWhen`)

Kept intentionally declarative — **no arbitrary JavaScript expressions are permitted** in a
schema (see `docs/anti-patterns.md` for why).

```ts
type VisibilityRule =
  | { field: string; equals: unknown }
  | { field: string; notEquals: unknown }
  | { field: string; in: unknown[] }
  | { field: string; notIn: unknown[] }
  | { allOf: VisibilityRule[] }
  | { anyOf: VisibilityRule[] };
```

```json
{
  "id": "llc_registration_number",
  "type": "string",
  "label": "LLC Registration Number",
  "required": true,
  "visibleWhen": { "field": "business_type", "equals": "llc" }
}
```

A field that is not currently visible (per `evaluateVisibility()`) is excluded from required-ness
checks during validation — you cannot be blocked submitting because of a hidden field.

## Full example: Business Permit Application

```json
{
  "$schema": "https://formaccurate.dev/schema/v1.json",
  "formId": "business-permit-application",
  "version": "1.0.0",
  "title": "Business Permit Application",
  "description": "Apply for a municipal business permit.",
  "locale": "en-US",
  "auth": { "required": true, "scopes": ["form:read", "form:write", "form:submit"] },
  "consent": {
    "required": true,
    "statement": "I confirm the information provided is true and accurate.",
    "confirmationFieldId": "declaration_true"
  },
  "steps": [
    { "id": "applicant_info", "title": "Applicant Information", "fields": ["legal_name", "email"] },
    { "id": "business_details", "title": "Business Details", "fields": ["business_type", "llc_registration_number", "employee_count"] },
    { "id": "documents", "title": "Supporting Documents", "fields": ["supporting_documents"] },
    { "id": "declaration", "title": "Declaration", "fields": ["declaration_true"] }
  ],
  "fields": [
    { "id": "legal_name", "type": "string", "label": "Legal Business Name", "required": true, "maxLength": 200, "autocomplete": "organization" },
    { "id": "email", "type": "email", "label": "Contact Email", "required": true, "autocomplete": "email" },
    {
      "id": "business_type", "type": "select", "label": "Business Type", "required": true,
      "options": [
        { "value": "sole_proprietor", "label": "Sole Proprietor" },
        { "value": "llc", "label": "LLC" },
        { "value": "corporation", "label": "Corporation" }
      ]
    },
    {
      "id": "llc_registration_number", "type": "string", "label": "LLC Registration Number",
      "required": true, "visibleWhen": { "field": "business_type", "equals": "llc" }
    },
    { "id": "employee_count", "type": "integer", "label": "Number of Employees", "required": false, "minimum": 0 },
    {
      "id": "supporting_documents", "type": "file", "label": "Supporting Documents", "required": false,
      "accept": ["application/pdf", "image/png", "image/jpeg"], "maxFiles": 5, "maxSizeMb": 10
    },
    { "id": "declaration_true", "type": "boolean", "label": "I declare the information is true", "required": true }
  ],
  "actions": [
    { "id": "submit", "label": "Submit Application", "type": "submit" }
  ]
}
```

## Validation semantics (normative)

`validateForm(schema, values)` must:

1. Evaluate `visibleWhen` for every field first; hidden fields are excluded from all further
   checks for this pass.
2. For each visible field, in field-declaration order:
   - `required` + missing/empty → `{ fieldId, code: "required" }`
   - type mismatch (e.g., string where integer expected) → `{ fieldId, code: "type" }`
   - `minLength` / `maxLength` / `pattern` / `minimum` / `maximum` / `minSelections` /
     `maxSelections` violations → matching `code`
   - `file`/`signature` fields with a value that isn't a valid, unexpired upload token →
     `{ fieldId, code: "custom", message: "invalid or expired file token" }`
3. If `consent.required` and the confirmation field's value is not `true` at submit time →
   a form-level error is returned (not tied to a field) with `code: "consent_required"`.
4. Return an empty error array if and only if the form is submittable.

This function must be pure and deterministic — same schema + same values always produces the
same result — because both the browser bridge and the server call it and must agree.
