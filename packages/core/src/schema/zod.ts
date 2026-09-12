import { z } from "zod";
import type { FieldSchema, VisibilityRule } from "./types.js";

/**
 * Zod schema for VisibilityRule with recursive allOf / anyOf combinators.
 */
export const visibilityRuleSchema: z.ZodType<VisibilityRule> = z.lazy(
  () =>
    z.union([
      z.object({
        field: z.string(),
        equals: z.unknown(),
      }),
      z.object({
        field: z.string(),
        notEquals: z.unknown(),
      }),
      z.object({
        field: z.string(),
        in: z.array(z.unknown()),
      }),
      z.object({
        field: z.string(),
        notIn: z.array(z.unknown()),
      }),
      z.object({
        allOf: z.array(visibilityRuleSchema),
      }),
      z.object({
        anyOf: z.array(visibilityRuleSchema),
      }),
    ]) as unknown as z.ZodType<VisibilityRule>,
);

/**
 * Common base schema fields for all field definitions.
 */
const fieldBaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/, "Field id must be snake_case"),
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  autocomplete: z.string().optional(),
  defaultValue: z.unknown().optional(),
  visibleWhen: visibilityRuleSchema.optional(),
});

/**
 * String and text field schema.
 */
export const stringFieldSchema = fieldBaseSchema.extend({
  type: z.enum(["string", "textarea", "email", "url", "tel"]),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  pattern: z.string().optional(),
});

/**
 * Number and integer field schema.
 */
export const numberFieldSchema = fieldBaseSchema.extend({
  type: z.enum(["integer", "number"]),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
});

/**
 * Boolean checkbox field schema.
 */
export const booleanFieldSchema = fieldBaseSchema.extend({
  type: z.literal("boolean"),
});

/**
 * Date, datetime, and time field schema.
 */
export const dateFieldSchema = fieldBaseSchema.extend({
  type: z.enum(["date", "datetime", "time"]),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

/**
 * Choice option schema.
 */
export const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

/**
 * Select, radio, and multiselect field schema.
 */
export const choiceFieldSchema = fieldBaseSchema.extend({
  type: z.enum(["select", "radio", "multiselect"]),
  options: z.array(fieldOptionSchema).min(1),
  minSelections: z.number().int().nonnegative().optional(),
  maxSelections: z.number().int().positive().optional(),
});

/**
 * File field schema.
 */
export const fileFieldSchema = fieldBaseSchema.extend({
  type: z.literal("file"),
  accept: z.array(z.string()).min(1),
  maxFiles: z.number().int().positive(),
  maxSizeMb: z.number().positive(),
});

/**
 * Signature field schema.
 */
export const signatureFieldSchema = fieldBaseSchema.extend({
  type: z.literal("signature"),
  format: z.enum(["drawn", "typed", "uploaded"]),
});

/**
 * Address field schema.
 */
export const addressFieldSchema = fieldBaseSchema.extend({
  type: z.literal("address"),
  countryRestriction: z.array(z.string().length(2)).optional(),
});

/**
 * Group repeating section field schema.
 */
export const groupFieldSchema = fieldBaseSchema.extend({
  type: z.literal("group"),
  fields: z.lazy(() => z.array(fieldSchema).min(1)) as z.ZodType<FieldSchema[]>,
  minItems: z.number().int().nonnegative().optional(),
  maxItems: z.number().int().positive().optional(),
});

/**
 * Discriminated union of all field schemas.
 */
export const fieldSchema: z.ZodType<FieldSchema> = z.discriminatedUnion("type", [
  stringFieldSchema.extend({ type: z.literal("string") }),
  stringFieldSchema.extend({ type: z.literal("textarea") }),
  stringFieldSchema.extend({ type: z.literal("email") }),
  stringFieldSchema.extend({ type: z.literal("url") }),
  stringFieldSchema.extend({ type: z.literal("tel") }),
  numberFieldSchema.extend({ type: z.literal("integer") }),
  numberFieldSchema.extend({ type: z.literal("number") }),
  booleanFieldSchema,
  dateFieldSchema.extend({ type: z.literal("date") }),
  dateFieldSchema.extend({ type: z.literal("datetime") }),
  dateFieldSchema.extend({ type: z.literal("time") }),
  choiceFieldSchema.extend({ type: z.literal("select") }),
  choiceFieldSchema.extend({ type: z.literal("radio") }),
  choiceFieldSchema.extend({ type: z.literal("multiselect") }),
  fileFieldSchema,
  signatureFieldSchema,
  addressFieldSchema,
  groupFieldSchema,
]) as unknown as z.ZodType<FieldSchema>;

/**
 * Auth requirements schema.
 */
export const authRequirementSchema = z.object({
  required: z.boolean(),
  scopes: z.array(z.string()),
});

/**
 * Consent requirements schema.
 */
export const consentRequirementSchema = z.object({
  required: z.boolean(),
  statement: z.string().min(1),
  confirmationFieldId: z.string().min(1),
});

/**
 * Form step schema.
 */
export const formStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
});

/**
 * Form action button schema.
 */
export const formActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["submit", "saveDraft", "next", "previous"]),
});

/**
 * Root AgentFormSchema Zod validator.
 */
export const agentFormSchema = z.object({
  $schema: z.literal("https://formaccurate.dev/schema/v1.json"),
  formId: z.string().regex(/^[a-z0-9_-]+$/, "Form ID must be kebab-case or snake_case"),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, "Version must be semver"),
  title: z.string().min(1),
  description: z.string().optional(),
  locale: z.string().optional(),
  auth: authRequirementSchema.optional(),
  consent: consentRequirementSchema.optional(),
  steps: z.array(formStepSchema).optional(),
  fields: z.array(fieldSchema).min(1),
  actions: z.array(formActionSchema).min(1),
});
