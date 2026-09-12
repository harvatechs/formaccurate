import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AgentFormSchema } from "@formaccurate/core";
import {
  createCli,
  lintCommand,
  lintSchema,
  scaffoldCommand,
  scaffoldSchema,
  validateCommand,
  validateValues,
} from "./index.js";

const VALID_SCHEMA: AgentFormSchema = {
  $schema: "https://formaccurate.dev/schema/v1.json",
  version: "1.0.0",
  formId: "valid-test-form",
  title: "Valid Test Form",
  actions: [{ id: "submit", label: "Submit", type: "submit" }],
  fields: [
    {
      id: "full_name",
      type: "string",
      label: "Full Name",
      required: true,
      minLength: 2,
    },
    {
      id: "email",
      type: "email",
      label: "Email",
      required: true,
    },
  ],
};

const INVALID_SCHEMA = {
  version: "1.0.0",
  // Missing $schema
  formId: "INVALID FORM ID WITH SPACES",
  fields: [
    {
      id: "invalid field id!",
      type: "not-a-type",
      minLength: -5,
    },
  ],
};

describe("@formaccurate/cli unit functions", () => {
  it("lintSchema accurately validates schemas and returns paths for failures", () => {
    const validResult = lintSchema(VALID_SCHEMA);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    const invalidResult = lintSchema(INVALID_SCHEMA);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
    expect(invalidResult.errors.some((e) => e.path.includes("formId"))).toBe(true);
  });

  it("validateValues accurately validates form submissions", () => {
    const validValues = {
      full_name: "Jane Doe",
      email: "jane@example.com",
    };
    const validResult = validateValues(VALID_SCHEMA, validValues);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    const invalidValues = {
      full_name: "J", // too short
      email: "not-an-email",
    };
    const invalidResult = validateValues(VALID_SCHEMA, invalidValues);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it("scaffoldSchema generates valid, compliant starter schemas", () => {
    const scaffolded = scaffoldSchema("permit-application", {
      title: "Commercial Permit Application",
    });

    expect(scaffolded.formId).toBe("permit-application");
    expect(scaffolded.title).toBe("Commercial Permit Application");
    expect(scaffolded.$schema).toBe("https://formaccurate.dev/schema/v1.json");

    // The scaffolded schema must pass linting directly
    const lintResult = lintSchema(scaffolded);
    expect(lintResult.valid).toBe(true);
  });

  it("createCli registers all commands with descriptions", () => {
    const cli = createCli();
    const commandNames = cli.commands.map((c) => c.name());
    expect(commandNames).toContain("lint");
    expect(commandNames).toContain("validate");
    expect(commandNames).toContain("scaffold");
  });
});

describe("@formaccurate/cli commands with filesystem and exit codes", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fa-cli-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("lintCommand returns 0 for valid file and 1 for invalid or missing file", async () => {
    const validPath = path.join(tmpDir, "valid-schema.json");
    await fs.writeFile(validPath, JSON.stringify(VALID_SCHEMA, null, 2), "utf-8");

    const codeValid = await lintCommand(validPath);
    expect(codeValid).toBe(0);

    const invalidPath = path.join(tmpDir, "invalid-schema.json");
    await fs.writeFile(invalidPath, JSON.stringify(INVALID_SCHEMA, null, 2), "utf-8");

    const codeInvalid = await lintCommand(invalidPath);
    expect(codeInvalid).toBe(1);

    const codeMissing = await lintCommand(path.join(tmpDir, "missing.json"));
    expect(codeMissing).toBe(1);
  });

  it("validateCommand returns 0 for valid values and 1 for invalid values", async () => {
    const schemaPath = path.join(tmpDir, "schema.json");
    await fs.writeFile(schemaPath, JSON.stringify(VALID_SCHEMA, null, 2), "utf-8");

    const validValuesPath = path.join(tmpDir, "values-valid.json");
    await fs.writeFile(
      validValuesPath,
      JSON.stringify({ full_name: "Jane Doe", email: "jane@example.com" }),
      "utf-8",
    );

    const codeValid = await validateCommand(schemaPath, { values: validValuesPath });
    expect(codeValid).toBe(0);

    const invalidValuesPath = path.join(tmpDir, "values-invalid.json");
    await fs.writeFile(
      invalidValuesPath,
      JSON.stringify({ full_name: "J", email: "invalid" }),
      "utf-8",
    );

    const codeInvalid = await validateCommand(schemaPath, { values: invalidValuesPath });
    expect(codeInvalid).toBe(1);
  });

  it("scaffoldCommand generates starter schema file on disk and exits 0", async () => {
    const outputPath = path.join(tmpDir, "my-starter-schema.json");
    const code = await scaffoldCommand("new-service-request", {
      title: "New Service Request",
      output: outputPath,
    });

    expect(code).toBe(0);

    const createdContent = await fs.readFile(outputPath, "utf-8");
    const parsed = JSON.parse(createdContent);
    expect(parsed.formId).toBe("new-service-request");
    expect(parsed.title).toBe("New Service Request");

    const lintResult = lintSchema(parsed);
    expect(lintResult.valid).toBe(true);
  });
});
