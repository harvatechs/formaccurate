import type { AgentFormSchema } from "@formaccurate/core";

export const businessPermitSchema: AgentFormSchema = {
  $schema: "https://formaccurate.dev/schema/v1.json",
  version: "1.0",
  formId: "business-permit-application",
  title: "Commercial Operating Permit Application",
  description: "Official municipal application for retail and commercial operating permits.",
  actions: [
    { id: "submit", label: "Submit Application", type: "submit" },
  ],
  fields: [
    {
      id: "businessName",
      type: "string",
      label: "Legal Business Name",
      description: "Acme Enterprises LLC",
      required: true,
      minLength: 3,
      maxLength: 100,
    },
    {
      id: "entityType",
      type: "select",
      label: "Entity Structure",
      required: true,
      options: [
        { value: "llc", label: "Limited Liability Company (LLC)" },
        { value: "corp", label: "Corporation (C-Corp or S-Corp)" },
        { value: "soleProp", label: "Sole Proprietorship" },
        { value: "nonProfit", label: "501(c)(3) Non-Profit" },
      ],
    },
    {
      id: "taxId",
      type: "string",
      label: "Federal Employer ID (EIN)",
      description: "12-3456789",
      required: true,
      pattern: "^\\d{2}-\\d{7}$",
    },
    {
      id: "primaryContactEmail",
      type: "email",
      label: "Primary Contact Email",
      description: "authorized@company.com",
      required: true,
    },
    {
      id: "estimatedEmployees",
      type: "integer",
      label: "Estimated Full-Time Employees",
      required: true,
      minimum: 1,
      maximum: 10000,
    },
    {
      id: "hasPhysicalStorefront",
      type: "boolean",
      label: "Physical retail location or customer-facing office",
      required: false,
    },
    {
      id: "squareFootage",
      type: "number",
      label: "Operating Facility Square Footage",
      required: true,
      minimum: 100,
      visibleWhen: {
        field: "hasPhysicalStorefront",
        equals: true,
      },
    },
    {
      id: "confirmTruthful",
      type: "boolean",
      label: "I declare under penalty of perjury that the statements made are true and correct.",
      required: true,
    },
  ],
  consent: {
    required: true,
    statement: "By submitting this application, you certify that all information submitted is accurate and authorized for municipal processing.",
    confirmationFieldId: "confirmTruthful",
  },
};
