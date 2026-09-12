/**
 * @packageDocumentation
 * \@formaccurate/cli
 *
 * Command-line interface for FormAccurate: schema linting, value validation, and scaffolding.
 */

export { createCli } from "./cli.js";
export {
  lintSchema,
  lintCommand,
  type LintError,
  type LintResult,
} from "./commands/lint.js";
export {
  validateValues,
  validateCommand,
  type ValidateResult,
} from "./commands/validate.js";
export {
  scaffoldSchema,
  scaffoldCommand,
  type ScaffoldOptions,
} from "./commands/scaffold.js";

// CLI execution when run directly as executable or npx
import { createCli } from "./cli.js";

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("index.js") ||
    process.argv[1].endsWith("index.ts") ||
    process.argv[1].endsWith("fa") ||
    process.argv[1].endsWith("formaccurate"));

if (isMainModule) {
  createCli().parse(process.argv);
}
