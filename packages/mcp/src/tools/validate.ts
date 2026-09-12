import { z } from "zod";
import type { FormAccurateHttpClient } from "../client.js";

export const validateSchema = {
  formId: z.string().describe("The unique identifier of the form."),
  sessionId: z.string().describe("The active session ID to validate."),
};

export const VALIDATE_DESCRIPTION =
  "Executes server-side validation against current form session values and returns errors if invalid.";

export async function handleValidate(
  client: FormAccurateHttpClient,
  args: { formId: string; sessionId: string },
): Promise<unknown> {
  return client.request(`/agent/forms/${encodeURIComponent(args.formId)}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: args.sessionId,
    }),
  });
}
