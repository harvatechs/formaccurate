---
layout: home

hero:
  name: "FormAccurate"
  text: "Make web forms natively agent-readable"
  tagline: "No screenshots. No vision models. No DOM guessing. Real schemas, real validation, verifiable receipts."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/formaccurate/formaccurate
    - theme: alt
      text: Protocol Spec
      link: /spec/protocol

features:
  - icon: 📜
    title: Schema-First Architecture
    details: Declare forms with versioned JSON Schema definitions. Single source of truth for browsers, edge servers, and AI agents.
  - icon: 🔒
    title: Cryptographic Verifiable Receipts
    details: Every submission generates a canonical SHA-256 receipt proving payload integrity and auditability.
  - icon: ⚡
    title: Multi-Runtime Portability
    details: Zero-I/O core runs anywhere. Web bridge enhances existing HTML. Server mounts on Hono across Node, Bun, Deno, and Cloudflare.
  - icon: 🤖
    title: Model Context Protocol (MCP)
    details: Plug-and-play MCP tools for Claude Desktop, Cursor, and custom autonomous agents with prompt-injection defense.
---

## Comparison

::: code-group

```txt [Today: Vision Model Guessing]
1. Take screenshot of complex multi-step form
2. Vision model guesses button coordinates and input labels
3. Synthetic mouse clicks and keyboard events blindly injected
4. Error dialogs missed or misread; silent submission failures
5. Zero verifiable audit trail or proof of transaction
```

```txt [FormAccurate: Deterministic Protocol]
1. Discover form manifest at /.well-known/formaccurate.json
2. Retrieve typed JSON Schema declaring fields, types, and constraints
3. Incremental validation and file attachment uploads
4. Explicit consent attestation with legal declaration matching
5. Idempotent submission returning cryptographic SHA-256 receipt
```

:::

## Quick Install

```bash
# In your existing web application
pnpm add @formaccurate/web

# On your server / API backend
pnpm add @formaccurate/server @formaccurate/core

# For React applications
pnpm add @formaccurate/react

# Command-line schema linter and scaffolding
pnpm add -D @formaccurate/cli
```
