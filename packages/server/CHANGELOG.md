# @formaccurate/server

## 0.1.0

### Minor Changes

- e540af4: Implement complete Hono HTTP protocol layer, discovery endpoint, storage adapters, rate limiting, and receipts.

  - Discovery manifest at `GET /.well-known/formaccurate.json`
  - Schema, session state, and value patch routes (`GET/PATCH /agent/forms/:formId/*`)
  - Server-side validation route (`POST /agent/forms/:formId/validate`)
  - File upload handling with token generation and size/MIME enforcement (`POST /agent/forms/:formId/files`)
  - Secure form submission with UUID idempotency key checking, duplicate detection, consent confirmation, and verifiable receipt generation (`POST /agent/forms/:formId/submit`)
  - Receipt retrieval (`GET /receipts/:submissionId`)
  - Pluggable `StorageAdapter` with reference `MemoryStorageAdapter`
  - Scoped authentication middleware (`staticApiKeyAuthProvider`) and token-bucket rate limiting (`TokenBucketRateLimiter`)

### Patch Changes

- Updated dependencies [7b81bb6]
  - @formaccurate/core@0.1.0
