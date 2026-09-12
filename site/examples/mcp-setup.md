# MCP Client Setup (Claude Desktop & Cursor)

This guide shows how to configure `@formaccurate/mcp` with popular AI assistants like Claude Desktop and Cursor.

## 1. Claude Desktop Configuration

Add the FormAccurate server to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "formaccurate": {
      "command": "npx",
      "args": ["-y", "@formaccurate/mcp"],
      "env": {
        "FORMACCURATE_SERVER_URL": "http://localhost:3000",
        "FORMACCURATE_AUTH_TOKEN": "demo-agent-key-12345"
      }
    }
  }
}
```

## 2. Cursor IDE Configuration

In Cursor Settings -> Features -> MCP Servers -> Add New MCP Server:

- **Name**: `formaccurate`
- **Type**: `command`
- **Command**: `npx -y @formaccurate/mcp`
- **Environment Variables**:
  - `FORMACCURATE_SERVER_URL`: `http://localhost:3000`
  - `FORMACCURATE_AUTH_TOKEN`: `demo-agent-key-12345`

## 3. Testing with Your Agent

Once connected, ask your agent:
> *"Discover any available forms on `http://localhost:3000`, explain what fields are required, and fill out an application for Acme Logistics."*

The assistant will autonomously invoke `formaccurate_discover_forms`, `formaccurate_get_schema`, and the remaining tools in sequence.
