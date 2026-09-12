// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import {
  clearErrors,
  readFieldValue,
  renderErrors,
  setNativeValue,
  writeFieldValue,
} from "./dom-adapter.js";

describe("dom-adapter", () => {
  describe("setNativeValue", () => {
    it("sets input value and dispatches input and change events", () => {
      const input = document.createElement("input");
      const inputSpy = vi.fn();
      const changeSpy = vi.fn();
      input.addEventListener("input", inputSpy);
      input.addEventListener("change", changeSpy);

      setNativeValue(input, "hello world");

      expect(input.value).toBe("hello world");
      expect(inputSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy).toHaveBeenCalledTimes(1);
    });

    it("sets checkbox checked state and dispatches events", () => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const changeSpy = vi.fn();
      checkbox.addEventListener("change", changeSpy);

      setNativeValue(checkbox, true);
      expect(checkbox.checked).toBe(true);
      expect(changeSpy).toHaveBeenCalledTimes(1);

      setNativeValue(checkbox, false);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe("readFieldValue and writeFieldValue", () => {
    it("handles text and number inputs", () => {
      const textInput = document.createElement("input");
      textInput.type = "text";
      writeFieldValue([textInput], "Acme");
      expect(readFieldValue([textInput])).toBe("Acme");

      const numInput = document.createElement("input");
      numInput.type = "number";
      writeFieldValue([numInput], 42);
      expect(readFieldValue([numInput])).toBe(42);
    });

    it("handles single checkbox and checkbox groups", () => {
      const single = document.createElement("input");
      single.type = "checkbox";
      writeFieldValue([single], true);
      expect(readFieldValue([single])).toBe(true);

      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.value = "opt1";
      const cb2 = document.createElement("input");
      cb2.type = "checkbox";
      cb2.value = "opt2";

      writeFieldValue([cb1, cb2], ["opt2"]);
      expect(cb1.checked).toBe(false);
      expect(cb2.checked).toBe(true);
      expect(readFieldValue([cb1, cb2])).toEqual(["opt2"]);
    });

    it("handles radio button groups", () => {
      const r1 = document.createElement("input");
      r1.type = "radio";
      r1.name = "plan";
      r1.value = "starter";

      const r2 = document.createElement("input");
      r2.type = "radio";
      r2.name = "plan";
      r2.value = "pro";

      writeFieldValue([r1, r2], "pro");
      expect(r1.checked).toBe(false);
      expect(r2.checked).toBe(true);
      expect(readFieldValue([r1, r2])).toBe("pro");
    });

    it("handles select and select-multiple", () => {
      const select = document.createElement("select");
      const opt1 = document.createElement("option");
      opt1.value = "val1";
      const opt2 = document.createElement("option");
      opt2.value = "val2";
      select.appendChild(opt1);
      select.appendChild(opt2);

      writeFieldValue([select], "val2");
      expect(readFieldValue([select])).toBe("val2");

      select.multiple = true;
      writeFieldValue([select], ["val1", "val2"]);
      expect(readFieldValue([select])).toEqual(["val1", "val2"]);
    });

    it("handles file tokens in file inputs", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";

      writeFieldValue([fileInput], ["filetok_123"]);
      expect(fileInput.getAttribute("data-fa-token")).toBe(JSON.stringify(["filetok_123"]));
      expect(readFieldValue([fileInput])).toEqual(["filetok_123"]);
    });
  });

  describe("renderErrors and clearErrors", () => {
    it("renders field error messages and clears them", () => {
      const form = document.createElement("form");
      const fieldContainer = document.createElement("div");
      const input = document.createElement("input");
      input.setAttribute("data-fa-field", "email");
      fieldContainer.appendChild(input);
      form.appendChild(fieldContainer);

      renderErrors(form, [
        { fieldId: "email", code: "type", message: "Invalid email address" },
      ]);

      expect(input.classList.contains("fa-field-error")).toBe(true);
      const err = form.querySelector('[data-fa-error-for="email"]');
      expect(err).not.toBeNull();
      expect(err?.textContent).toBe("Invalid email address");

      clearErrors(form);
      expect(input.classList.contains("fa-field-error")).toBe(false);
      expect(form.querySelector('[data-fa-error-for="email"]')).toBeNull();
    });

    it("renders form-level errors into data-fa-errors container", () => {
      const form = document.createElement("form");
      const errorContainer = document.createElement("div");
      errorContainer.setAttribute("data-fa-errors", "");
      form.appendChild(errorContainer);

      renderErrors(form, [
        { code: "consent_required", message: "Consent is required" },
      ]);

      const list = form.querySelector(".fa-form-errors");
      expect(list).not.toBeNull();
      expect(list?.textContent).toContain("Consent is required");
    });
  });
});
