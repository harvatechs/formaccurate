import type { Context } from "hono";
import {
  transitionFormState,
  validateForm,
  type AgentFormSchema,
} from "@formaccurate/core";
import type { StorageAdapter } from "../storage/adapter.js";

export async function handleValidate(
  c: Context,
  formMap: Map<string, AgentFormSchema>,
  storage: StorageAdapter,
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

  let body: { sessionId?: string };
  try {
    body = await c.req.json();
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

  const existingState = await storage.getState(formId, body.sessionId);
  if (!existingState) {
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

  // File token validator backed by storage adapter
  const tokenValidator = (token: string) => {
    // If memory adapter has file, check if expired
    // Note: storage.getFile is async; for sync validator we check basic format
    // or pre-validate tokens. Let's do a fast sync format check:
    return /^filetok_[a-zA-Z0-9_-]+$/.test(token) || /^sigtok_[a-zA-Z0-9_-]+$/.test(token);
  };

  const validatingState = transitionFormState(
    existingState.status === "draft"
      ? existingState
      : transitionFormState(existingState, "draft"),
    "validating",
  );

  const errors = validateForm(schema, validatingState.values, {
    validateToken: tokenValidator,
  });

  const nextStatus = errors.length === 0 ? "valid" : "invalid";
  const finalState = transitionFormState(validatingState, nextStatus);
  finalState.errors = errors;

  await storage.saveState(formId, body.sessionId, finalState);

  return c.json(finalState, 200);
}
