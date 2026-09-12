# Architecture & Monorepo Boundaries

FormAccurate is designed with strict runtime boundaries to guarantee type safety, portability, and zero unintended dependencies.

## Package Architecture

```
                  ┌───────────────────────────────┐
                  │      @formaccurate/core       │
                  │ (Schemas, Zod, State Machine) │
                  │  Zero I/O, Pure TypeScript    │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ @formaccurate/web │   │@formaccurate/serv │   │ @formaccurate/cli │
│  (DOM Bridge,     │   │ (Hono HTTP Server,│   │ (fa lint/validate)│
│  window binding)  │   │  Auth, Storage)   │   └───────────────────┘
└─────────┬─────────┘   └─────────┬─────────┘
          │                       │
          ▼                       ▼
┌───────────────────┐   ┌───────────────────┐
│@formaccurate/react│   │ @formaccurate/mcp │
│ (Hooks, Context)  │   │ (Claude / Cursor) │
└───────────────────┘   └───────────────────┘
```

## Strict Boundary Rules

1. **`@formaccurate/core`**:
   - MUST NEVER import `node:*`, `document`, `window`, or any DOM library types.
   - Contains pure algorithms: JSON Schema generation, Zod validators, state machine transitions, and canonical receipt hashing.
2. **`@formaccurate/web`**:
   - Operates in browser runtimes.
   - Progressively enhances standard DOM elements using `data-fa-*`.
   - Mounts `window.FormAccurate` singleton.
3. **`@formaccurate/server`**:
   - Built on [Hono](https://hono.dev/) with Fetch API primitives (`Request`, `Response`, `Headers`).
   - Runs identically on Node.js, Bun, Deno, and Cloudflare Workers.
4. **`@formaccurate/react`**:
   - Provides idiomatic `<FormAccurateProvider>` and `useFormAccurate()` hook.
5. **`@formaccurate/mcp`**:
   - Thin wrapper around Model Context Protocol stdio transport.
   - Exposes 7 static tools defending against prompt injection.
