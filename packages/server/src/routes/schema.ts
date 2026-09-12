import type { Context } from "hono";
import type { AgentFormSchema } from "@formaccurate/core";

export function handleGetSchema(
  c: Context,
  formMap: Map<string, AgentFormSchema>,
): Response {
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
      {
        error: {
          code: "form_not_found",
          message: `Form '${formId}' was not found`,
        },
      },
      404,
    );
  }

  return c.json(schema, 200);
}
