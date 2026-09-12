import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  FormAccurateHttpClient,
  type FormAccurateClientOptions,
} from "./client.js";
import {
  DISCOVER_FORMS_DESCRIPTION,
  discoverFormsSchema,
  handleDiscoverForms,
} from "./tools/discover-forms.js";
import {
  GET_RECEIPT_DESCRIPTION,
  getReceiptSchema,
  handleGetReceipt,
} from "./tools/get-receipt.js";
import {
  GET_SCHEMA_DESCRIPTION,
  getSchemaSchema,
  handleGetSchema,
} from "./tools/get-schema.js";
import {
  GET_STATE_DESCRIPTION,
  getStateSchema,
  handleGetState,
} from "./tools/get-state.js";
import {
  SET_VALUES_DESCRIPTION,
  handleSetValues,
  setValuesSchema,
} from "./tools/set-values.js";
import {
  SUBMIT_DESCRIPTION,
  handleSubmit,
  submitSchema,
} from "./tools/submit.js";
import {
  VALIDATE_DESCRIPTION,
  handleValidate,
  validateSchema,
} from "./tools/validate.js";

/**
 * Creates and configures an McpServer instance registered with static FormAccurate tools.
 *
 * Descriptions and schemas are purely static and never derived from external form content,
 * preventing prompt-injection attacks.
 *
 * @param options - Server connection and authentication configuration.
 * @returns Configured McpServer instance.
 */
export function createMcpServer(options: FormAccurateClientOptions): McpServer {
  const client = new FormAccurateHttpClient(options);
  const server = new McpServer({
    name: "formaccurate-mcp",
    version: "0.1.0",
  });

  // 1. formaccurate_discover_forms
  server.tool(
    "formaccurate_discover_forms",
    DISCOVER_FORMS_DESCRIPTION,
    discoverFormsSchema,
    async (args) => {
      try {
        const result = await handleDiscoverForms(client, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  // 2. formaccurate_get_schema
  server.tool(
    "formaccurate_get_schema",
    GET_SCHEMA_DESCRIPTION,
    getSchemaSchema,
    async (args) => {
      try {
        const result = await handleGetSchema(client, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  // 3. formaccurate_get_state
  server.tool(
    "formaccurate_get_state",
    GET_STATE_DESCRIPTION,
    getStateSchema,
    async (args) => {
      try {
        const result = await handleGetState(client, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  // 4. formaccurate_set_values
  server.tool(
    "formaccurate_set_values",
    SET_VALUES_DESCRIPTION,
    setValuesSchema,
    async (args) => {
      try {
        const result = await handleSetValues(client, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  // 5. formaccurate_validate
  server.tool(
    "formaccurate_validate",
    VALIDATE_DESCRIPTION,
    validateSchema,
    async (args) => {
      try {
        const result = await handleValidate(client, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  // 6. formaccurate_submit
  server.tool(
    "formaccurate_submit",
    SUBMIT_DESCRIPTION,
    submitSchema,
    async (args) => {
      try {
        const result = await handleSubmit(client, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  // 7. formaccurate_get_receipt
  server.tool(
    "formaccurate_get_receipt",
    GET_RECEIPT_DESCRIPTION,
    getReceiptSchema,
    async (args) => {
      try {
        const result = await handleGetReceipt(client, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  return server;
}

/**
 * Starts the FormAccurate MCP server over standard input/output (stdio).
 *
 * @param options - Configuration options for connecting to the FormAccurate backend.
 */
export async function startStdioServer(
  options: FormAccurateClientOptions,
): Promise<void> {
  const server = createMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
