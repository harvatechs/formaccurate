/**
 * @formaccurate/core
 * Pure TypeScript schema types, Zod validation engine, state machine,
 * and JSON Schema export for FormAccurate.
 */

// Schema types
export type {
  AddressField,
  AddressValue,
  AgentFormSchema,
  AuthRequirement,
  BooleanField,
  ChoiceField,
  ConsentRequirement,
  DateField,
  FieldError,
  FieldOption,
  FieldSchema,
  FieldType,
  FileField,
  FormAction,
  FormState,
  FormStatus,
  FormStep,
  FormStepState,
  GroupField,
  NumberField,
  SignatureField,
  StringField,
  SubmissionReceipt,
  VisibilityRule,
} from "./schema/types.js";

// Zod schemas
export {
  addressFieldSchema,
  agentFormSchema,
  authRequirementSchema,
  booleanFieldSchema,
  choiceFieldSchema,
  consentRequirementSchema,
  dateFieldSchema,
  fieldOptionSchema,
  fieldSchema,
  fileFieldSchema,
  formActionSchema,
  formStepSchema,
  groupFieldSchema,
  numberFieldSchema,
  signatureFieldSchema,
  stringFieldSchema,
  visibilityRuleSchema,
} from "./schema/zod.js";

// Visibility
export { evaluateVisibility } from "./visibility/evaluate.js";

// Validation
export type { ValidateFormOptions } from "./validate/validate-form.js";
export { validateForm } from "./validate/validate-form.js";

// State machine
export type { CreateFormStateOptions } from "./state/state-machine.js";
export {
  InvalidStateTransitionError,
  applyValues,
  canTransition,
  createFormState,
  transitionFormState,
  updateFormStep,
} from "./state/state-machine.js";

// Identifiers, tokens, receipts & checksums
export {
  computeSubmissionChecksum,
  createSubmissionReceipt,
  generateFileToken,
  generateSessionId,
  generateSignatureToken,
  generateSubmissionId,
  isValidIdempotencyKey,
} from "./ids/ids.js";
export { generateUlid } from "./ids/ulid.js";
export { sha256Hex } from "./ids/sha256.js";

// JSON Schema export
export {
  toFormDefinitionJsonSchema,
  toJsonSchema,
} from "./json-schema/to-json-schema.js";
