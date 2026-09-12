# @formaccurate/mcp

## 0.1.0

### Minor Changes

- 277d8c3: Implement Model Context Protocol (MCP) server for FormAccurate.

  - Fixed, static tool registrations defending against prompt injection (`SECURITY.md`)
  - 7 standard MCP tools: `formaccurate_discover_forms`, `formaccurate_get_schema`, `formaccurate_get_state`, `formaccurate_set_values`, `formaccurate_validate`, `formaccurate_submit`, `formaccurate_get_receipt`
  - Automatic UUID idempotency key generation
  - Stdio server transport with executable CLI binary `formaccurate-mcp`
  - Configurable for Claude Desktop, Cursor, and custom MCP clients

### Patch Changes

- Updated dependencies [7b81bb6]
  - @formaccurate/core@0.1.0
