import { z } from "zod";
import type { FormAccurateHttpClient } from "../client.js";

export const setValuesSchema = {
  formId: z.string().describe("The unique identifier of the form."),
  sessionId: z.string().describe("The active session ID."),
  values: z
    .record(z.unknown())
    .describe("Key-value mapping of field IDs to their values."),
};

export const SET_VALUES_DESCRIPTION =
  "Merges new field values into an active form session state without triggering submission.";

export async function handleSetValues(
  client: FormAccurateHttpClient,
  args: { formId: string; sessionId: string; values: Record<string, unknown> },
): Promise<unknown> {
  return client.request(`/agent/forms/${encodeURIComponent(args.formId)}/values`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: args.sessionId,
      values: args.values,
    }),
  });
}
