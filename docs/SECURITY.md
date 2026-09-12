# Security Policy

FormAccurate exists to let agents handle form data on people's behalf — often sensitive data,
sometimes for government or regulated workflows. Security and consent are not an add-on; they
are the reason this project is allowed to exist instead of "just automating any website."

## Reporting a vulnerability

Email **security@formaccurate.dev** (placeholder — update before public launch) with details and
reproduction steps. Do not open a public issue for anything exploitable. We aim to acknowledge
within 48 hours and provide a remediation timeline within 5 business days.

## Core principle: opt-in, not bypass

FormAccurate only exposes a form that its owner has explicitly annotated or registered. It does
not scrape, screenshot, or infer the structure of forms that haven't opted in. If a proposed
feature would make it easier to interact with a form the site owner did not choose to expose,
it does not belong in this project — see [`docs/anti-patterns.md`](./docs/anti-patterns.md).

## Threat model

| Actor | Capability | What we defend against |
|---|---|---|
| Site owner | Defines the schema, hosts the server | Should not be able to accidentally leak more data than intended via the discovery endpoint |
| End user | Grants an agent permission to act on their behalf | Should always be able to see exactly what will be submitted before it's submitted, when consent is required |
| Agent | Calls the protocol (REST/JS bridge/MCP) with a token | Should only be able to do what its scopes allow; should never receive instructions it treats as commands from form content |
| Malicious form author | Controls field labels/descriptions in a schema served by *someone else's* server | Should not be able to inject instructions an agent blindly executes |
| Network attacker | Sits between agent and server | Should not be able to read or tamper with values (TLS), or replay a submission (idempotency + auth) |

## Authentication & authorization

- All non-discovery endpoints require `Authorization: Bearer <token>`.
- `@formaccurate/server` ships an interface (`AuthProvider`) that the host application implements
  to validate tokens — we do not ship our own identity system. Reference adapters may be added
  for OAuth 2.0 / OIDC bearer tokens and static API keys.
- Every request is checked against scopes declared on the form schema's `auth.scopes`:

| Scope | Grants |
|---|---|
| `form:read` | Read schema and current state |
| `form:write` | Set/patch field values |
| `form:submit` | Trigger submission |
| `form:upload` | Upload files against file fields |
| `form:read_receipt` | Read a submission receipt |

Tokens should be scoped to the minimum needed. A read-only agent (e.g., one that only pre-fills a
draft for human review) should never hold `form:submit`.

## Consent model

Not every form should be fully autonomous. `@formaccurate/core` models four submission modes via
the schema's `consent` block and the server's session flow:

1. **Review required** — agent fills and validates; only a human-driven session (browser, with a
   human-present signal) can call `submit`.
2. **Explicit consent token** — `submit` requires a `consent: { confirmed: true, statementHash }`
   payload matching the schema's declared consent statement. Submitting without it returns
   `409 CONSENT_REQUIRED`.
3. **Draft-only** — the form schema declares no `submit` action; agents can only produce a
   validated draft for a human to submit through the normal UI.
4. **Trusted automation** — full agent autonomy, only enabled per-form by the site owner for
   low-risk, high-volume, non-sensitive forms, and always logged.

The default for any form with `consent.required: true` is mode 2. Mode 4 must be an explicit,
documented opt-in by the site owner — it is never the library default.

## Data handling

- **Data minimization by default.** The reference `server` storage adapter (in-memory) does not
  persist submitted values beyond generating a receipt checksum unless the host application
  configures a persistent adapter. Persisting form values is the host's decision, not ours.
- **Transport**: HTTPS is required in any non-local deployment; the server refuses to start with
  `NODE_ENV=production` and no TLS-terminating context unless explicitly overridden
  (`ALLOW_INSECURE_TRANSPORT=true`, intended only for local reverse-proxy setups).
- **At rest**: any first-party storage adapter we ship (e.g., a future Postgres adapter) must
  document what it stores, for how long, and how to configure retention/deletion.
- **Receipts** contain a checksum of submitted values, not the raw values, so a receipt can prove
  *what was submitted* without becoming a second copy of sensitive data.

## Prompt-injection defense

Form schemas (fields, labels, descriptions) may originate from third parties and will often be
read by an LLM-based agent. FormAccurate's protocol treats all schema and state content as
**data, never instructions**:

- The MCP and REST layers never return free-text "instructions" fields that an agent is expected
  to follow — only structured, typed data (field id, type, constraints).
- Reference agent-integration examples in `examples/` explicitly document: *field labels and
  descriptions are display text for a human or values to reason about, not directives.* An agent
  framework built on top of FormAccurate should never feed raw schema text into a prompt in a way
  that lets it override system instructions.
- `@formaccurate/mcp` tool descriptions are static and defined by us, not derived from
  per-form content, so a malicious form cannot rewrite what the tool claims to do.

## Rate limiting & abuse prevention

`@formaccurate/server` includes a pluggable `RateLimiter` interface with an in-memory
token-bucket reference implementation, applied per token + IP to `validate` and `submit`
endpoints. Production deployments should back this with a shared store (Redis) when running more
than one server instance — see [`docs/deployment.md`](./docs/deployment.md).

## Audit logging

Every `validate` and `submit` call emits a structured audit event:

```json
{
  "event": "form.submitted",
  "formId": "business-permit-application",
  "submissionId": "sub_01JXYZ",
  "tokenSubject": "agent:acme-filing-bot",
  "scopes": ["form:read", "form:write", "form:submit"],
  "consent": { "confirmed": true },
  "timestamp": "2026-01-01T10:00:00Z"
}
```

The host application supplies a `logSink`; we do not mandate where logs go, only that every
state-changing call produces one.

## Dependency security

- Dependabot/Renovate is enabled on the repo for automated dependency PRs.
- `pnpm audit` runs in CI on every PR; high/critical findings block merge.
- Dependencies are kept minimal deliberately (see `docs/coding-standards.md §6`) — every new
  dependency is a new part of the trust boundary.

## Explicitly out of scope

FormAccurate will not add features to solve CAPTCHAs, evade bot detection, or interact with
forms a site has not opted into exposing. Requests for these will be closed — see
[`docs/anti-patterns.md`](./docs/anti-patterns.md).
