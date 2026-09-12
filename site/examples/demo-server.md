# Autonomous Agent Flow Demo

The demo server (`examples/demo-server`) demonstrates the complete end-to-end lifecycle of an autonomous agent completing a municipal permit application over HTTP.

## Running the Demo

```bash
# Terminal 1: Start the server
pnpm --filter demo-server start

# Terminal 2: Run the autonomous agent
pnpm --filter demo-server agent
```

## Step-by-Step Flow

1. **Discovery**: Queries `GET /.well-known/formaccurate.json` and locates available forms.
2. **Schema Ingestion**: Calls `GET /agent/forms/:id/schema` to retrieve constraints and consent requirements.
3. **Session State**: Initializes session via `GET /agent/forms/:id/state`.
4. **Document Upload**: Uploads required `.pdf` corporate articles and obtains a secure file token (`filetok_...`).
5. **Incremental Patching**: Sends `PATCH /agent/forms/:id/values` applying company information.
6. **Validation**: Submits current values for server-side evaluation via `POST /agent/forms/:id/validate`.
7. **Legal Attestation**: Confirms required perjury declaration and legal statement.
8. **Idempotent Submission**: Posts submission with a UUID `Idempotency-Key` header and receives a cryptographic receipt.
9. **Replay Protection**: Replays duplicate submission with identical idempotency key; server returns identical receipt without duplicating records.
10. **Receipt Verification**: Fetches receipt and verifies that the canonical SHA-256 digest matches server storage records.
