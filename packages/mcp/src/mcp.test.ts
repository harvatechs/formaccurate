import { describe, expect, it } from "vitest";
import type { AgentFormSchema } from "@formaccurate/core";
import {
  FormAccurateHttpClient,
  handleDiscoverForms,
  handleGetReceipt,
  handleGetSchema,
  handleGetState,
  handleSetValues,
  handleSubmit,
  handleValidate,
} from "./index.js";

const TEST_FORM: AgentFormSchema = {
  $schema: "https://formaccurate.dev/schema/v1.json",
  version: "1.0",
  formId: "mcp-permit-test",
  title: "MCP Permit Test Form",
  actions: [{ id: "submit", label: "Submit", type: "submit" }],
  fields: [
    {
      id: "businessName",
      type: "string",
      label: "Legal Business Name",
      required: true,
      minLength: 2,
    },
    {
      id: "ownerEmail",
      type: "email",
      label: "Owner Email",
      required: true,
    },
    {
      id: "agreeTerms",
      type: "boolean",
      label: "I agree to the terms",
      required: true,
    },
  ],
  consent: {
    required: true,
    statement: "I certify that all details are accurate.",
    confirmationFieldId: "agreeTerms",
  },
};

interface MockSession {
  formId: string;
  sessionId: string;
  status: string;
  values: Record<string, unknown>;
  errors: Array<{ fieldId: string; code: string; message: string }>;
}

interface MockReceipt {
  submissionId: string;
  formId: string;
  status: string;
  receivedAt: string;
  checksum: string;
  receiptUrl: string;
}

interface MockDiscovery {
  version: string;
  site: string;
  forms: Array<{ id: string; title: string }>;
}

// Lightweight in-memory test server matching FormAccurate protocol
function createMockServer() {
  const sessions = new Map<string, MockSession>();
  const submissions = new Map<string, MockReceipt>();
  let sessionSeq = 0;
  let subSeq = 0;

  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof url === "string" ? url : url.toString();
    const parsed = new URL(urlStr);
    const method = init?.method ?? "GET";
    const path = parsed.pathname;

    if (path === "/.well-known/formaccurate.json") {
      return new Response(
        JSON.stringify({
          version: "1.0",
          site: parsed.origin,
          forms: [
            {
              id: TEST_FORM.formId,
              title: TEST_FORM.title,
              schemaUrl: `${parsed.origin}/agent/forms/${TEST_FORM.formId}/schema`,
              stateUrl: `${parsed.origin}/agent/forms/${TEST_FORM.formId}/state`,
              submitUrl: `${parsed.origin}/agent/forms/${TEST_FORM.formId}/submit`,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (path === `/agent/forms/${TEST_FORM.formId}/schema`) {
      return new Response(JSON.stringify(TEST_FORM), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === `/agent/forms/${TEST_FORM.formId}/state`) {
      const sessionId = parsed.searchParams.get("sessionId");
      if (!sessionId) {
        sessionSeq++;
        const newId = `sess_mock_${sessionSeq}`;
        const newState = {
          formId: TEST_FORM.formId,
          sessionId: newId,
          status: "draft",
          values: {},
          errors: [],
        };
        sessions.set(newId, newState);
        return new Response(JSON.stringify(newState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const existing = sessions.get(sessionId);
      if (!existing) {
        return new Response(
          JSON.stringify({ error: { code: "session_not_found", message: "Session not found" } }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify(existing), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === `/agent/forms/${TEST_FORM.formId}/values` && method === "PATCH") {
      const body = JSON.parse((init?.body as string) || "{}");
      const session = sessions.get(body.sessionId);
      if (!session) {
        return new Response(
          JSON.stringify({ error: { code: "session_not_found", message: "Session not found" } }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      session.values = { ...session.values, ...body.values };
      return new Response(JSON.stringify(session), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === `/agent/forms/${TEST_FORM.formId}/validate` && method === "POST") {
      const body = JSON.parse((init?.body as string) || "{}");
      const session = sessions.get(body.sessionId);
      const errors = [];
      if (!session.values.businessName) {
        errors.push({ fieldId: "businessName", code: "required", message: "Business name required" });
      }
      if (!session.values.ownerEmail) {
        errors.push({ fieldId: "ownerEmail", code: "required", message: "Owner email required" });
      }
      session.status = errors.length === 0 ? "valid" : "invalid";
      session.errors = errors;
      return new Response(JSON.stringify(session), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === `/agent/forms/${TEST_FORM.formId}/submit` && method === "POST") {
      const body = JSON.parse((init?.body as string) || "{}");
      if (!body.consent?.confirmed) {
        return new Response(
          JSON.stringify({ error: { code: "consent_required", message: "Consent required" } }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }

      subSeq++;
      const subId = `sub_mock_${subSeq}`;
      const receipt = {
        submissionId: subId,
        formId: TEST_FORM.formId,
        status: "submitted",
        receivedAt: new Date().toISOString(),
        checksum: "sha256:abcd1234ef567890",
        receiptUrl: `/receipts/${subId}`,
      };
      submissions.set(subId, receipt);
      return new Response(JSON.stringify(receipt), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/receipts/")) {
      const subId = path.replace("/receipts/", "");
      const receipt = submissions.get(subId);
      if (!receipt) {
        return new Response(
          JSON.stringify({ error: { code: "receipt_not_found", message: "Receipt not found" } }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify(receipt), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: { code: "not_found", message: "Not found" } }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  };
}

describe("@formaccurate/mcp tools", () => {
  const mockFetch = createMockServer() as unknown as typeof fetch;
  const client = new FormAccurateHttpClient({
    baseUrl: "http://mock-server.test",
    token: "test-bearer-token",
    fetch: mockFetch,
  });

  it("discovers forms via formaccurate_discover_forms", async () => {
    const discovery = (await handleDiscoverForms(client, {})) as MockDiscovery;
    expect(discovery.version).toBe("1.0");
    expect(discovery.forms).toHaveLength(1);
    expect(discovery.forms[0]?.id).toBe("mcp-permit-test");
  });

  it("retrieves schema via formaccurate_get_schema", async () => {
    const schema = (await handleGetSchema(client, { formId: "mcp-permit-test" })) as AgentFormSchema;
    expect(schema.formId).toBe("mcp-permit-test");
    expect(schema.fields).toHaveLength(3);
  });

  it("handles full lifecycle: state -> values -> validate -> submit -> receipt", async () => {
    // 1. Get initial state
    const initState = (await handleGetState(client, { formId: "mcp-permit-test" })) as MockSession;
    expect(initState.sessionId).toMatch(/^sess_mock_/);
    expect(initState.status).toBe("draft");

    // 2. Patch values
    const patchedState = (await handleSetValues(client, {
      formId: "mcp-permit-test",
      sessionId: initState.sessionId,
      values: {
        businessName: "Acme MCP Corp",
        ownerEmail: "owner@acme.test",
        agreeTerms: true,
      },
    })) as MockSession;
    expect(patchedState.values.businessName).toBe("Acme MCP Corp");

    // 3. Validate
    const valState = (await handleValidate(client, {
      formId: "mcp-permit-test",
      sessionId: initState.sessionId,
    })) as MockSession;
    expect(valState.status).toBe("valid");
    expect(valState.errors).toHaveLength(0);

    // 4. Submit with consent
    const receipt = (await handleSubmit(client, {
      formId: "mcp-permit-test",
      sessionId: initState.sessionId,
      consent: { confirmed: true },
    })) as MockReceipt;
    expect(receipt.submissionId).toMatch(/^sub_mock_/);
    expect(receipt.checksum).toBeDefined();

    // 5. Retrieve receipt
    const fetchedReceipt = (await handleGetReceipt(client, {
      submissionId: receipt.submissionId,
    })) as MockReceipt;
    expect(fetchedReceipt.submissionId).toBe(receipt.submissionId);
    expect(fetchedReceipt.checksum).toBe(receipt.checksum);
  });

  it("propagates typed errors for unknown entities", async () => {
    await expect(
      handleGetSchema(client, { formId: "non-existent-form" }),
    ).rejects.toThrow("[not_found]");

    await expect(
      handleGetReceipt(client, { submissionId: "non-existent-receipt" }),
    ).rejects.toThrow("[receipt_not_found]");
  });
});
