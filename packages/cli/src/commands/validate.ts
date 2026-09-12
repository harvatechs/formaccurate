import fs from "node:fs/promises";
import path from "node:path";
import {
  agentFormSchema,
  validateForm,
  type AgentFormSchema,
  type FieldError,
} from "@formaccurate/core";

export interface ValidateResult {
  valid: boolean;
  errors: FieldError[];
}

/**
 * Validates a dictionary of values against a provided AgentFormSchema.
 *
 * @param schema - Parsed AgentFormSchema object.
 * @param values - Values record to validate.
 * @returns Result object containing valid boolean and any FieldErrors.
 */
export function validateValues(
  schema: AgentFormSchema,
  values: Record<string, unknown>,
): ValidateResult {
  const errors = validateForm(schema, values, { isSubmit: true });
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * CLI action for 'fa validate <schemaPath> --values <valuesPath>'.
 *
 * @param schemaPath - Path to the schema file.
 * @param options.values - Path to the values JSON file.
 * @returns Exit code (0 for valid, 1 for invalid or read error).
 */
export async function validateCommand(
  schemaPath: string,
  options: { values?: string },
): Promise<number> {
  if (!options.values) {
    console.error("Error: --values <valuesPath> is required for 'fa validate'");
    return 1;
  }

  const resolvedSchemaPath = path.resolve(process.cwd(), schemaPath);
  const resolvedValuesPath = path.resolve(process.cwd(), options.values);

  let rawSchema: unknown;
  try {
    const text = await fs.readFile(resolvedSchemaPath, "utf-8");
    rawSchema = JSON.parse(text);
  } catch (err) {
    console.error(`Error reading schema file '${schemaPath}': ${(err as Error).message}`);
    return 1;
  }

  const schemaParseResult = agentFormSchema.safeParse(rawSchema);
  if (!schemaParseResult.success) {
    console.error(`Error: '${schemaPath}' is not a valid AgentFormSchema:`);
    for (const err of schemaParseResult.error.errors) {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    }
    return 1;
  }
  const schema = schemaParseResult.data;

  let rawValues: unknown;
  try {
    const text = await fs.readFile(resolvedValuesPath, "utf-8");
    rawValues = JSON.parse(text);
  } catch (err) {
    console.error(`Error reading values file '${options.values}': ${(err as Error).message}`);
    return 1;
  }

  if (typeof rawValues !== "object" || rawValues === null || Array.isArray(rawValues)) {
    console.error(`Error: values file '${options.values}' must contain a JSON object of field values.`);
    return 1;
  }

  const result = validateValues(schema, rawValues as Record<string, unknown>);
  if (result.valid) {
    process.stdout.write(`✓ Values in '${options.values}' are valid for form '${schema.formId}'.\n`);
    return 0;
  }

  console.error(`✗ Validation failed with ${result.errors.length} error(s):`);
  for (const err of result.errors) {
    const fieldPart = err.fieldId ? ` [${err.fieldId}]` : "";
    console.error(`  - ${err.code}${fieldPart}: ${err.message}`);
  }
  return 1;
}
