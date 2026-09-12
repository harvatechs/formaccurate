import { describe, expect, it } from "vitest";
import { agentFormSchema, fieldSchema } from "./zod.js";

describe("zod schemas", () => {
  it("parses the Business Permit Application schema successfully", () => {
    const rawSchema = {
      $schema: "https://formaccurate.dev/schema/v1.json",
      formId: "business-permit-application",
      version: "1.0.0",
      title: "Business Permit Application",
      description: "Apply for a municipal business permit.",
      locale: "en-US",
      auth: { required: true, scopes: ["form:read", "form:write", "form:submit"] },
      consent: {
        required: true,
        statement: "I confirm the information provided is true and accurate.",
        confirmationFieldId: "declaration_true",
      },
      steps: [
        {
          id: "applicant_info",
          title: "Applicant Information",
          fields: ["legal_name", "email"],
        },
      ],
      fields: [
        {
          id: "legal_name",
          type: "string",
          label: "Legal Business Name",
          required: true,
          maxLength: 200,
          autocomplete: "organization",
        },
        {
          id: "email",
          type: "email",
          label: "Contact Email",
          required: true,
          autocomplete: "email",
        },
      ],
      actions: [{ id: "submit", label: "Submit Application", type: "submit" }],
    };

    const parsed = agentFormSchema.safeParse(rawSchema);
    expect(parsed.success).toBe(true);
  });

  it("fails parsing when formId is invalid or fields are empty", () => {
    const badFormId = {
      $schema: "https://formaccurate.dev/schema/v1.json",
      formId: "INVALID FORM ID WITH SPACES",
      version: "1.0.0",
      title: "Title",
      fields: [],
      actions: [{ id: "s", label: "S", type: "submit" }],
    };

    const parsed = agentFormSchema.safeParse(badFormId);
    expect(parsed.success).toBe(false);
  });

  it("parses every field type", () => {
    const fields = [
      { id: "f_str", type: "string", label: "Str" },
      { id: "f_num", type: "number", label: "Num" },
      { id: "f_int", type: "integer", label: "Int" },
      { id: "f_bool", type: "boolean", label: "Bool" },
      { id: "f_date", type: "date", label: "Date" },
      {
        id: "f_choice",
        type: "select",
        label: "Choice",
        options: [{ value: "a", label: "A" }],
      },
      {
        id: "f_file",
        type: "file",
        label: "File",
        accept: ["application/pdf"],
        maxFiles: 1,
        maxSizeMb: 5,
      },
      { id: "f_sig", type: "signature", label: "Sig", format: "drawn" },
      { id: "f_addr", type: "address", label: "Addr" },
    ];

    for (const f of fields) {
      const res = fieldSchema.safeParse(f);
      expect(res.success).toBe(true);
    }
  });
});
