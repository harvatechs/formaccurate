import crypto from "node:crypto";
import { z } from "zod";
import type { FormAccurateHttpClient } from "../client.js";

export const submitSchema = {
  formId: z.string().describe("The unique identifier of the form."),
  sessionId: z.string().describe("The active session ID to submit."),
  consent: z
    .object({
      confirmed: z.boolean().describe("Whether user consent has been explicitly granted."),
    })
    .optional()
    .describe("Explicit consent confirmation payload."),
  idempotencyKey: z
    .string()
    .optional()
    .describe("UUID idempotency key. If omitted, a random UUID is automatically generated."),
};

export const SUBMIT_DESCRIPTION =
  "Submits the form session with mandatory consent and returns a cryptographic submission receipt.";

export async function handleSubmit(
  client: FormAccurateHttpClient,
  args: {
    formId: string;
    sessionId: string;
    consent?: { confirmed: boolean } | undefined;
    idempotencyKey?: string | undefined;
  },
): Promise<unknown> {
  const idempotencyKey = args.idempotencyKey || crypto.randomUUID();

  return client.request(`/agent/forms/${encodeURIComponent(args.formId)}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      sessionId: args.sessionId,
      consent: args.consent,
    }),
  });
}
