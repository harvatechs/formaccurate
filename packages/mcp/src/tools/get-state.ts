import { z } from "zod";
import type { FormAccurateHttpClient } from "../client.js";

export const getStateSchema = {
  formId: z.string().describe("The unique identifier of the form."),
  sessionId: z
    .string()
    .optional()
    .describe("Existing session ID. Omit to initialize a fresh session draft."),
};

export const GET_STATE_DESCRIPTION =
  "Retrieves the current FormState for an active session, or initializes a new session draft if sessionId is omitted.";

export async function handleGetState(
  client: FormAccurateHttpClient,
  args: { formId: string; sessionId?: string | undefined },
): Promise<unknown> {
  const query = args.sessionId ? `?sessionId=${encodeURIComponent(args.sessionId)}` : "";
  return client.request(`/agent/forms/${encodeURIComponent(args.formId)}/state${query}`, {
    method: "GET",
  });
}
