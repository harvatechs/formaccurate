import type { AgentFormSchema } from "@formaccurate/core";

export interface DiscoveredFormEntry {
  id: string;
  title: string;
  description?: string | undefined;
  schemaUrl: string;
  stateUrl: string;
  submitUrl: string;
}

export interface DiscoveryDocument {
  version: "1.0";
  site: string;
  forms: DiscoveredFormEntry[];
}

/**
 * Builds the /.well-known/formaccurate.json discovery manifest from registered schemas.
 *
 * @param forms - Registered AgentFormSchema array.
 * @param siteOrigin - Base origin or site URL prefix (e.g. "https://example.gov" or empty string).
 * @param apiPrefix - API route prefix (defaults to "/agent/forms").
 * @returns Complete DiscoveryDocument object.
 */
export function buildDiscoveryDocument(
  forms: AgentFormSchema[],
  siteOrigin: string = "",
  apiPrefix: string = "/agent/forms",
): DiscoveryDocument {
  const normalizedOrigin = siteOrigin.replace(/\/$/, "");
  const normalizedPrefix = apiPrefix.replace(/\/$/, "");

  const entries: DiscoveredFormEntry[] = forms.map((form) => ({
    id: form.formId,
    title: form.title,
    description: form.description,
    schemaUrl: `${normalizedOrigin}${normalizedPrefix}/${form.formId}/schema`,
    stateUrl: `${normalizedOrigin}${normalizedPrefix}/${form.formId}/state`,
    submitUrl: `${normalizedOrigin}${normalizedPrefix}/${form.formId}/submit`,
  }));

  return {
    version: "1.0",
    site: normalizedOrigin || "/",
    forms: entries,
  };
}
