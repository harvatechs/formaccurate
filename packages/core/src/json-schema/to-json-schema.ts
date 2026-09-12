import { zodToJsonSchema } from "zod-to-json-schema";
import type { AgentFormSchema, FieldSchema } from "../schema/types.js";
import { agentFormSchema } from "../schema/zod.js";

function mapFieldToJsonSchema(field: FieldSchema): Record<string, unknown> {
  const base: Record<string, unknown> = {
    title: field.label,
  };
  if (field.description) {
    base.description = field.description;
  }

  switch (field.type) {
    case "string":
    case "textarea": {
      const s: Record<string, unknown> = { ...base, type: "string" };
      if (field.minLength !== undefined) s.minLength = field.minLength;
      if (field.maxLength !== undefined) s.maxLength = field.maxLength;
      if (field.pattern !== undefined) s.pattern = field.pattern;
      return s;
    }
    case "email": {
      const s: Record<string, unknown> = { ...base, type: "string", format: "email" };
      if (field.minLength !== undefined) s.minLength = field.minLength;
      if (field.maxLength !== undefined) s.maxLength = field.maxLength;
      return s;
    }
    case "url":
      return { ...base, type: "string", format: "uri" };
    case "tel":
      return { ...base, type: "string", format: "tel" };
    case "integer": {
      const s: Record<string, unknown> = { ...base, type: "integer" };
      if (field.minimum !== undefined) s.minimum = field.minimum;
      if (field.maximum !== undefined) s.maximum = field.maximum;
      return s;
    }
    case "number": {
      const s: Record<string, unknown> = { ...base, type: "number" };
      if (field.minimum !== undefined) s.minimum = field.minimum;
      if (field.maximum !== undefined) s.maximum = field.maximum;
      return s;
    }
    case "boolean":
      return { ...base, type: "boolean" };
    case "date":
      return { ...base, type: "string", format: "date" };
    case "datetime":
      return { ...base, type: "string", format: "date-time" };
    case "time":
      return { ...base, type: "string", format: "time" };
    case "select":
    case "radio":
      return {
        ...base,
        type: "string",
        enum: field.options.map((opt) => opt.value),
      };
    case "multiselect": {
      const s: Record<string, unknown> = {
        ...base,
        type: "array",
        items: {
          type: "string",
          enum: field.options.map((opt) => opt.value),
        },
      };
      if (field.minSelections !== undefined) s.minItems = field.minSelections;
      if (field.maxSelections !== undefined) s.maxItems = field.maxSelections;
      return s;
    }
    case "file":
      return {
        ...base,
        type: "array",
        items: { type: "string", description: "fileToken" },
        maxItems: field.maxFiles,
      };
    case "signature":
      return {
        ...base,
        type: "string",
        description: "signatureToken",
      };
    case "address":
      return {
        ...base,
        type: "object",
        properties: {
          line1: { type: "string" },
          line2: { type: "string" },
          city: { type: "string" },
          region: { type: "string" },
          postalCode: { type: "string" },
          country: { type: "string" },
        },
        required: ["line1", "city", "postalCode", "country"],
      };
    case "group": {
      const groupProperties: Record<string, unknown> = {};
      const groupRequired: string[] = [];
      for (const sub of field.fields) {
        groupProperties[sub.id] = mapFieldToJsonSchema(sub);
        if (sub.required) {
          groupRequired.push(sub.id);
        }
      }
      const s: Record<string, unknown> = {
        ...base,
        type: "array",
        items: {
          type: "object",
          properties: groupProperties,
          required: groupRequired.length > 0 ? groupRequired : undefined,
        },
      };
      if (field.minItems !== undefined) s.minItems = field.minItems;
      if (field.maxItems !== undefined) s.maxItems = field.maxItems;
      return s;
    }
  }
}

/**
 * Converts an AgentFormSchema into a standard JSON Schema (Draft-07) representing
 * the form's acceptable values payload.
 *
 * Useful for exposing JSON Schema definitions to external agents, tooling, and OpenAPI specs.
 *
 * @param schema - The AgentFormSchema to convert.
 * @returns JSON Schema object for the form values payload.
 */
export function toJsonSchema(schema: AgentFormSchema): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const field of schema.fields) {
    properties[field.id] = mapFieldToJsonSchema(field);
    if (field.required) {
      required.push(field.id);
    }
  }

  const jsonSchema: Record<string, unknown> = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: schema.title,
    type: "object",
    properties,
    additionalProperties: true,
  };

  if (schema.description) {
    jsonSchema.description = schema.description;
  }

  if (required.length > 0) {
    jsonSchema.required = required;
  }

  return jsonSchema;
}

/**
 * Exports the JSON Schema definition for the AgentFormSchema specification itself.
 * Uses zod-to-json-schema to produce a standard schema for authoring validation.
 *
 * @returns JSON Schema describing valid AgentFormSchema documents.
 */
export function toFormDefinitionJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(agentFormSchema, "AgentFormSchema") as Record<string, unknown>;
}
