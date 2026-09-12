import { z } from "zod";
import type { FormAccurateHttpClient } from "../client.js";

export const getSchemaSchema = {
  formId: z.string().describe("The unique identifier of the form."),
};

export const GET_SCHEMA_DESCRIPTION =
  "Retrieves the complete AgentFormSchema definition, field types, and validation rules for a form.";

export async function handleGetSchema(
  client: FormAccurateHttpClient,
  args: { formId: string },
): Promise<unknown> {
  return client.request(`/agent/forms/${encodeURIComponent(args.formId)}/schema`, {
    method: "GET",
  });
}
