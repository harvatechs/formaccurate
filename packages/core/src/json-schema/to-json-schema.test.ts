import { describe, expect, it } from "vitest";
import type { AgentFormSchema } from "../schema/types.js";
import { toFormDefinitionJsonSchema, toJsonSchema } from "./to-json-schema.js";

const businessPermitSchema: AgentFormSchema = {
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
    {
      id: "business_details",
      title: "Business Details",
      fields: ["business_type", "llc_registration_number", "employee_count"],
    },
    {
      id: "documents",
      title: "Supporting Documents",
      fields: ["supporting_documents"],
    },
    {
      id: "declaration",
      title: "Declaration",
      fields: ["declaration_true"],
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
    {
      id: "business_type",
      type: "select",
      label: "Business Type",
      required: true,
      options: [
        { value: "sole_proprietor", label: "Sole Proprietor" },
        { value: "llc", label: "LLC" },
        { value: "corporation", label: "Corporation" },
      ],
    },
    {
      id: "llc_registration_number",
      type: "string",
      label: "LLC Registration Number",
      required: true,
      visibleWhen: { field: "business_type", equals: "llc" },
    },
    {
      id: "employee_count",
      type: "integer",
      label: "Number of Employees",
      required: false,
      minimum: 0,
    },
    {
      id: "supporting_documents",
      type: "file",
      label: "Supporting Documents",
      required: false,
      accept: ["application/pdf", "image/png", "image/jpeg"],
      maxFiles: 5,
      maxSizeMb: 10,
    },
    {
      id: "declaration_true",
      type: "boolean",
      label: "I declare the information is true",
      required: true,
    },
  ],
  actions: [{ id: "submit", label: "Submit Application", type: "submit" }],
};

describe("toJsonSchema", () => {
  it("converts Business Permit Application into valid JSON Schema", () => {
    const jsonSchema = toJsonSchema(businessPermitSchema);

    expect(jsonSchema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(jsonSchema.title).toBe("Business Permit Application");
    expect(jsonSchema.description).toBe("Apply for a municipal business permit.");
    expect(jsonSchema.type).toBe("object");

    const props = jsonSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.legal_name).toMatchObject({
      title: "Legal Business Name",
      type: "string",
      maxLength: 200,
    });
    expect(props.email).toMatchObject({
      title: "Contact Email",
      type: "string",
      format: "email",
    });
    expect(props.business_type).toMatchObject({
      title: "Business Type",
      type: "string",
      enum: ["sole_proprietor", "llc", "corporation"],
    });
    expect(props.employee_count).toMatchObject({
      title: "Number of Employees",
      type: "integer",
      minimum: 0,
    });
    expect(props.supporting_documents).toMatchObject({
      title: "Supporting Documents",
      type: "array",
      maxItems: 5,
    });
    expect(props.declaration_true).toMatchObject({
      title: "I declare the information is true",
      type: "boolean",
    });

    expect(jsonSchema.required).toEqual([
      "legal_name",
      "email",
      "business_type",
      "llc_registration_number",
      "declaration_true",
    ]);
  });

  it("exports AgentFormSchema specification itself as JSON Schema", () => {
    const defSchema = toFormDefinitionJsonSchema();
    expect(defSchema).toBeDefined();
    expect(typeof defSchema).toBe("object");
  });
});
