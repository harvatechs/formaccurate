import { z } from "zod";
import type { FormAccurateHttpClient } from "../client.js";

export const discoverFormsSchema = {
  origin: z
    .string()
    .optional()
    .describe("Optional site origin URL (e.g. 'https://example.gov'). Defaults to the configured server base URL."),
};

export const DISCOVER_FORMS_DESCRIPTION =
  "Discovers available FormAccurate forms at the specified origin or default server.";

export async function handleDiscoverForms(
  client: FormAccurateHttpClient,
  args: { origin?: string | undefined },
): Promise<unknown> {
  const origin = args.origin || client.getBaseUrl();
  return client.request("/.well-known/formaccurate.json", { method: "GET" }, origin);
}
