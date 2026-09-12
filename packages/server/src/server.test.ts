import { describe, expect, it } from "vitest";
import type { AgentFormSchema } from "@formaccurate/core";
import {
  createFormAccurateServer,
  MemoryStorageAdapter,
  staticApiKeyAuthProvider,
  TokenBucketRateLimiter,
  buildDiscoveryDocument,
  type AuditEvent,
} from "./index.js";

const TEST_FORM: AgentFormSchema = {
  $schema: "https://formaccurate.dev/schema/v1.json",
  version: "1.0",
  formId: "business-permit",
  title: "Business Operating Permit Application",
  description: "Apply for a city commercial operating permit",
  actions: [
    { id: "submit", label: "Submit Application", type: "submit" },
  ],
  fields: [
    {
      id: "businessName",
      type: "string",
      label: "Legal Business Name",
      required: true,
      minLength: 2,
    },
    {
      id: "businessType",
      type: "select",
      label: "Entity Structure",
      required: true,
      options: [
        { value: "llc", label: "Limited Liability Company" },
        { value: "corp", label: "Corporation" },
      ],
    },
    {
      id: "taxId",
      type: "string",
      label: "Federal Tax ID",
      required: true,
      pattern: "^\\d{2}-\\d{7}$",
    },
    {
      id: "permitDoc",
      type: "file",
      label: "Articles of Organization",
      required: false,
      accept: ["application/pdf", "image/png"],
      maxFiles: 1,
      maxSizeMb: 5,
    },
    {
      id: "agreeTerms",
      type: "boolean",
      label: "I confirm all information is true",
      required: true,
    },
  ],
  consent: {
    required: true,
    statement: "I authorize verification of this business permit application.",
    confirmationFieldId: "agreeTerms",
  },
};

describe("buildDiscoveryDocument", () => {
  it("generates correct discovery format with absolute and relative links", () => {
    const doc = buildDiscoveryDocument([TEST_FORM], "https://permits.gov", "/agent/forms");
    expect(doc.version).toBe("1.0");
    expect(doc.site).toBe("https://permits.gov");
    expect(doc.forms).toHaveLength(1);
    expect(doc.forms[0]).toEqual({
      id: "business-permit",
      title: "Business Operating Permit Application",
      description: "Apply for a city commercial operating permit",
      schemaUrl: "https://permits.gov/agent/forms/business-permit/schema",
      stateUrl: "https://permits.gov/agent/forms/business-permit/state",
      submitUrl: "https://permits.gov/agent/forms/business-permit/submit",
    });
  });
});

describe("createFormAccurateServer endpoints", () => {
  it("serves /.well-known/formaccurate.json and /healthz", async () => {
    const server = createFormAccurateServer({
      forms: [TEST_FORM],
      siteOrigin: "https://example.com",
    });

    const resDiscovery = await server.request("/.well-known/formaccurate.json");
    expect(resDiscovery.status).toBe(200);
    const discovery = await resDiscovery.json();
    expect(discovery.forms[0].id).toBe("business-permit");

    const resHealth = await server.request("/healthz");
    expect(resHealth.status).toBe(200);
    const health = await resHealth.json();
    expect(health.status).toBe("ok");
  });

  it("adds X-FormAccurate-Request-Id header to all responses", async () => {
    const server = createFormAccurateServer({ forms: [TEST_FORM] });
    const res = await server.request("/healthz");
    const reqId = res.headers.get("X-FormAccurate-Request-Id");
    expect(reqId).toMatch(/^req_/);
  });

  it("returns schema for valid formId and 404 for unknown formId", async () => {
    const server = createFormAccurateServer({ forms: [TEST_FORM] });

    const resOk = await server.request("/agent/forms/business-permit/schema");
    expect(resOk.status).toBe(200);
    const schema = await resOk.json();
    expect(schema.formId).toBe("business-permit");

    const resNotFound = await server.request("/agent/forms/unknown-form/schema");
    expect(resNotFound.status).toBe(404);
  });

  it("handles state creation and value patches", async () => {
    const storage = new MemoryStorageAdapter();
    const server = createFormAccurateServer({ forms: [TEST_FORM], storage });

    // 1. Initial state creates session
    const resInit = await server.request("/agent/forms/business-permit/state");
    expect(resInit.status).toBe(200);
    const state = await resInit.json();
    expect(state.sessionId).toMatch(/^sess_/);
    expect(state.status).toBe("draft");

    // 2. Fetching with sessionId retrieves existing session
    const resGet = await server.request(
      `/agent/forms/business-permit/state?sessionId=${state.sessionId}`,
    );
    expect(resGet.status).toBe(200);
    const stateGet = await resGet.json();
    expect(stateGet.sessionId).toBe(state.sessionId);

    // 3. Patch values
    const resPatch = await server.request("/agent/forms/business-permit/values", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        values: { businessName: "Acme Corp", businessType: "llc" },
      }),
    });
    expect(resPatch.status).toBe(200);
    const patchedState = await resPatch.json();
    expect(patchedState.values.businessName).toBe("Acme Corp");
    expect(patchedState.values.businessType).toBe("llc");
  });

  it("validates form values and returns validation errors", async () => {
    const storage = new MemoryStorageAdapter();
    const server = createFormAccurateServer({ forms: [TEST_FORM], storage });

    // Initialize session
    const resInit = await server.request("/agent/forms/business-permit/state");
    const state = await resInit.json();

    // Validate incomplete state
    const resVal1 = await server.request("/agent/forms/business-permit/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
    expect(resVal1.status).toBe(200);
    const valResult1 = await resVal1.json();
    expect(valResult1.status).toBe("invalid");
    expect(valResult1.errors.length).toBeGreaterThan(0);

    // Update with valid values
    await server.request("/agent/forms/business-permit/values", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        values: {
          businessName: "Acme Corporation",
          businessType: "llc",
          taxId: "12-3456789",
          agreeTerms: true,
        },
      }),
    });

    const resVal2 = await server.request("/agent/forms/business-permit/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
    expect(resVal2.status).toBe(200);
    const valResult2 = await resVal2.json();
    expect(valResult2.status).toBe("valid");
    expect(valResult2.errors).toHaveLength(0);
  });

  it("handles file uploads with size and MIME validation", async () => {
    const storage = new MemoryStorageAdapter();
    const server = createFormAccurateServer({ forms: [TEST_FORM], storage });

    // 1. Rejected MIME type
    const resBadMime = await server.request("/agent/forms/business-permit/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldId: "permitDoc",
        filename: "script.exe",
        sizeBytes: 1024,
        mimeType: "application/x-msdownload",
      }),
    });
    expect(resBadMime.status).toBe(400);

    // 2. Rejected File Size
    const resTooLarge = await server.request("/agent/forms/business-permit/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldId: "permitDoc",
        filename: "large.pdf",
        sizeBytes: 10 * 1024 * 1024,
        mimeType: "application/pdf",
      }),
    });
    expect(resTooLarge.status).toBe(400);

    // 3. Valid file upload
    const resOk = await server.request("/agent/forms/business-permit/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldId: "permitDoc",
        filename: "articles.pdf",
        sizeBytes: 1024 * 100,
        mimeType: "application/pdf",
      }),
    });
    expect(resOk.status).toBe(200);
    const fileRes = await resOk.json();
    expect(fileRes.fileToken).toMatch(/^filetok_/);
    expect(fileRes.filename).toBe("articles.pdf");
  });

  it("enforces consent and handles submissions with verifiable receipts and idempotency", async () => {
    const storage = new MemoryStorageAdapter();
    const auditEvents: AuditEvent[] = [];
    const server = createFormAccurateServer({
      forms: [TEST_FORM],
      storage,
      logSink: (evt) => auditEvents.push(evt),
    });

    const resInit = await server.request("/agent/forms/business-permit/state");
    const state = await resInit.json();

    // Populate valid values EXCEPT consent
    await server.request("/agent/forms/business-permit/values", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        values: {
          businessName: "Acme Corporation",
          businessType: "corp",
          taxId: "12-3456789",
          agreeTerms: false,
        },
      }),
    });

    const validUuid1 = "123e4567-e89b-12d3-a456-426614174000";

    // 1. Missing Idempotency-Key
    const resNoIdem = await server.request("/agent/forms/business-permit/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
    expect(resNoIdem.status).toBe(400);

    // 2. Invalid Idempotency-Key (not UUID)
    const resBadIdem = await server.request("/agent/forms/business-permit/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "not-a-uuid",
      },
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
    expect(resBadIdem.status).toBe(400);

    // 3. Consent required error (409)
    const resNoConsent = await server.request("/agent/forms/business-permit/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": validUuid1,
      },
      body: JSON.stringify({
        sessionId: state.sessionId,
        consent: { confirmed: false },
      }),
    });
    expect(resNoConsent.status).toBe(409);

    // 4. Update with consent and valid values
    await server.request("/agent/forms/business-permit/values", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        values: {
          agreeTerms: true,
        },
      }),
    });

    // 5. Successful submission
    const resSubmit = await server.request("/agent/forms/business-permit/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": validUuid1,
      },
      body: JSON.stringify({
        sessionId: state.sessionId,
        consent: { confirmed: true },
      }),
    });
    expect(resSubmit.status).toBe(200);
    const receipt = await resSubmit.json();
    expect(receipt.submissionId).toMatch(/^sub_/);
    expect(receipt.checksum).toBeDefined();
    expect(receipt.receivedAt).toBeDefined();

    // 6. Audit event logged
    expect(auditEvents.some((e) => e.event === "form.submitted")).toBe(true);

    // 7. Verify receipt retrieval
    const resReceipt = await server.request(`/receipts/${receipt.submissionId}`);
    expect(resReceipt.status).toBe(200);
    const fetchedReceipt = await resReceipt.json();
    expect(fetchedReceipt.submissionId).toBe(receipt.submissionId);

    // 8. Idempotency replay (same payload returns 200 with identical receipt)
    const resReplay = await server.request("/agent/forms/business-permit/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": validUuid1,
      },
      body: JSON.stringify({
        sessionId: state.sessionId,
        consent: { confirmed: true },
      }),
    });
    expect(resReplay.status).toBe(200);
    const replayReceipt = await resReplay.json();
    expect(replayReceipt.submissionId).toBe(receipt.submissionId);

    // 9. Idempotency payload conflict (different body returns 409)
    const resConflict = await server.request("/agent/forms/business-permit/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": validUuid1,
      },
      body: JSON.stringify({
        sessionId: "sess_different_session_id_456",
        consent: { confirmed: true },
      }),
    });
    expect(resConflict.status).toBe(409);
    const conflictJson = await resConflict.json();
    expect(conflictJson.error.code).toBe("idempotency_key_conflict");
  });

  it("enforces authentication and required scopes", async () => {
    const auth = staticApiKeyAuthProvider({
      "token-read-only": {
        subject: "read-agent",
        scopes: ["form:read"],
      },
      "token-full": {
        subject: "full-agent",
        scopes: ["form:read", "form:write", "form:upload", "form:submit", "form:read_receipt"],
      },
    });

    const server = createFormAccurateServer({
      forms: [TEST_FORM],
      auth,
    });

    // 1. Missing Auth header -> 401
    const resNoAuth = await server.request("/agent/forms/business-permit/schema");
    expect(resNoAuth.status).toBe(401);

    // 2. Invalid token -> 401
    const resBadToken = await server.request("/agent/forms/business-permit/schema", {
      headers: { Authorization: "Bearer bad-token" },
    });
    expect(resBadToken.status).toBe(401);

    // 3. Read token reading schema -> 200
    const resReadOk = await server.request("/agent/forms/business-permit/schema", {
      headers: { Authorization: "Bearer token-read-only" },
    });
    expect(resReadOk.status).toBe(200);

    // 4. Read token trying to patch values -> 403 (needs form:write)
    const resForbidden = await server.request("/agent/forms/business-permit/values", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer token-read-only",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: "sess_test", values: {} }),
    });
    expect(resForbidden.status).toBe(403);
    const forbiddenJson = await resForbidden.json();
    expect(forbiddenJson.error.code).toBe("invalid_scope");

    // 5. Full token succeeds
    const resFullOk = await server.request("/agent/forms/business-permit/schema", {
      headers: { Authorization: "Bearer token-full" },
    });
    expect(resFullOk.status).toBe(200);
  });

  it("applies rate limiting when tokens are exhausted", async () => {
    const rateLimiter = new TokenBucketRateLimiter({
      maxTokens: 2,
      refillRatePerSec: 0,
    });

    const server = createFormAccurateServer({
      forms: [TEST_FORM],
      rateLimiter,
    });

    const res1 = await server.request("/agent/forms/business-permit/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "sess_1" }),
    });
    expect(res1.status).toBe(404); // 404 session not found, but rate limit allowed it

    const res2 = await server.request("/agent/forms/business-permit/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "sess_1" }),
    });
    expect(res2.status).toBe(404);

    // 3rd request should be blocked by rate limiter
    const res3 = await server.request("/agent/forms/business-permit/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "sess_1" }),
    });
    expect(res3.status).toBe(429);
    expect(res3.headers.get("Retry-After")).toBeDefined();
    const rateLimitedJson = await res3.json();
    expect(rateLimitedJson.error.code).toBe("rate_limited");
  });
});
