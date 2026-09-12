import { Command } from "commander";
import { lintCommand } from "./commands/lint.js";
import { scaffoldCommand } from "./commands/scaffold.js";
import { validateCommand } from "./commands/validate.js";

/**
 * Creates and configures the FormAccurate CLI Commander instance.
 *
 * @returns Configured Command instance.
 */
export function createCli(): Command {
  const program = new Command();

  program
    .name("fa")
    .description("FormAccurate CLI — schema authoring, linting, and validation tools.")
    .version("0.1.0");

  program
    .command("lint <schemaPath>")
    .description("Validates a form schema against the AgentFormSchema specification.")
    .action(async (schemaPath: string) => {
      const exitCode = await lintCommand(schemaPath);
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
    });

  program
    .command("validate <schemaPath>")
    .description("Validates a JSON values file against a form schema.")
    .requiredOption("-v, --values <valuesPath>", "Path to JSON values file")
    .action(async (schemaPath: string, options: { values: string }) => {
      const exitCode = await validateCommand(schemaPath, options);
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
    });

  program
    .command("scaffold <formId>")
    .description("Generates a starter AgentFormSchema JSON definition.")
    .option("-t, --title <title>", "Human-readable form title")
    .option("-o, --output <path>", "Output file path (defaults to <formId>.json)")
    .action(async (formId: string, options: { title?: string; output?: string }) => {
      const exitCode = await scaffoldCommand(formId, options);
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
    });

  return program;
}
