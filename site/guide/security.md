# Security & Consent Model

FormAccurate enforces rigorous security guarantees to prevent unauthorized automation, prompt injection, and fraudulent form submissions.

## 1. Explicit Consent Enforcement

When a form schema defines `consent.required: true`, the FormAccurate server enforces consent verification:

```json
{
  "consent": {
    "required": true,
    "statement": "I declare under penalty of perjury that the statements made herein are true and correct.",
    "confirmationFieldId": "confirm_truthful"
  }
}
```

- Submissions missing `consent: { confirmed: true }` are rejected with HTTP `400 Bad Request` (`consent_required`).
- The confirmation boolean field declared in the schema MUST be `true`.
- Agents must explicitly surface the exact legal statement to the user before submitting.

## 2. Prompt-Injection Defense

Form labels, descriptions, and user inputs are strictly data, NEVER instructions.
- All MCP tools in `@formaccurate/mcp` register static descriptions that do not interpolate form labels or dynamic user content into system prompts.
- Schemas strictly disallow executable JavaScript or regex evaluation loopholes (`eval`, function constructors, or unrestricted script execution).

## 3. Scope-Based Authorization

The server protocol enforces standard OAuth 2.0 / API key scopes:

| Scope | Permission |
|---|---|
| `form:read` | Read schema and public form details |
| `form:write` | Create sessions and patch form field values |
| `form:upload` | Upload document attachments to secure staging |
| `form:submit` | Submit finalized form sessions |
| `form:read_receipt` | Retrieve verifiable submission receipts |

## 4. Idempotency & Replay Protection

All `POST /agent/forms/:formId/submit` requests require an `Idempotency-Key` header (standard UUID v4).
- **First submission**: Stores receipt and returns HTTP `200 OK`.
- **Identical replay**: Returns HTTP `200 OK` with the exact same receipt without re-executing actions.
- **Conflicting replay**: If an existing key is reused with a different payload, the server rejects with HTTP `409 Conflict`.
