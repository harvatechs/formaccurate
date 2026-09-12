/**
 * Field types supported by the Form Schema Layer (v1).
 */
export type FieldType =
  | "string"
  | "textarea"
  | "email"
  | "url"
  | "tel"
  | "integer"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "select"
  | "radio"
  | "multiselect"
  | "file"
  | "signature"
  | "address"
  | "group";

/**
 * Base properties shared by all field schemas.
 */
export interface FieldBase {
  /** Stable machine id: snake_case, unique within the form. */
  id: string;
  /** Field type identifier. */
  type: FieldType;
  /** Human-readable display label. */
  label: string;
  /** Optional descriptive explanation of the field. */
  description?: string | undefined;
  /** Whether the field is mandatory for submission. Defaults to false. */
  required?: boolean | undefined;
  /** Standard HTML autocomplete token (e.g. "email", "organization"). */
  autocomplete?: string | undefined;
  /** Optional initial default value. */
  defaultValue?: unknown;
  /** Declarative rule determining whether the field is active/visible. */
  visibleWhen?: VisibilityRule | undefined;
}

/**
 * Text and string-based field schema.
 */
export interface StringField extends FieldBase {
  type: "string" | "textarea" | "email" | "url" | "tel";
  minLength?: number | undefined;
  maxLength?: number | undefined;
  /** ECMA-262 regex pattern, implicitly anchored (^...$). */
  pattern?: string | undefined;
}

/**
 * Integer and decimal number field schema.
 */
export interface NumberField extends FieldBase {
  type: "integer" | "number";
  minimum?: number | undefined;
  maximum?: number | undefined;
}

/**
 * Boolean checkbox field schema.
 */
export interface BooleanField extends FieldBase {
  type: "boolean";
}

/**
 * Date, time, and datetime field schema.
 */
export interface DateField extends FieldBase {
  type: "date" | "datetime" | "time";
  /** Minimum acceptable ISO date/time string. */
  minDate?: string | undefined;
  /** Maximum acceptable ISO date/time string. */
  maxDate?: string | undefined;
}

/**
 * Option item for select, radio, and multiselect fields.
 */
export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Single-select, radio, or multi-select choice field schema.
 */
export interface ChoiceField extends FieldBase {
  type: "select" | "radio" | "multiselect";
  options: FieldOption[];
  minSelections?: number | undefined;
  maxSelections?: number | undefined;
}

/**
 * File upload field schema.
 */
export interface FileField extends FieldBase {
  type: "file";
  /** Allowed MIME types (e.g. ["application/pdf", "image/png"]). */
  accept: string[];
  maxFiles: number;
  maxSizeMb: number;
}

/**
 * Signature capture field schema.
 */
export interface SignatureField extends FieldBase {
  type: "signature";
  format: "drawn" | "typed" | "uploaded";
}

/**
 * Structured postal address value.
 */
export interface AddressValue {
  line1: string;
  line2?: string | undefined;
  city: string;
  region?: string | undefined;
  postalCode: string;
  country: string;
}

/**
 * Structured address field schema.
 */
export interface AddressField extends FieldBase {
  type: "address";
  /** ISO 3166-1 alpha-2 country codes. Omit = any country. */
  countryRestriction?: string[] | undefined;
}

/**
 * Repeating group field schema.
 */
export interface GroupField extends FieldBase {
  type: "group";
  /** Repeatable sub-fields schema. */
  fields: FieldSchema[];
  minItems?: number | undefined;
  maxItems?: number | undefined;
}

/**
 * Discriminated union of all supported field schema definitions.
 */
export type FieldSchema =
  | StringField
  | NumberField
  | BooleanField
  | DateField
  | ChoiceField
  | FileField
  | SignatureField
  | AddressField
  | GroupField;

/**
 * Declarative rule for dynamic field visibility.
 */
export type VisibilityRule =
  | { field: string; equals: unknown }
  | { field: string; notEquals: unknown }
  | { field: string; in: unknown[] }
  | { field: string; notIn: unknown[] }
  | { allOf: VisibilityRule[] }
  | { anyOf: VisibilityRule[] };

/**
 * Form authentication requirements.
 */
export interface AuthRequirement {
  required: boolean;
  scopes: string[];
}

/**
 * Form declaration and legal consent requirements.
 */
export interface ConsentRequirement {
  required: boolean;
  /** Human-readable legal declaration text. */
  statement: string;
  /** ID of the boolean field in the form representing agreement. */
  confirmationFieldId: string;
}

/**
 * Multi-step wizard step definition.
 */
export interface FormStep {
  id: string;
  title: string;
  /** Ordered list of field IDs belonging to this step. */
  fields: string[];
}

/**
 * Action button definitions (submit, draft save, navigation).
 */
export interface FormAction {
  id: string;
  label: string;
  type: "submit" | "saveDraft" | "next" | "previous";
}

/**
 * The root AgentFormSchema definition (v1).
 */
export interface AgentFormSchema {
  $schema: "https://formaccurate.dev/schema/v1.json";
  formId: string;
  version: string;
  title: string;
  description?: string | undefined;
  locale?: string | undefined;
  auth?: AuthRequirement | undefined;
  consent?: ConsentRequirement | undefined;
  steps?: FormStep[] | undefined;
  fields: FieldSchema[];
  actions: FormAction[];
}

/**
 * A validation error associated with a field or the entire form.
 */
export interface FieldError {
  /** Field ID if tied to a specific field; undefined for form-level errors. */
  fieldId?: string | undefined;
  /** Machine-readable error code. */
  code: string;
  /** Human-readable error description. */
  message: string;
}

/**
 * Lifecycle status of a form session.
 */
export type FormStatus =
  | "draft"
  | "validating"
  | "valid"
  | "invalid"
  | "submitting"
  | "submitted"
  | "failed";

/**
 * Multi-step navigation state.
 */
export interface FormStepState {
  current: string;
  completed: string[];
}

/**
 * Live state object for a form session.
 */
export interface FormState {
  formId: string;
  sessionId: string;
  values: Record<string, unknown>;
  errors: FieldError[];
  status: FormStatus;
  step?: FormStepState | undefined;
  updatedAt: string;
}

/**
 * Verifiable submission receipt returned on successful submission.
 */
export interface SubmissionReceipt {
  submissionId: string;
  status: "submitted";
  receivedAt: string;
  receiptUrl: string;
  checksum: string;
}
