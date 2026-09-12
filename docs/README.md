# FormAccurate

**Make web forms natively agent-readable — no screenshots, no vision models, no DOM guessing.**

FormAccurate is an open-source SDK + protocol that lets a website expose any form as a
machine-readable schema, a validated state object, and a programmatic submission API. An AI
agent (or any automation) can discover a form, understand every field, fill it, validate it,
get consent when required, submit it, and receive a verifiable receipt — deterministically,
without ever taking a screenshot.

```
Today:     screenshot → vision model → guess elements → click/type → hope it works
FormAccurate: discover schema → set typed values → validate → submit → receipt
```

> **Status:** pre-1.0, under active development. The schema and protocol are versioned
> independently of the package versions — see [`docs/spec-schema.md`](./docs/spec-schema.md)
> for the versioning policy. Breaking changes are expected before `1.0.0`.

---

## Why this exists

Vision-based form automation is brittle, slow, and expensive — and it gets worse exactly
where reliability matters most: multi-step government forms, compliance workflows, file
uploads, and legal declarations. FormAccurate does not try to make agents better at *guessing*
what's on screen. It removes the guessing: the site opts in and exposes structure directly.

This is **opt-in infrastructure for site owners**, not a scraping or bot-evasion tool. See
[`SECURITY.md`](./SECURITY.md) for the consent and authorization model, and
[`docs/anti-patterns.md`](./docs/anti-patterns.md) for what this project explicitly refuses
to become.

## The three layers

| Layer | What it does | Package(s) |
|---|---|---|
| **Schema** | Standard, versioned JSON description of a form's fields, validation, steps, and consent requirements | `@formaccurate/core` |
| **Runtime bridge** | Live form state, values, errors, and actions — in the browser or on a server | `@formaccurate/web`, `@formaccurate/server` |
| **Agent protocol** | REST API, browser JS bridge, and MCP tools an agent can call | `@formaccurate/server`, `@formaccurate/mcp` |

## Packages

| Package | Description | Runtime |
|---|---|---|
| [`@formaccurate/core`](./packages/core) | Schema types, Zod validation engine, state machine, JSON Schema export. Zero I/O, zero DOM, zero Node APIs. | Any (pure TS) |
| [`@formaccurate/web`](./packages/web) | Browser SDK. Progressively enhances existing HTML forms via `data-fa-*` attributes; exposes `window.FormAccurate`. | Browser |
| [`@formaccurate/server`](./packages/server) | Hono-based HTTP layer: discovery endpoint, schema/state/validate/submit routes, pluggable storage. | Node, Bun, Deno, Edge |
| [`@formaccurate/react`](./packages/react) | `<FormAccurateProvider>` and `useFormAccurate()` hook wrapping core + web. | Browser (React) |
| [`@formaccurate/mcp`](./packages/mcp) | MCP server exposing form discovery/fill/validate/submit as agent tools. | Node |
| [`@formaccurate/cli`](./packages/cli) | `fa lint`, `fa validate`, `fa scaffold` — schema authoring and CI tooling. | Node |

## Quickstart

### 1. Annotate an existing form (browser mode)

```html
<form data-fa-form="business-permit-application">
  <label for="legal_name">Legal Business Name</label>
  <input id="legal_name" name="legal_name" data-fa-field="legal_name" autocomplete="organization" />

  <label for="email">Contact Email</label>
  <input id="email" name="email" type="email" data-fa-field="email" autocomplete="email" />

  <button type="submit" data-fa-action="submit">Submit Application</button>
</form>

<script type="module">
  import { initFormAccurate } from "@formaccurate/web";
  initFormAccurate();
</script>
```

That's enough for an agent in the same page context to call
`window.FormAccurate.getSchema("business-permit-application")` and get back a typed field list —
no rebuild required. See [`docs/spec-protocol.md`](./docs/spec-protocol.md) for the full bridge
API.

### 2. Expose it server-side (production mode)

```ts
import { Hono } from "hono";
import { createFormAccurateServer } from "@formaccurate/server";
import { businessPermitSchema } from "./forms/business-permit";

const app = new Hono();

app.route("/", createFormAccurateServer({
  forms: [businessPermitSchema],
  storage: "memory", // swap for a real adapter in production
}));

export default app;
```

This mounts `/.well-known/formaccurate.json`, `/agent/forms/:formId/schema`,
`/agent/forms/:formId/state`, `/agent/forms/:formId/validate`, and
`/agent/forms/:formId/submit`. Full reference: [`docs/spec-protocol.md`](./docs/spec-protocol.md).

## Documentation map

| Doc | Audience | Purpose |
|---|---|---|
| [`AGENTS.md`](./AGENTS.md) | The build agent / contributors | Non-negotiable engineering rules and definition of done |
| [`docs/architecture.md`](./docs/architecture.md) | Contributors | Monorepo layout, package boundaries, data flow |
| [`docs/spec-schema.md`](./docs/spec-schema.md) | Form authors, agent builders | Full Form Schema Layer specification |
| [`docs/spec-protocol.md`](./docs/spec-protocol.md) | Agent/integration builders | Discovery, REST API, JS bridge, MCP tools, webhooks |
| [`docs/roadmap.md`](./docs/roadmap.md) | Contributors | Milestones and granular task checklists |
| [`docs/coding-standards.md`](./docs/coding-standards.md) | Contributors | TS conventions, testing, exports, error handling |
| [`docs/deployment.md`](./docs/deployment.md) | Site operators | Publishing, hosting, CI/CD, production checklist |
| [`docs/debugging.md`](./docs/debugging.md) | Contributors | Diagnosing failures across all layers |
| [`docs/quality-checklist.md`](./docs/quality-checklist.md) | Contributors, reviewers | PR and release checklists |
| [`docs/anti-patterns.md`](./docs/anti-patterns.md) | Everyone | What this project will not do or accept |
| [`SECURITY.md`](./SECURITY.md) | Everyone | Threat model, auth, consent, disclosure |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Contributors | Dev setup, branching, RFC process |

## License

MIT — see `LICENSE`. FormAccurate is community infrastructure; the schema and protocol are
designed to be implementable by anyone, in any language, without this repo's code.
