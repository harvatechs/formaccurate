/**
 * FormAccurate End-to-End Autonomous Agent Flow
 *
 * Demonstrates a complete HTTP client workflow against a FormAccurate server:
 * 1. Discover forms via /.well-known/formaccurate.json
 * 2. Fetch schema & constraints
 * 3. Initialize session state
 * 4. Upload attachments & receive file tokens
 * 5. Fill fields incrementally
 * 6. Validate state server-side
 * 7. Provide informed consent and submit with UUID idempotency key
 * 8. Verify cryptographic receipt and replay idempotency
 */

import crypto from "node:crypto";
import { app } from "./server.js";

const BASE_URL = process.env.SERVER_URL || "http://localhost:3000";
const AUTH_TOKEN = "demo-agent-key-12345";

// Helper for making requests either directly against the Hono app (in-memory) or via network fetch
async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${AUTH_TOKEN}`);
  }

  // If running against local in-process app
  if (!process.env.USE_NETWORK) {
    return app.request(path, {
      ...options,
      headers,
    });
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

async function run() {
  console.log("==================================================");
  console.log("   FormAccurate Autonomous Agent Flow Demo        ");
  console.log("==================================================\n");

  // Step 1: Discover forms
  console.log("[1] Discovering forms at /.well-known/formaccurate.json...");
  const discoveryRes = await apiRequest("/.well-known/formaccurate.json", {
    headers: {}, // Discovery is public
  });
  if (!discoveryRes.ok) {
    throw new Error(`Discovery failed with status ${discoveryRes.status}`);
  }
  const discovery = await discoveryRes.json();
  console.log(`    Found ${discovery.forms.length} registered form(s):`);
  for (const f of discovery.forms) {
    console.log(`    - [${f.id}] ${f.title}`);
  }

  const targetForm = discovery.forms[0];
  const formId = targetForm.id;

  // Step 2: Fetch schema
  console.log(`\n[2] Fetching schema for form '${formId}'...`);
  const schemaRes = await apiRequest(`/agent/forms/${formId}/schema`);
  const schema = await schemaRes.json();
  console.log(`    Schema title: ${schema.title}`);
  console.log(`    Total fields declared: ${schema.fields.length}`);
  console.log(`    Consent required: ${schema.consent?.required ? "YES" : "NO"}`);

  // Step 3: Initialize session state
  console.log(`\n[3] Initializing form session...`);
  const stateRes = await apiRequest(`/agent/forms/${formId}/state`);
  const state = await stateRes.json();
  const sessionId = state.sessionId;
  console.log(`    Created session ID: ${sessionId} (status: ${state.status})`);

  // Step 4: Upload file
  console.log(`\n[4] Uploading corporate documentation...`);
  const fileRes = await apiRequest(`/agent/forms/${formId}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fieldId: "articlesOfOrganization",
      filename: "acme-articles-of-org.pdf",
      sizeBytes: 154200,
      mimeType: "application/pdf",
    }),
  });
  const fileData = await fileRes.json();
  console.log(`    Uploaded: ${fileData.filename}`);
  console.log(`    Received file token: ${fileData.fileToken}`);

  // Step 5: Patch initial values
  console.log(`\n[5] Patching form fields incrementally...`);
  const patchRes = await apiRequest(`/agent/forms/${formId}/values`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      values: {
        businessName: "Acme Advanced Technologies LLC",
        entityType: "llc",
        taxId: "12-3456789",
        primaryContactEmail: "compliance@acme.example",
        estimatedEmployees: 25,
        hasPhysicalStorefront: true,
        squareFootage: 3500,
        articlesOfOrganization: [fileData.fileToken],
      },
    }),
  });
  const patchedState = await patchRes.json();
  console.log(`    Values applied to session (${Object.keys(patchedState.values).length} fields filled).`);

  // Step 6: Validate state
  console.log(`\n[6] Running server-side validation...`);
  const validateRes = await apiRequest(`/agent/forms/${formId}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  const validationState = await validateRes.json();
  console.log(`    Validation status: ${validationState.status}`);
  if (validationState.errors.length > 0) {
    console.log(`    Errors: ${JSON.stringify(validationState.errors)}`);
  }

  // Confirm truthfulness & consent checkbox
  console.log(`\n[7] Confirming legal attestations...`);
  await apiRequest(`/agent/forms/${formId}/values`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      values: { confirmTruthful: true },
    }),
  });
  console.log(`    Attestation confirmed.`);

  // Step 8: Submit with Idempotency Key
  const idempotencyKey = crypto.randomUUID();
  console.log(`\n[8] Submitting form with Idempotency-Key: ${idempotencyKey}...`);
  const submitRes = await apiRequest(`/agent/forms/${formId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      sessionId,
      consent: { confirmed: true },
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json();
    throw new Error(`Submission failed: ${JSON.stringify(err)}`);
  }

  const receipt = await submitRes.json();
  console.log(`    >>> SUBMISSION SUCCESSFUL! <<<`);
  console.log(`    Submission ID : ${receipt.submissionId}`);
  console.log(`    Status        : ${receipt.status}`);
  console.log(`    Received At   : ${receipt.receivedAt}`);
  console.log(`    SHA256 Hash   : ${receipt.checksum}`);
  console.log(`    Receipt URL   : ${receipt.receiptUrl}`);

  // Step 9: Verify Idempotency replay
  console.log(`\n[9] Verifying idempotency replay with duplicate submission...`);
  const replayRes = await apiRequest(`/agent/forms/${formId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      sessionId,
      consent: { confirmed: true },
    }),
  });
  const replayReceipt = await replayRes.json();
  if (replayReceipt.submissionId === receipt.submissionId && replayRes.status === 200) {
    console.log(`    Idempotency verified: identical receipt returned without duplicate insertion.`);
  } else {
    throw new Error("Idempotency replay failed!");
  }

  // Step 10: Fetch verifiable receipt
  console.log(`\n[10] Retrieving verifiable submission receipt from storage...`);
  const receiptRes = await apiRequest(`/receipts/${receipt.submissionId}`);
  const retrievedReceipt = await receiptRes.json();
  if (retrievedReceipt.checksum === receipt.checksum) {
    console.log(`    Receipt integrity verified: SHA-256 checksum matches storage record.`);
  } else {
    throw new Error("Receipt checksum verification mismatch!");
  }

  console.log("\n==================================================");
  console.log("   AGENT FLOW EXECUTION COMPLETE (10/10 SUCCESS)  ");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Agent flow failed:", err);
  process.exit(1);
});
