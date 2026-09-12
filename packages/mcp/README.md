# @formaccurate/mcp

Model Context Protocol (MCP) server for FormAccurate. Exposes standardized, prompt-injection-safe tools that allow Claude, Cursor, and any MCP-compatible agent to discover, inspect, fill, validate, and submit web forms with cryptographic receipts.

- **Prompt Injection Defense**: Tool descriptions and schemas are 100% static and never derived from per-form content (see `SECURITY.md §Prompt-injection defense`).
- **Full Protocol Coverage**: Implements all 7 standard protocol operations from `docs/spec-protocol.md §MCP tools`.
- **Zero Business Logic**: Acts as a thin, typed wrapper around any `@formaccurate/server` REST endpoint.

## Installation & Running

### Run directly with `npx`

```bash
npx @formaccurate/mcp
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `FORMACCURATE_SERVER_URL` | Base URL of your FormAccurate server | `http://localhost:3000` |
| `FORMACCURATE_API_KEY` | Optional Bearer authorization token | `undefined` |

## MCP Client Configuration

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "formaccurate": {
      "command": "npx",
      "args": ["-y", "@formaccurate/mcp"],
      "env": {
        "FORMACCURATE_SERVER_URL": "http://localhost:3000",
        "FORMACCURATE_API_KEY": "demo-agent-key-12345"
      }
    }
  }
}
```

### Cursor / Custom Clients

```json
{
  "command": "node",
  "args": ["/path/to/packages/mcp/dist/index.js"],
  "env": {
    "FORMACCURATE_SERVER_URL": "https://example.gov",
    "FORMACCURATE_API_KEY": "secret-token"
  }
}
```

## Available Tools

| Tool | Input Parameters | Description |
|---|---|---|
| `formaccurate_discover_forms` | `{ origin?: string }` | Discovers available FormAccurate forms at the target site (`/.well-known/formaccurate.json`) |
| `formaccurate_get_schema` | `{ formId: string }` | Retrieves the complete `AgentFormSchema` definition, field types, and constraints |
| `formaccurate_get_state` | `{ formId: string, sessionId?: string }` | Retrieves the active `FormState`, or initializes a new draft session |
| `formaccurate_set_values` | `{ formId: string, sessionId: string, values: object }` | Merges field values into an active form session without premature error noise |
| `formaccurate_validate` | `{ formId: string, sessionId: string }` | Executes server-side validation against current values and returns structured errors |
| `formaccurate_submit` | `{ formId: string, sessionId: string, consent?: object, idempotencyKey?: string }` | Submits the form with consent confirmation and returns a verifiable receipt |
| `formaccurate_get_receipt` | `{ submissionId: string }` | Retrieves a previously issued receipt with cryptographic SHA-256 checksum |

## Programmatic Usage

```typescript
import { createMcpServer, startStdioServer } from "@formaccurate/mcp";

// 1. Programmatic server creation
const server = createMcpServer({
  baseUrl: "https://example.gov",
  token: "secret-token",
});

// 2. Or start stdio listener directly
await startStdioServer({
  baseUrl: "https://example.gov",
  token: "secret-token",
});
```
