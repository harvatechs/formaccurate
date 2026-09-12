import type { Context } from "hono";
import {
  applyValues,
  createFormState,
  type AgentFormSchema,
} from "@formaccurate/core";
import type { StorageAdapter } from "../storage/adapter.js";

export async function handleGetState(
  c: Context,
  formMap: Map<string, AgentFormSchema>,
  storage: StorageAdapter,
): Promise<Response> {
  const formId = c.req.param("formId");
  if (!formId || !formMap.has(formId)) {
    return c.json(
      { error: { code: "form_not_found", message: `Form '${formId}' was not found` } },
      404,
    );
  }

  const sessionId = c.req.query("sessionId");

  if (!sessionId) {
    const newState = createFormState({ formId });
    await storage.saveState(formId, newState.sessionId, newState);
    return c.json(newState, 200);
  }

  const existingState = await storage.getState(formId, sessionId);
  if (!existingState) {
    return c.json(
      {
        error: {
          code: "session_not_found",
          message: `Session '${sessionId}' not found for form '${formId}'`,
        },
      },
      404,
    );
  }

  return c.json(existingState, 200);
}

export async function handlePatchValues(
  c: Context,
  formMap: Map<string, AgentFormSchema>,
  storage: StorageAdapter,
): Promise<Response> {
  const formId = c.req.param("formId");
  if (!formId || !formMap.has(formId)) {
    return c.json(
      { error: { code: "form_not_found", message: `Form '${formId}' was not found` } },
      404,
    );
  }

  let body: { sessionId?: string; values?: Record<string, unknown> };
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

  if (!body.values || typeof body.values !== "object") {
    return c.json(
      { error: { code: "invalid_request", message: "Missing values object in request body" } },
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

  const updatedState = applyValues(existingState, body.values);
  await storage.saveState(formId, body.sessionId, updatedState);

  return c.json(updatedState, 200);
}
