import type {
  AddressField,
  AddressValue,
  AgentFormSchema,
  ChoiceField,
  DateField,
  FieldError,
  FieldSchema,
  FileField,
  GroupField,
  NumberField,
  SignatureField,
  StringField,
} from "../schema/types.js";
import { evaluateVisibility } from "../visibility/evaluate.js";

/**
 * Options for validating form values.
 */
export interface ValidateFormOptions {
  /** Whether the validation is occurring immediately prior to final submission. */
  isSubmit?: boolean;
  /** Optional custom file/signature token validator. */
  validateToken?: (token: string, fieldId: string) => boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const FILE_TOKEN_REGEX = /^filetok_[a-zA-Z0-9_-]+$/;
const SIGNATURE_TOKEN_REGEX = /^(sigtok_|filetok_)[a-zA-Z0-9_-]+$/;

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

function validateStringField(field: StringField, value: unknown, errors: FieldError[]): void {
  if (isEmpty(value)) {
    if (field.required) {
      errors.push({
        fieldId: field.id,
        code: "required",
        message: `${field.label} is required`,
      });
    }
    return;
  }

  if (typeof value !== "string") {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a string`,
    });
    return;
  }

  if (field.type === "email" && !EMAIL_REGEX.test(value)) {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a valid email address`,
    });
    return;
  }

  if (field.type === "url" && !URL_REGEX.test(value)) {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a valid HTTP or HTTPS URL`,
    });
    return;
  }

  if (field.type === "tel" && !/^\+?[0-9\s\-().]{7,25}$/.test(value.trim())) {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a valid phone number`,
    });
    return;
  }

  if (field.minLength !== undefined && value.length < field.minLength) {
    errors.push({
      fieldId: field.id,
      code: "minLength",
      message: `${field.label} must be at least ${field.minLength} characters`,
    });
  }

  if (field.maxLength !== undefined && value.length > field.maxLength) {
    errors.push({
      fieldId: field.id,
      code: "maxLength",
      message: `${field.label} must not exceed ${field.maxLength} characters`,
    });
  }

  if (field.pattern !== undefined) {
    const anchored =
      field.pattern.startsWith("^") && field.pattern.endsWith("$")
        ? field.pattern
        : `^${field.pattern}$`;
    try {
      const reg = new RegExp(anchored);
      if (!reg.test(value)) {
        errors.push({
          fieldId: field.id,
          code: "pattern",
          message: `${field.label} format is invalid`,
        });
      }
    } catch {
      errors.push({
        fieldId: field.id,
        code: "pattern",
        message: `${field.label} pattern is invalid`,
      });
    }
  }
}

function validateNumberField(field: NumberField, value: unknown, errors: FieldError[]): void {
  if (value === undefined || value === null || value === "") {
    if (field.required) {
      errors.push({
        fieldId: field.id,
        code: "required",
        message: `${field.label} is required`,
      });
    }
    return;
  }

  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a valid number`,
    });
    return;
  }

  if (field.type === "integer" && !Number.isInteger(value)) {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be an integer`,
    });
    return;
  }

  if (field.minimum !== undefined && value < field.minimum) {
    errors.push({
      fieldId: field.id,
      code: "minimum",
      message: `${field.label} must be at least ${field.minimum}`,
    });
  }

  if (field.maximum !== undefined && value > field.maximum) {
    errors.push({
      fieldId: field.id,
      code: "maximum",
      message: `${field.label} must not exceed ${field.maximum}`,
    });
  }
}

function validateBooleanField(
  field: FieldSchema & { type: "boolean" },
  value: unknown,
  errors: FieldError[],
): void {
  if (value === undefined || value === null) {
    if (field.required) {
      errors.push({
        fieldId: field.id,
        code: "required",
        message: `${field.label} is required`,
      });
    }
    return;
  }

  if (typeof value !== "boolean") {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a boolean`,
    });
    return;
  }

  if (field.required && value !== true) {
    errors.push({
      fieldId: field.id,
      code: "required",
      message: `${field.label} must be confirmed`,
    });
  }
}

function validateDateField(field: DateField, value: unknown, errors: FieldError[]): void {
  if (isEmpty(value)) {
    if (field.required) {
      errors.push({
        fieldId: field.id,
        code: "required",
        message: `${field.label} is required`,
      });
    }
    return;
  }

  if (typeof value !== "string") {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a string`,
    });
    return;
  }

  if (field.type === "date") {
    if (!DATE_REGEX.test(value) || Number.isNaN(Date.parse(value))) {
      errors.push({
        fieldId: field.id,
        code: "type",
        message: `${field.label} must be a valid ISO date (YYYY-MM-DD)`,
      });
      return;
    }
    if (field.minDate && value < field.minDate) {
      errors.push({
        fieldId: field.id,
        code: "minDate",
        message: `${field.label} must not be before ${field.minDate}`,
      });
    }
    if (field.maxDate && value > field.maxDate) {
      errors.push({
        fieldId: field.id,
        code: "maxDate",
        message: `${field.label} must not be after ${field.maxDate}`,
      });
    }
  } else if (field.type === "datetime") {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      errors.push({
        fieldId: field.id,
        code: "type",
        message: `${field.label} must be a valid ISO datetime`,
      });
      return;
    }
    if (field.minDate && timestamp < Date.parse(field.minDate)) {
      errors.push({
        fieldId: field.id,
        code: "minDate",
        message: `${field.label} must not be before ${field.minDate}`,
      });
    }
    if (field.maxDate && timestamp > Date.parse(field.maxDate)) {
      errors.push({
        fieldId: field.id,
        code: "maxDate",
        message: `${field.label} must not be after ${field.maxDate}`,
      });
    }
  } else if (field.type === "time") {
    if (!TIME_REGEX.test(value)) {
      errors.push({
        fieldId: field.id,
        code: "type",
        message: `${field.label} must be a valid time (HH:mm or HH:mm:ss)`,
      });
      return;
    }
    if (field.minDate && value < field.minDate) {
      errors.push({
        fieldId: field.id,
        code: "minDate",
        message: `${field.label} must not be before ${field.minDate}`,
      });
    }
    if (field.maxDate && value > field.maxDate) {
      errors.push({
        fieldId: field.id,
        code: "maxDate",
        message: `${field.label} must not be after ${field.maxDate}`,
      });
    }
  }
}

function validateChoiceField(field: ChoiceField, value: unknown, errors: FieldError[]): void {
  const allowedValues = new Set(field.options.map((opt) => opt.value));

  if (field.type === "select" || field.type === "radio") {
    if (isEmpty(value)) {
      if (field.required) {
        errors.push({
          fieldId: field.id,
          code: "required",
          message: `${field.label} is required`,
        });
      }
      return;
    }

    if (typeof value !== "string") {
      errors.push({
        fieldId: field.id,
        code: "type",
        message: `${field.label} must be a string`,
      });
      return;
    }

    if (!allowedValues.has(value)) {
      errors.push({
        fieldId: field.id,
        code: "type",
        message: `${field.label} must be one of the available options`,
      });
    }
  } else if (field.type === "multiselect") {
    if (isEmpty(value)) {
      if (field.required) {
        errors.push({
          fieldId: field.id,
          code: "required",
          message: `${field.label} is required`,
        });
      }
      return;
    }

    if (!Array.isArray(value)) {
      errors.push({
        fieldId: field.id,
        code: "type",
        message: `${field.label} must be an array of selected option values`,
      });
      return;
    }

    const hasInvalid = value.some((v) => typeof v !== "string" || !allowedValues.has(v));
    if (hasInvalid) {
      errors.push({
        fieldId: field.id,
        code: "type",
        message: `${field.label} contains invalid option values`,
      });
      return;
    }

    if (field.minSelections !== undefined && value.length < field.minSelections) {
      errors.push({
        fieldId: field.id,
        code: "minSelections",
        message: `${field.label} requires at least ${field.minSelections} selections`,
      });
    }

    if (field.maxSelections !== undefined && value.length > field.maxSelections) {
      errors.push({
        fieldId: field.id,
        code: "maxSelections",
        message: `${field.label} allows at most ${field.maxSelections} selections`,
      });
    }
  }
}

function validateFileField(
  field: FileField,
  value: unknown,
  errors: FieldError[],
  options?: ValidateFormOptions,
): void {
  if (isEmpty(value)) {
    if (field.required) {
      errors.push({
        fieldId: field.id,
        code: "required",
        message: `${field.label} is required`,
      });
    }
    return;
  }

  const tokens: string[] = Array.isArray(value)
    ? (value as string[])
    : typeof value === "string"
      ? [value]
      : [];

  if (tokens.length === 0 || (Array.isArray(value) && value.some((v) => typeof v !== "string"))) {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a file token or an array of file tokens`,
    });
    return;
  }

  if (tokens.length > field.maxFiles) {
    errors.push({
      fieldId: field.id,
      code: "maxFiles",
      message: `${field.label} allows at most ${field.maxFiles} files`,
    });
  }

  for (const token of tokens) {
    const isValidFormat = FILE_TOKEN_REGEX.test(token);
    const isValidToken =
      isValidFormat && (options?.validateToken ? options.validateToken(token, field.id) : true);

    if (!isValidToken) {
      errors.push({
        fieldId: field.id,
        code: "custom",
        message: "invalid or expired file token",
      });
      break;
    }
  }
}

function validateSignatureField(
  field: SignatureField,
  value: unknown,
  errors: FieldError[],
  options?: ValidateFormOptions,
): void {
  if (isEmpty(value)) {
    if (field.required) {
      errors.push({
        fieldId: field.id,
        code: "required",
        message: `${field.label} is required`,
      });
    }
    return;
  }

  if (typeof value !== "string") {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be a signature token`,
    });
    return;
  }

  const isValidFormat = SIGNATURE_TOKEN_REGEX.test(value);
  const isValidToken =
    isValidFormat && (options?.validateToken ? options.validateToken(value, field.id) : true);

  if (!isValidToken) {
    errors.push({
      fieldId: field.id,
      code: "custom",
      message: "invalid or expired file token",
    });
  }
}

function validateAddressField(field: AddressField, value: unknown, errors: FieldError[]): void {
  if (isEmpty(value)) {
    if (field.required) {
      errors.push({
        fieldId: field.id,
        code: "required",
        message: `${field.label} is required`,
      });
    }
    return;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be an address object`,
    });
    return;
  }

  const addr = value as Partial<AddressValue>;
  if (!addr.line1 || !addr.city || !addr.postalCode || !addr.country) {
    errors.push({
      fieldId: field.id,
      code: "required",
      message: `${field.label} line1, city, postalCode, and country are required`,
    });
    return;
  }

  if (field.countryRestriction && field.countryRestriction.length > 0) {
    if (!field.countryRestriction.includes(addr.country)) {
      errors.push({
        fieldId: field.id,
        code: "countryRestriction",
        message: `${field.label} country must be one of: ${field.countryRestriction.join(", ")}`,
      });
    }
  }
}

function validateGroupField(
  field: GroupField,
  value: unknown,
  errors: FieldError[],
  options?: ValidateFormOptions,
): void {
  if (isEmpty(value)) {
    if (field.required) {
      errors.push({
        fieldId: field.id,
        code: "required",
        message: `${field.label} is required`,
      });
    }
    return;
  }

  if (!Array.isArray(value)) {
    errors.push({
      fieldId: field.id,
      code: "type",
      message: `${field.label} must be an array of items`,
    });
    return;
  }

  if (field.minItems !== undefined && value.length < field.minItems) {
    errors.push({
      fieldId: field.id,
      code: "minItems",
      message: `${field.label} requires at least ${field.minItems} items`,
    });
  }

  if (field.maxItems !== undefined && value.length > field.maxItems) {
    errors.push({
      fieldId: field.id,
      code: "maxItems",
      message: `${field.label} allows at most ${field.maxItems} items`,
    });
  }

  value.forEach((item, index) => {
    if (typeof item !== "object" || item === null) {
      errors.push({
        fieldId: `${field.id}[${index}]`,
        code: "type",
        message: `Item at index ${index} must be an object`,
      });
      return;
    }

    const itemObj = item as Record<string, unknown>;
    for (const subField of field.fields) {
      const isVisible = evaluateVisibility(subField.visibleWhen, itemObj);
      if (!isVisible) {
        continue;
      }
      const subErrors: FieldError[] = [];
      validateSingleField(subField, itemObj[subField.id], subErrors, options);
      for (const err of subErrors) {
        errors.push({
          fieldId: `${field.id}[${index}].${err.fieldId}`,
          code: err.code,
          message: err.message,
        });
      }
    }
  });
}

function validateSingleField(
  field: FieldSchema,
  value: unknown,
  errors: FieldError[],
  options?: ValidateFormOptions,
): void {
  switch (field.type) {
    case "string":
    case "textarea":
    case "email":
    case "url":
    case "tel":
      validateStringField(field, value, errors);
      break;
    case "integer":
    case "number":
      validateNumberField(field, value, errors);
      break;
    case "boolean":
      validateBooleanField(field, value, errors);
      break;
    case "date":
    case "datetime":
    case "time":
      validateDateField(field, value, errors);
      break;
    case "select":
    case "radio":
    case "multiselect":
      validateChoiceField(field, value, errors);
      break;
    case "file":
      validateFileField(field, value, errors, options);
      break;
    case "signature":
      validateSignatureField(field, value, errors, options);
      break;
    case "address":
      validateAddressField(field, value, errors);
      break;
    case "group":
      validateGroupField(field, value, errors, options);
      break;
  }
}

/**
 * Validates form values against an AgentFormSchema.
 *
 * Follows the normative Form Schema Layer validation semantics:
 * 1. Evaluates `visibleWhen` for every field; hidden fields are excluded from all checks.
 * 2. Validates visible fields in field-declaration order for requiredness, types, and constraints.
 * 3. Enforces valid file and signature upload tokens (rejecting raw binary/data URIs).
 * 4. Checks form-level legal declaration consent when `isSubmit` is true.
 *
 * This function is pure and deterministic.
 *
 * @param schema - The form schema definition to validate against.
 * @param values - Current form values keyed by field ID.
 * @param options - Optional configuration (e.g. submit-time validation, token verifiers).
 * @returns Array of FieldError objects, or an empty array if the form is fully valid.
 */
export function validateForm(
  schema: AgentFormSchema,
  values: Record<string, unknown>,
  options?: ValidateFormOptions,
): FieldError[] {
  const errors: FieldError[] = [];

  for (const field of schema.fields) {
    const isVisible = evaluateVisibility(field.visibleWhen, values);
    if (!isVisible) {
      continue;
    }
    validateSingleField(field, values[field.id], errors, options);
  }

  if (schema.consent?.required && options?.isSubmit) {
    const confirmationValue = values[schema.consent.confirmationFieldId];
    if (confirmationValue !== true) {
      errors.push({
        code: "consent_required",
        message: "Consent confirmation is required before submission.",
      });
    }
  }

  return errors;
}
