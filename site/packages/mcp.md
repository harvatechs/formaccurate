# @formaccurate/mcp

Model Context Protocol (MCP) server for FormAccurate. Allows LLM assistants (such as Claude Desktop and Cursor) to autonomously discover, validate, fill, and submit web forms over standard stdio transport.

## Installation

```bash
pnpm add @formaccurate/mcp
```

## Running the Server

Run directly as a binary or via npx:

```bash
# Start the stdio MCP server pointing to your backend
FORMACCURATE_SERVER_URL=http://localhost:3000 FORMACCURATE_AUTH_TOKEN=demo-key npx @formaccurate/mcp
```

## Tools Exposed

1. `formaccurate_discover_forms`: Discovers forms exposed at `/.well-known/formaccurate.json`.
2. `formaccurate_get_schema`: Retrieves field constraints and JSON Schema for a specific form.
3. `formaccurate_get_state`: Checks current session values and error state.
4. `formaccurate_set_values`: Patches form field values into an active session.
5. `formaccurate_validate`: Runs server-side validation against current values.
6. `formaccurate_submit`: Submits the completed session with informed consent.
7. `formaccurate_get_receipt`: Retrieves verifiable submission receipts and cryptographic digests.

All tool definitions are statically declared to prevent prompt injection (`SECURITY.md`).
