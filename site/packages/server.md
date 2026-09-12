# @formaccurate/server

Hono-based HTTP server implementation of the FormAccurate Agent Protocol. Provides discovery, REST API endpoints, pluggable storage adapters, and rate limiting.

## Installation

```bash
pnpm add @formaccurate/server @formaccurate/core
```

## Public API Reference

### `createFormAccurateServer(options)`

Factory function creating a mountable Hono application instance implementing all standard routes.

```typescript
import {
  createFormAccurateServer,
  MemoryStorageAdapter,
  staticApiKeyAuthProvider,
} from "@formaccurate/server";
import { businessPermitSchema } from "./schema.js";

export const app = createFormAccurateServer({
  forms: [businessPermitSchema],
  storage: new MemoryStorageAdapter(),
  siteOrigin: "https://example.gov",
  auth: staticApiKeyAuthProvider({
    "secret-agent-key": {
      subject: "service-agent",
      scopes: ["form:read", "form:write", "form:submit", "form:upload", "form:read_receipt"],
    },
  }),
  logSink: (event) => {
    console.log(`[AUDIT] ${event.timestamp} ${event.event} ${event.formId}`);
  },
});
```

### Storage Adapters

FormAccurate provides a clean storage interface `StorageAdapter`:

```typescript
interface StorageAdapter {
  createSession(formId: string, initialValues?: FormValues): Promise<SessionRecord>;
  getSession(sessionId: string): Promise<SessionRecord | null>;
  saveSession(session: SessionRecord): Promise<void>;
  saveFileToken(token: FileTokenRecord): Promise<void>;
  getFileToken(tokenId: string): Promise<FileTokenRecord | null>;
  saveSubmission(submission: SubmissionRecord): Promise<void>;
  getSubmission(submissionId: string): Promise<SubmissionRecord | null>;
  getSubmissionByIdempotencyKey(key: string): Promise<SubmissionRecord | null>;
}
```

Includes reference `MemoryStorageAdapter` for testing and development.
