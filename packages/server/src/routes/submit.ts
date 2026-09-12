import type { Context } from "hono";
import {
  isValidIdempotencyKey,
  sha256Hex,
  transitionFormState,
  validateForm,
  type AgentFormSchema,
  type FieldError,
} from "@formaccurate/core";
import type { StorageAdapter } from "../storage/adapter.js";

export interface AuditEvent {
  event: string;
  formId: string;
  submissionId?: string | undefined;
  sessionId?: string | undefined;
  tokenSubject?: string | undefined;
  scopes?: string[] | undefined;
  consent?: { confirmed: boolean } | undefined;
  errors?: FieldError[] | undefined;
  timestamp: string;
}

export async function handleSubmit(
  c: Context,
  formMap: Map<string, AgentFormSchema>,
  storage: StorageAdapter,
  logSink?: (event: AuditEvent) => void,
): Promise<Response> {
  const formId = c.req.param("formId");
  if (!formId) {
    return c.json(
      { error: { code: "form_not_found", message: "Form ID is required" } },
      404,
    );
  }
  const schema = formMap.get(formId);

  if (!schema) {
    return c.json(
      { error: { code: "form_not_found", message: `Form '${formId}' was not found` } },
      404,
    );
  }

  // 1. Validate Idempotency-Key header
  const idempotencyKey = c.req.header("idempotency-key");
  if (!idempotencyKey) {
    return c.json(
      {
        error: {
          code: "idempotency_key_missing",
          message: "Idempotency-Key header is required for submission",
        },
      },
      400,
    );
  }

  if (!isValidIdempotencyKey(idempotencyKey)) {
    return c.json(
      {
        error: {
          code: "idempotency_key_invalid",
          message: "Idempotency-Key must be a valid UUID",
        },
      },
      400,
    );
  }

  const rawBodyText = await c.req.text();
  const bodyHash = sha256Hex(rawBodyText);

  // 2. Check existing idempotency
  const existingRecord = await storage.checkIdempotency(idempotencyKey);
  if (existingRecord) {
    if (existingRecord.requestBodyHash === bodyHash) {
      return c.json(existingRecord.receipt, 200);
    }
    return c.json(
      {
        error: {
          code: "idempotency_key_conflict",
          message:
            "Idempotency-Key was already used with a different request payload",
        },
      },
      409,
    );
  }

  let body: { sessionId?: string; consent?: { confirmed?: boolean } };
  try {
    body = JSON.parse(rawBodyText);
  } catch {
    return c.json(
      { error: { code: "invalid_request", message: "Malformed JSON body" } },
      400,
    );
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return c.json(
      { error: { code: "invalid_request", message: "Missing sessionId in request body" } },
      400,
    );
  }

  // 3. Load form session state
  const state = await storage.getState(formId, body.sessionId);
  if (!state) {
    return c.json(
      {
        error: {
          code: "session_not_found",
          message: `Session '${body.sessionId}' not found for form '${formId}'`,
        },
      },
      404,
    );
  }

  // 4. Verify consent if required
  if (schema.consent?.required) {
    const isConsentConfirmed =
      body.consent?.confirmed === true ||
      state.values[schema.consent.confirmationFieldId] === true;

    if (!isConsentConfirmed) {
      return c.json(
        {
          error: {
            code: "consent_required",
            message:
              "Form requires explicit consent confirmation before submission",
          },
        },
        409,
      );
    }
  }

  // 5. Server-side validation (never trust client)
  const errors = validateForm(schema, state.values, { isSubmit: true });
  if (errors.length > 0) {
    logSink?.({
      event: "form.validation_failed",
      formId,
      sessionId: body.sessionId,
      errors,
      timestamp: new Date().toISOString(),
    });

    return c.json(
      {
        error: {
          code: "validation_failed",
          message: "Form validation failed",
          errors,
        },
      },
      422,
    );
  }

  // 6. Create submission and verifiable receipt
  const receipt = await storage.createSubmission(
    formId,
    body.sessionId,
    state.values,
  );

  // 7. Update state and record idempotency
  let currentState = state;
  if (currentState.status === "draft" || currentState.status === "invalid") {
    currentState = transitionFormState(currentState, "validating");
    currentState = transitionFormState(currentState, "valid");
  } else if (currentState.status === "validating") {
    currentState = transitionFormState(currentState, "valid");
  }
  if (currentState.status === "valid") {
    currentState = transitionFormState(currentState, "submitting");
  }
  const submittedState = transitionFormState(currentState, "submitted");
  await storage.saveState(formId, body.sessionId, submittedState);
  await storage.recordIdempotency(idempotencyKey, receipt, bodyHash);

  // 8. Audit event
  const authContext = c.get("auth") as { subject?: string; scopes?: string[] } | undefined;
  logSink?.({
    event: "form.submitted",
    formId,
    submissionId: receipt.submissionId,
    sessionId: body.sessionId,
    tokenSubject: authContext?.subject ?? "anonymous",
    scopes: authContext?.scopes ?? [],
    consent: body.consent ? { confirmed: Boolean(body.consent.confirmed) } : undefined,
    timestamp: receipt.receivedAt,
  });

  return c.json(receipt, 200);
}
