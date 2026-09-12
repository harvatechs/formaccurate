import type { FieldError } from "@formaccurate/core";

/**
 * Sets the value on an HTML input, select, or textarea using prototype property descriptors.
 * This guarantees change tracking works in SPAs (React, Vue, Svelte) that override property setters.
 * Dispatches native `input` and `change` events.
 *
 * @param element - Target form control element.
 * @param value - Value to assign.
 */
export function setNativeValue(element: HTMLElement, value: unknown): void {
  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox") {
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "checked",
      );
      const isChecked = Boolean(value);
      if (descriptor?.set) {
        descriptor.set.call(element, isChecked);
      } else {
        element.checked = isChecked;
      }
    } else if (element.type === "radio") {
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "checked",
      );
      const isChecked = element.value === String(value);
      if (descriptor?.set) {
        descriptor.set.call(element, isChecked);
      } else {
        element.checked = isChecked;
      }
    } else {
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      );
      const stringValue =
        value !== undefined && value !== null ? String(value) : "";
      if (descriptor?.set) {
        descriptor.set.call(element, stringValue);
      } else {
        element.value = stringValue;
      }
    }
  } else if (element instanceof HTMLTextAreaElement) {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    );
    const stringValue =
      value !== undefined && value !== null ? String(value) : "";
    if (descriptor?.set) {
      descriptor.set.call(element, stringValue);
    } else {
      element.value = stringValue;
    }
  } else if (element instanceof HTMLSelectElement) {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    );
    const stringValue =
      value !== undefined && value !== null ? String(value) : "";
    if (descriptor?.set) {
      descriptor.set.call(element, stringValue);
    } else {
      element.value = stringValue;
    }
  }

  element.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: true }),
  );
  element.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: true }),
  );
}

/**
 * Reads the current typed value from a set of DOM elements representing a single field.
 *
 * @param elements - DOM elements tagged with data-fa-field for this field.
 * @returns The extracted value (string, boolean, array, number, etc.).
 */
export function readFieldValue(elements: HTMLElement[]): unknown {
  if (elements.length === 0) {
    return undefined;
  }

  const first = elements[0];

  // Radio button group
  if (first instanceof HTMLInputElement && first.type === "radio") {
    const checkedRadio = elements.find(
      (el) => el instanceof HTMLInputElement && el.checked,
    ) as HTMLInputElement | undefined;
    return checkedRadio ? checkedRadio.value : undefined;
  }

  // Checkbox group or single checkbox
  if (first instanceof HTMLInputElement && first.type === "checkbox") {
    if (elements.length > 1) {
      return elements
        .filter((el) => el instanceof HTMLInputElement && el.checked)
        .map((el) => (el as HTMLInputElement).value);
    }
    return first.checked;
  }

  // Select element
  if (first instanceof HTMLSelectElement) {
    if (first.multiple) {
      return Array.from(first.selectedOptions).map((opt) => opt.value);
    }
    return first.value;
  }

  // File upload input (returns simulated or stored data-fa-token)
  if (first instanceof HTMLInputElement && first.type === "file") {
    const token = first.getAttribute("data-fa-token");
    if (token) {
      try {
        const parsed = JSON.parse(token);
        return parsed;
      } catch {
        return token;
      }
    }
    return first.value ? [first.value] : [];
  }

  // Number input
  if (first instanceof HTMLInputElement && first.type === "number") {
    return first.value === "" ? undefined : first.valueAsNumber;
  }

  // Text / password / email / url / textarea
  if (
    first instanceof HTMLInputElement ||
    first instanceof HTMLTextAreaElement
  ) {
    return first.value;
  }

  // Custom data-fa-value attribute fallback
  return first?.getAttribute("data-fa-value") ?? undefined;
}

/**
 * Writes values from an agent or bridge into corresponding DOM elements.
 *
 * @param elements - DOM elements bound to this field.
 * @param value - Value to write into DOM.
 */
export function writeFieldValue(
  elements: HTMLElement[],
  value: unknown,
): void {
  if (elements.length === 0) {
    return;
  }

  const first = elements[0];

  // Radio button group
  if (first instanceof HTMLInputElement && first.type === "radio") {
    for (const el of elements) {
      if (el instanceof HTMLInputElement) {
        setNativeValue(el, value);
      }
    }
    return;
  }

  // Multiple checkboxes for array values
  if (
    first instanceof HTMLInputElement &&
    first.type === "checkbox" &&
    Array.isArray(value)
  ) {
    for (const el of elements) {
      if (el instanceof HTMLInputElement) {
        const shouldCheck = value.map(String).includes(el.value);
        setNativeValue(el, shouldCheck);
      }
    }
    return;
  }

  // Multiple select
  if (first instanceof HTMLSelectElement && first.multiple) {
    const selectedValues = Array.isArray(value) ? value.map(String) : [];
    for (let i = 0; i < first.options.length; i++) {
      const opt = first.options[i];
      if (opt) {
        opt.selected = selectedValues.includes(opt.value);
      }
    }
    first.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true }),
    );
    first.dispatchEvent(
      new Event("change", { bubbles: true, cancelable: true }),
    );
    return;
  }

  // File input token assignment
  if (first instanceof HTMLInputElement && first.type === "file") {
    const tokenStr =
      typeof value === "string" ? value : JSON.stringify(value ?? []);
    first.setAttribute("data-fa-token", tokenStr);
    return;
  }

  // Single elements (inputs, textareas, single select)
  if (first) {
    setNativeValue(first, value);
  }
}

/**
 * Renders validation error messages into the DOM next to their respective fields
 * or into an element with `data-fa-errors`.
 *
 * @param formEl - Target form container.
 * @param errors - Field errors to display.
 */
export function renderErrors(formEl: HTMLElement, errors: FieldError[]): void {
  clearErrors(formEl);

  const formErrorsContainer = formEl.querySelector("[data-fa-errors]");
  const formLevelErrors = errors.filter((e) => !e.fieldId);

  if (formErrorsContainer && formLevelErrors.length > 0) {
    const list = document.createElement("ul");
    list.className = "fa-form-errors";
    for (const err of formLevelErrors) {
      const li = document.createElement("li");
      li.textContent = err.message;
      list.appendChild(li);
    }
    formErrorsContainer.appendChild(list);
  }

  for (const err of errors) {
    if (!err.fieldId) continue;
    const fieldEl = formEl.querySelector(`[data-fa-field="${err.fieldId}"]`);
    if (fieldEl) {
      fieldEl.classList.add("fa-field-error");
      const errEl = document.createElement("div");
      errEl.className = "fa-error-message";
      errEl.setAttribute("data-fa-error-for", err.fieldId);
      errEl.textContent = err.message;
      fieldEl.parentElement?.appendChild(errEl);
    }
  }
}

/**
 * Clears previously rendered error classes and messages from the DOM.
 *
 * @param formEl - Target form container.
 */
export function clearErrors(formEl: HTMLElement): void {
  const existingErrors = formEl.querySelectorAll(".fa-error-message");
  existingErrors.forEach((el) => el.remove());

  const existingErrorLists = formEl.querySelectorAll(".fa-form-errors");
  existingErrorLists.forEach((el) => el.remove());

  const erroredFields = formEl.querySelectorAll(".fa-field-error");
  erroredFields.forEach((el) => el.classList.remove("fa-field-error"));
}
