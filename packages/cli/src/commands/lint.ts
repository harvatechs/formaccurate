import fs from "node:fs/promises";
import path from "node:path";
import { agentFormSchema } from "@formaccurate/core";

export interface LintError {
  path: string;
  message: string;
}

export interface LintResult {
  valid: boolean;
  errors: LintError[];
}

/**
 * Validates a schema object against the normative AgentFormSchema Zod specification.
 *
 * @param data - Raw parsed schema object.
 * @returns Result object containing validity boolean and detailed path-attributed error list.
 */
export function lintSchema(data: unknown): LintResult {
  const result = agentFormSchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors: LintError[] = result.error.errors.map((err) => ({
    path: err.path.join(".") || "root",
    message: err.message,
  }));

  return { valid: false, errors };
}

/**
 * CLI action for 'fa lint <filePath>'.
 * Reads file from disk, parses JSON, and outputs human-friendly diagnostics.
 *
 * @param filePath - Path to the schema file.
 * @returns Exit code (0 for valid, 1 for invalid or read error).
 */
export async function lintCommand(filePath: string): Promise<number> {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  let content: string;
  try {
    content = await fs.readFile(resolvedPath, "utf-8");
  } catch (err) {
    console.error(`Error reading schema file '${filePath}': ${(err as Error).message}`);
    return 1;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error(`Error parsing JSON in '${filePath}': ${(err as Error).message}`);
    return 1;
  }

  const result = lintSchema(parsed);
  if (result.valid) {
    const formId = (parsed as { formId?: string })?.formId ?? path.basename(filePath);
    process.stdout.write(`✓ Schema '${formId}' is valid.\n`);
    return 0;
  }

  console.error(`✗ Schema validation failed with ${result.errors.length} error(s) in '${filePath}':`);
  for (const err of result.errors) {
    console.error(`  - ${err.path}: ${err.message}`);
  }
  return 1;
}
