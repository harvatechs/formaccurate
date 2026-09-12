import fs from "node:fs/promises";
import path from "node:path";
import type { AgentFormSchema } from "@formaccurate/core";

export interface ScaffoldOptions {
  title?: string | undefined;
  output?: string | undefined;
}

/**
 * Generates a starter AgentFormSchema definition.
 *
 * @param formId - Machine-readable identifier for the new form (kebab-case or snake_case).
 * @param options - Optional title override.
 * @returns Complete starter AgentFormSchema.
 */
export function scaffoldSchema(
  formId: string,
  options: { title?: string | undefined } = {},
): AgentFormSchema {
  const cleanId = formId.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const humanTitle =
    options.title ||
    cleanId
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return {
    $schema: "https://formaccurate.dev/schema/v1.json",
    formId: cleanId,
    version: "1.0.0",
    title: humanTitle,
    description: `Application form for ${humanTitle}.`,
    actions: [{ id: "submit", label: "Submit", type: "submit" }],
    fields: [
      {
        id: "full_name",
        type: "string",
        label: "Full Legal Name",
        description: "Your full name as shown on legal identification.",
        required: true,
        minLength: 2,
      },
      {
        id: "email",
        type: "email",
        label: "Contact Email Address",
        required: true,
      },
      {
        id: "consent_agreement",
        type: "boolean",
        label: "I confirm all information provided is accurate and complete.",
        required: true,
      },
    ],
    consent: {
      required: true,
      statement: "I certify that all information submitted is accurate.",
      confirmationFieldId: "consent_agreement",
    },
    auth: {
      required: true,
      scopes: ["form:read", "form:write", "form:submit", "form:read_receipt"],
    },
  };
}

/**
 * CLI action for 'fa scaffold <formId> [--title <title>] [--output <outputPath>]'.
 *
 * @param formId - Form identifier to scaffold.
 * @param options - Title and output path flags.
 * @returns Exit code (0 for success, 1 on error).
 */
export async function scaffoldCommand(
  formId: string,
  options: ScaffoldOptions = {},
): Promise<number> {
  const schema = scaffoldSchema(formId, { title: options.title });
  const targetPath = options.output
    ? path.resolve(process.cwd(), options.output)
    : path.resolve(process.cwd(), `${schema.formId}.json`);

  const jsonContent = JSON.stringify(schema, null, 2);

  try {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, jsonContent + "\n", "utf-8");
    process.stdout.write(`✓ Created starter schema: ${targetPath}\n\n`);
    process.stdout.write("Register this schema with your FormAccurate server:\n");
    process.stdout.write(
      `import { createFormAccurateServer } from "@formaccurate/server";\nimport schema from "./${path.basename(targetPath)}";\n\nconst app = createFormAccurateServer({\n  forms: [schema],\n});\n`,
    );
    return 0;
  } catch (err) {
    console.error(`Error writing scaffold schema to '${targetPath}': ${(err as Error).message}`);
    return 1;
  }
}
