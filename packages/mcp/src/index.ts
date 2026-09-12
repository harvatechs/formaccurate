/**
 * @packageDocumentation
 * \@formaccurate/mcp
 *
 * Model Context Protocol (MCP) server for FormAccurate: exposes standard tools
 * for discovering, inspecting, validating, and submitting forms via any MCP client.
 */

export {
  createMcpServer,
  startStdioServer,
} from "./server.js";

export {
  FormAccurateHttpClient,
  type FormAccurateClientOptions,
} from "./client.js";

export {
  DISCOVER_FORMS_DESCRIPTION,
  discoverFormsSchema,
  handleDiscoverForms,
} from "./tools/discover-forms.js";

export {
  GET_SCHEMA_DESCRIPTION,
  getSchemaSchema,
  handleGetSchema,
} from "./tools/get-schema.js";

export {
  GET_STATE_DESCRIPTION,
  getStateSchema,
  handleGetState,
} from "./tools/get-state.js";

export {
  SET_VALUES_DESCRIPTION,
  setValuesSchema,
  handleSetValues,
} from "./tools/set-values.js";

export {
  VALIDATE_DESCRIPTION,
  validateSchema,
  handleValidate,
} from "./tools/validate.js";

export {
  SUBMIT_DESCRIPTION,
  submitSchema,
  handleSubmit,
} from "./tools/submit.js";

export {
  GET_RECEIPT_DESCRIPTION,
  getReceiptSchema,
  handleGetReceipt,
} from "./tools/get-receipt.js";

// CLI stdio runner when executed directly
import { startStdioServer } from "./server.js";

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("index.js") || process.argv[1].endsWith("index.ts"));

if (isMainModule) {
  const baseUrl = process.env.FORMACCURATE_SERVER_URL || "http://localhost:3000";
  const token = process.env.FORMACCURATE_API_KEY;

  startStdioServer({ baseUrl, token }).catch((err) => {
    console.error("[FormAccurate MCP] Fatal startup error:", err);
    process.exit(1);
  });
}
