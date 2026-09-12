import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { AgentFormSchema } from "@formaccurate/core";
import { resetFormAccurate } from "@formaccurate/web";
import { FormAccurateProvider, useFormAccurate } from "./index.js";

const TEST_SCHEMA: AgentFormSchema = {
  $schema: "https://formaccurate.dev/schema/v1.json",
  version: "1.0",
  formId: "react-test-form",
  title: "React Test Form",
  actions: [{ id: "submit", label: "Submit", type: "submit" }],
  fields: [
    {
      id: "fullName",
      type: "string",
      label: "Full Name",
      required: true,
      minLength: 2,
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      required: true,
    },
    {
      id: "agreeTerms",
      type: "boolean",
      label: "Agree to Terms",
      required: true,
    },
  ],
  consent: {
    required: true,
    statement: "I agree to the test terms.",
    confirmationFieldId: "agreeTerms",
  },
};

function TestFormComponent() {
  const { formId, values, errors, isValid, setValues, validate, submit } =
    useFormAccurate();

  return (
    <form data-fa-form={formId}>
      <div data-testid="form-id">{formId}</div>
      <div data-testid="values-name">{(values.fullName as string) ?? ""}</div>
      <div data-testid="is-valid">{isValid ? "yes" : "no"}</div>
      <div data-testid="error-count">{errors.length}</div>

      <input
        data-fa-field="fullName"
        data-testid="input-name"
        defaultValue=""
      />

      <input
        data-fa-field="email"
        data-testid="input-email"
        defaultValue=""
      />

      <input
        type="checkbox"
        data-fa-field="agreeTerms"
        data-testid="input-agree"
      />

      <button
        type="button"
        data-testid="btn-set-values"
        onClick={() => setValues({ fullName: "Alice Smith", email: "alice@example.com" })}
      >
        Set Values
      </button>

      <button
        type="button"
        data-testid="btn-validate"
        onClick={() => validate()}
      >
        Validate
      </button>

      <button
        type="button"
        data-testid="btn-submit"
        onClick={() => submit({ consent: { confirmed: true } })}
      >
        Submit
      </button>
    </form>
  );
}

describe("@formaccurate/react", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    resetFormAccurate();
  });

  it("throws error if useFormAccurate is called outside Provider without formId", () => {
    function InvalidConsumer() {
      useFormAccurate();
      return null;
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      "useFormAccurate must be used within a <FormAccurateProvider>",
    );
  });

  it("renders form within FormAccurateProvider and registers schema", () => {
    render(
      <FormAccurateProvider formId="react-test-form" schema={TEST_SCHEMA}>
        <TestFormComponent />
      </FormAccurateProvider>,
    );

    expect(screen.getByTestId("form-id").textContent).toBe("react-test-form");
    expect(window.FormAccurate).toBeDefined();
    expect(window.FormAccurate!.getSchema("react-test-form").title).toBe("React Test Form");
  });

  it("reacts to programmatic setValues from hook", async () => {
    render(
      <FormAccurateProvider formId="react-test-form" schema={TEST_SCHEMA}>
        <TestFormComponent />
      </FormAccurateProvider>,
    );

    expect(screen.getByTestId("values-name").textContent).toBe("");

    act(() => {
      fireEvent.click(screen.getByTestId("btn-set-values"));
    });

    expect(screen.getByTestId("values-name").textContent).toBe("Alice Smith");
  });

  it("reacts to external agent bridge calls and updates React state", async () => {
    render(
      <FormAccurateProvider formId="react-test-form" schema={TEST_SCHEMA}>
        <TestFormComponent />
      </FormAccurateProvider>,
    );

    expect(screen.getByTestId("values-name").textContent).toBe("");

    act(() => {
      window.FormAccurate!.setValues("react-test-form", {
        fullName: "Agent Dispatched",
      });
    });

    expect(screen.getByTestId("values-name").textContent).toBe("Agent Dispatched");
  });

  it("reacts to validation events and displays error count", async () => {
    render(
      <FormAccurateProvider formId="react-test-form" schema={TEST_SCHEMA}>
        <TestFormComponent />
      </FormAccurateProvider>,
    );

    expect(screen.getByTestId("is-valid").textContent).toBe("no");

    // Validate empty form
    act(() => {
      fireEvent.click(screen.getByTestId("btn-validate"));
    });

    expect(Number(screen.getByTestId("error-count").textContent)).toBeGreaterThan(0);
    expect(screen.getByTestId("is-valid").textContent).toBe("no");

    // Set valid values
    act(() => {
      window.FormAccurate!.setValues("react-test-form", {
        fullName: "Jane Doe",
        email: "jane@example.com",
        agreeTerms: true,
      });
      window.FormAccurate!.validate("react-test-form");
    });

    expect(screen.getByTestId("error-count").textContent).toBe("0");
    expect(screen.getByTestId("is-valid").textContent).toBe("yes");
  });

  it("submits form and receives verifiable receipt", async () => {
    render(
      <FormAccurateProvider formId="react-test-form" schema={TEST_SCHEMA}>
        <TestFormComponent />
      </FormAccurateProvider>,
    );

    // Fill valid values
    act(() => {
      window.FormAccurate!.setValues("react-test-form", {
        fullName: "Jane Doe",
        email: "jane@example.com",
        agreeTerms: true,
      });
    });

    let receiptPromise: Promise<unknown>;
    await act(async () => {
      receiptPromise = window.FormAccurate!.submit("react-test-form", {
        consent: { confirmed: true },
      });
    });

    const receipt = (await receiptPromise!) as { submissionId: string; checksum: string };
    expect(receipt.submissionId).toMatch(/^sub_/);
    expect(receipt.checksum).toMatch(/^sha256:/);
  });
});
