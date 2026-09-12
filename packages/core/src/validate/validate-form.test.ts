import { describe, expect, it } from "vitest";
import type { AgentFormSchema } from "../schema/types.js";
import { validateForm } from "./validate-form.js";

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

describe("validateForm", () => {
  describe("Business Permit Application (Full Flow)", () => {
    it("validates a completely valid submission with LLC registration", () => {
      const values = {
        legal_name: "Acme LLC",
        email: "contact@acme.com",
        business_type: "llc",
        llc_registration_number: "LLC-12345",
        employee_count: 5,
        supporting_documents: ["filetok_01JABCDEF12345678901234567"],
        declaration_true: true,
      };

      const errors = validateForm(businessPermitSchema, values, { isSubmit: true });
      expect(errors).toEqual([]);
    });

    it("excludes hidden fields from required check (sole_proprietor does not need llc_registration_number)", () => {
      const values = {
        legal_name: "Acme Solo",
        email: "solo@acme.com",
        business_type: "sole_proprietor",
        // llc_registration_number omitted!
        employee_count: 0,
        declaration_true: true,
      };

      const errors = validateForm(businessPermitSchema, values, { isSubmit: true });
      expect(errors).toEqual([]);
    });

    it("requires llc_registration_number when business_type is llc", () => {
      const values = {
        legal_name: "Acme LLC",
        email: "contact@acme.com",
        business_type: "llc",
        // missing llc_registration_number
        declaration_true: true,
      };

      const errors = validateForm(businessPermitSchema, values, { isSubmit: true });
      expect(errors).toContainEqual({
        fieldId: "llc_registration_number",
        code: "required",
        message: "LLC Registration Number is required",
      });
    });

    it("enforces consent requirement on submit when declaration is false or missing", () => {
      const values = {
        legal_name: "Acme Solo",
        email: "solo@acme.com",
        business_type: "sole_proprietor",
        declaration_true: false,
      };

      const errors = validateForm(businessPermitSchema, values, { isSubmit: true });
      expect(errors).toContainEqual({
        fieldId: "declaration_true",
        code: "required",
        message: "I declare the information is true must be confirmed",
      });
      expect(errors).toContainEqual({
        code: "consent_required",
        message: "Consent confirmation is required before submission.",
      });
    });
  });

  describe("Field Type & Constraint Validations", () => {
    it("validates string and textarea minLength, maxLength, pattern", () => {
      const schema: AgentFormSchema = {
        ...businessPermitSchema,
        fields: [
          {
            id: "code",
            type: "string",
            label: "Code",
            required: true,
            minLength: 3,
            maxLength: 6,
            pattern: "[A-Z0-9]+",
          },
          {
            id: "notes",
            type: "textarea",
            label: "Notes",
            maxLength: 10,
          },
        ],
      };

      // Valid
      expect(validateForm(schema, { code: "ABC1", notes: "Short note" })).toEqual([]);

      // minLength failure
      const minErr = validateForm(schema, { code: "AB" });
      expect(minErr).toContainEqual({
        fieldId: "code",
        code: "minLength",
        message: "Code must be at least 3 characters",
      });

      // maxLength failure
      const maxErr = validateForm(schema, { code: "ABC12345" });
      expect(maxErr).toContainEqual({
        fieldId: "code",
        code: "maxLength",
        message: "Code must not exceed 6 characters",
      });

      // pattern failure
      const patternErr = validateForm(schema, { code: "abc!" });
      expect(patternErr).toContainEqual({
        fieldId: "code",
        code: "pattern",
        message: "Code format is invalid",
      });
    });

    it("validates email, url, and tel types", () => {
      const schema: AgentFormSchema = {
        ...businessPermitSchema,
        fields: [
          { id: "contact_email", type: "email", label: "Email", required: true },
          { id: "website", type: "url", label: "Website", required: true },
          { id: "phone", type: "tel", label: "Phone", required: true },
        ],
      };

      // Valid
      expect(
        validateForm(schema, {
          contact_email: "test@domain.org",
          website: "https://example.com/info",
          phone: "+1 (555) 123-4567",
        }),
      ).toEqual([]);

      // Invalid
      const errors = validateForm(schema, {
        contact_email: "not-an-email",
        website: "not-a-url",
        phone: "123",
      });

      expect(errors).toContainEqual({
        fieldId: "contact_email",
        code: "type",
        message: "Email must be a valid email address",
      });
      expect(errors).toContainEqual({
        fieldId: "website",
        code: "type",
        message: "Website must be a valid HTTP or HTTPS URL",
      });
      expect(errors).toContainEqual({
        fieldId: "phone",
        code: "type",
        message: "Phone must be a valid phone number",
      });
    });

    it("validates integer and number with minimum and maximum", () => {
      const schema: AgentFormSchema = {
        ...businessPermitSchema,
        fields: [
          {
            id: "qty",
            type: "integer",
            label: "Quantity",
            required: true,
            minimum: 1,
            maximum: 100,
          },
          {
            id: "price",
            type: "number",
            label: "Price",
            required: true,
            minimum: 0.01,
          },
        ],
      };

      // Valid
      expect(validateForm(schema, { qty: 5, price: 9.99 })).toEqual([]);

      // Integer float failure
      expect(validateForm(schema, { qty: 5.5, price: 9.99 })).toContainEqual({
        fieldId: "qty",
        code: "type",
        message: "Quantity must be an integer",
      });

      // Minimum and maximum violations
      const boundErr = validateForm(schema, { qty: 0, price: -1 });
      expect(boundErr).toContainEqual({
        fieldId: "qty",
        code: "minimum",
        message: "Quantity must be at least 1",
      });
      expect(boundErr).toContainEqual({
        fieldId: "price",
        code: "minimum",
        message: "Price must be at least 0.01",
      });
    });

    it("validates date, datetime, and time with min/max bounds", () => {
      const schema: AgentFormSchema = {
        ...businessPermitSchema,
        fields: [
          {
            id: "start_date",
            type: "date",
            label: "Start Date",
            minDate: "2026-01-01",
            maxDate: "2026-12-31",
          },
          {
            id: "meeting_time",
            type: "time",
            label: "Meeting Time",
            minDate: "09:00",
            maxDate: "17:00",
          },
          {
            id: "event_datetime",
            type: "datetime",
            label: "Event Datetime",
          },
        ],
      };

      // Valid
      expect(
        validateForm(schema, {
          start_date: "2026-06-15",
          meeting_time: "14:30",
          event_datetime: "2026-06-15T14:30:00Z",
        }),
      ).toEqual([]);

      // Invalid date format and out of bounds
      const dateErrors = validateForm(schema, {
        start_date: "2025-12-31",
        meeting_time: "18:00",
        event_datetime: "invalid-iso",
      });

      expect(dateErrors).toContainEqual({
        fieldId: "start_date",
        code: "minDate",
        message: "Start Date must not be before 2026-01-01",
      });
      expect(dateErrors).toContainEqual({
        fieldId: "meeting_time",
        code: "maxDate",
        message: "Meeting Time must not be after 17:00",
      });
      expect(dateErrors).toContainEqual({
        fieldId: "event_datetime",
        code: "type",
        message: "Event Datetime must be a valid ISO datetime",
      });
    });

    it("validates select, radio, and multiselect choices and limits", () => {
      const schema: AgentFormSchema = {
        ...businessPermitSchema,
        fields: [
          {
            id: "color",
            type: "radio",
            label: "Color",
            required: true,
            options: [
              { value: "red", label: "Red" },
              { value: "blue", label: "Blue" },
            ],
          },
          {
            id: "tags",
            type: "multiselect",
            label: "Tags",
            options: [
              { value: "tech", label: "Technology" },
              { value: "finance", label: "Finance" },
              { value: "retail", label: "Retail" },
            ],
            minSelections: 1,
            maxSelections: 2,
          },
        ],
      };

      // Valid
      expect(validateForm(schema, { color: "blue", tags: ["tech", "retail"] })).toEqual([]);

      // Invalid option selection
      const errs = validateForm(schema, { color: "green", tags: ["tech", "finance", "retail"] });
      expect(errs).toContainEqual({
        fieldId: "color",
        code: "type",
        message: "Color must be one of the available options",
      });
      expect(errs).toContainEqual({
        fieldId: "tags",
        code: "maxSelections",
        message: "Tags allows at most 2 selections",
      });
    });

    it("validates file and signature upload tokens (rejects raw data URIs or invalid tokens)", () => {
      const schema: AgentFormSchema = {
        ...businessPermitSchema,
        fields: [
          {
            id: "avatar",
            type: "file",
            label: "Avatar",
            required: true,
            accept: ["image/png"],
            maxFiles: 1,
            maxSizeMb: 2,
          },
          {
            id: "sig",
            type: "signature",
            label: "Signature",
            required: true,
            format: "drawn",
          },
        ],
      };

      // Valid tokens
      expect(
        validateForm(schema, {
          avatar: "filetok_01JABCDEF12345678901234567",
          sig: "sigtok_01JABCDEF12345678901234567",
        }),
      ).toEqual([]);

      // Raw data URI or arbitrary text rejected
      const invalid = validateForm(schema, {
        avatar: "data:image/png;base64,iVBORw0KGgo...",
        sig: "my typed name without token",
      });

      expect(invalid).toContainEqual({
        fieldId: "avatar",
        code: "custom",
        message: "invalid or expired file token",
      });
      expect(invalid).toContainEqual({
        fieldId: "sig",
        code: "custom",
        message: "invalid or expired file token",
      });
    });

    it("validates address fields and country restrictions", () => {
      const schema: AgentFormSchema = {
        ...businessPermitSchema,
        fields: [
          {
            id: "mailing_address",
            type: "address",
            label: "Mailing Address",
            required: true,
            countryRestriction: ["US", "CA"],
          },
        ],
      };

      // Valid
      expect(
        validateForm(schema, {
          mailing_address: {
            line1: "123 Main St",
            city: "Metropolis",
            postalCode: "12345",
            country: "US",
          },
        }),
      ).toEqual([]);

      // Missing required line1
      expect(
        validateForm(schema, {
          mailing_address: {
            city: "Metropolis",
            postalCode: "12345",
            country: "US",
          },
        }),
      ).toContainEqual({
        fieldId: "mailing_address",
        code: "required",
        message: "Mailing Address line1, city, postalCode, and country are required",
      });

      // Country outside allowed list
      expect(
        validateForm(schema, {
          mailing_address: {
            line1: "10 Downing St",
            city: "London",
            postalCode: "SW1A 2AA",
            country: "GB",
          },
        }),
      ).toContainEqual({
        fieldId: "mailing_address",
        code: "countryRestriction",
        message: "Mailing Address country must be one of: US, CA",
      });
    });

    it("validates group fields and repeating sub-fields", () => {
      const schema: AgentFormSchema = {
        ...businessPermitSchema,
        fields: [
          {
            id: "owners",
            type: "group",
            label: "Business Owners",
            required: true,
            minItems: 1,
            maxItems: 2,
            fields: [
              {
                id: "name",
                type: "string",
                label: "Owner Name",
                required: true,
              },
              {
                id: "ownership_pct",
                type: "integer",
                label: "Ownership %",
                required: true,
                minimum: 1,
                maximum: 100,
              },
            ],
          },
        ],
      };

      // Valid
      expect(
        validateForm(schema, {
          owners: [
            { name: "Alice", ownership_pct: 60 },
            { name: "Bob", ownership_pct: 40 },
          ],
        }),
      ).toEqual([]);

      // Too many items + sub-field validation failure
      const errors = validateForm(schema, {
        owners: [
          { name: "Alice", ownership_pct: 150 },
          { name: "", ownership_pct: 40 },
          { name: "Charlie", ownership_pct: 10 },
        ],
      });

      expect(errors).toContainEqual({
        fieldId: "owners",
        code: "maxItems",
        message: "Business Owners allows at most 2 items",
      });
      expect(errors).toContainEqual({
        fieldId: "owners[0].ownership_pct",
        code: "maximum",
        message: "Ownership % must not exceed 100",
      });
      expect(errors).toContainEqual({
        fieldId: "owners[1].name",
        code: "required",
        message: "Owner Name is required",
      });
    });
  });
});
