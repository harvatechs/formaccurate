import type { AgentFormSchema, FieldSchema, FieldType } from "@formaccurate/core";
import { readFieldValue, writeFieldValue } from "./dom-adapter.js";

export interface FormBinding {
  formId: string;
  formElement: HTMLElement;
  schema?: AgentFormSchema | undefined;
  fieldElements: Map<string, HTMLElement[]>;
  actionElements: Map<string, HTMLElement[]>;
  stepElements: Map<string, HTMLElement>;
}

export class FormRegistry {
  private bindings = new Map<string, FormBinding>();
  private schemas = new Map<string, AgentFormSchema>();
  private observer: MutationObserver | null = null;
  private changeListeners = new Set<(formId: string) => void>();

  public onChange(listener: (formId: string) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private notifyChange(formId: string): void {
    for (const listener of this.changeListeners) {
      listener(formId);
    }
  }

  public registerSchema(schema: AgentFormSchema): void {
    this.schemas.set(schema.formId, schema);
    const existingBinding = this.bindings.get(schema.formId);
    if (existingBinding) {
      existingBinding.schema = schema;
    }
  }

  public getSchema(formId: string): AgentFormSchema | undefined {
    return this.schemas.get(formId) ?? this.bindings.get(formId)?.schema;
  }

  public getBinding(formId: string): FormBinding | undefined {
    return this.bindings.get(formId);
  }

  public listForms(): Array<{ formId: string; title?: string | undefined }> {
    const list: Array<{ formId: string; title?: string | undefined }> = [];
    for (const [formId, binding] of this.bindings.entries()) {
      list.push({
        formId,
        title: binding.schema?.title ?? binding.formElement.getAttribute("aria-label") ?? undefined,
      });
    }
    return list;
  }

  public scan(root: ParentNode = document): void {
    const formEls = root.querySelectorAll<HTMLElement>("[data-fa-form]");
    formEls.forEach((formEl) => {
      this.bindForm(formEl);
    });
  }

  public bindForm(formEl: HTMLElement): FormBinding {
    const formId = formEl.getAttribute("data-fa-form");
    if (!formId) {
      throw new Error("Element is missing data-fa-form attribute");
    }

    const fieldElements = new Map<string, HTMLElement[]>();
    const actionElements = new Map<string, HTMLElement[]>();
    const stepElements = new Map<string, HTMLElement>();

    // Scan fields
    const fieldEls = formEl.querySelectorAll<HTMLElement>("[data-fa-field]");
    fieldEls.forEach((el) => {
      const fieldId = el.getAttribute("data-fa-field");
      if (!fieldId) return;

      const group = fieldElements.get(fieldId) ?? [];
      group.push(el);
      fieldElements.set(fieldId, group);

      // Listen for user input
      el.addEventListener("input", () => this.notifyChange(formId));
      el.addEventListener("change", () => this.notifyChange(formId));
    });

    // Scan actions
    const actionEls = formEl.querySelectorAll<HTMLElement>("[data-fa-action]");
    actionEls.forEach((el) => {
      const actionType = el.getAttribute("data-fa-action");
      if (!actionType) return;
      const group = actionElements.get(actionType) ?? [];
      group.push(el);
      actionElements.set(actionType, group);
    });

    // Scan steps
    const stepEls = formEl.querySelectorAll<HTMLElement>("[data-fa-step]");
    stepEls.forEach((el) => {
      const stepId = el.getAttribute("data-fa-step");
      if (stepId) {
        stepElements.set(stepId, el);
      }
    });

    let schema = this.schemas.get(formId);
    if (!schema) {
      schema = this.inferSchemaFromDom(formId, formEl, fieldElements);
    }

    const binding: FormBinding = {
      formId,
      formElement: formEl,
      schema,
      fieldElements,
      actionElements,
      stepElements,
    };

    this.bindings.set(formId, binding);
    return binding;
  }

  public readValues(formId: string): Record<string, unknown> {
    const binding = this.bindings.get(formId);
    if (!binding) return {};

    const values: Record<string, unknown> = {};
    for (const [fieldId, elements] of binding.fieldElements.entries()) {
      const val = readFieldValue(elements);
      if (val !== undefined) {
        values[fieldId] = val;
      }
    }
    return values;
  }

  public writeValues(formId: string, values: Record<string, unknown>): void {
    const binding = this.bindings.get(formId);
    if (!binding) return;

    for (const [fieldId, val] of Object.entries(values)) {
      const elements = binding.fieldElements.get(fieldId);
      if (elements) {
        writeFieldValue(elements, val);
      }
    }
  }

  private inferSchemaFromDom(
    formId: string,
    formEl: HTMLElement,
    fieldElements: Map<string, HTMLElement[]>,
  ): AgentFormSchema {
    const fields: FieldSchema[] = [];

    for (const [fieldId, elements] of fieldElements.entries()) {
      const first = elements[0];
      if (!first) continue;

      const label =
        first.getAttribute("aria-label") ??
        formEl.querySelector(`label[for="${first.id}"]`)?.textContent?.trim() ??
        fieldId;

      const required = first.hasAttribute("required");
      const autocomplete = first.getAttribute("autocomplete") ?? undefined;

      let type: FieldType = "string";
      if (first instanceof HTMLInputElement) {
        if (first.type === "checkbox") type = "boolean";
        else if (first.type === "radio") type = "radio";
        else if (first.type === "number") type = "number";
        else if (first.type === "email") type = "email";
        else if (first.type === "url") type = "url";
        else if (first.type === "tel") type = "tel";
        else if (first.type === "date") type = "date";
        else if (first.type === "file") type = "file";
      } else if (first instanceof HTMLTextAreaElement) {
        type = "textarea";
      } else if (first instanceof HTMLSelectElement) {
        type = first.multiple ? "multiselect" : "select";
      }

      if (type === "select" || type === "radio" || type === "multiselect") {
        const options: Array<{ value: string; label: string }> = [];
        if (first instanceof HTMLSelectElement) {
          Array.from(first.options).forEach((opt) => {
            options.push({ value: opt.value, label: opt.text });
          });
        } else if (first instanceof HTMLInputElement && first.type === "radio") {
          elements.forEach((el) => {
            if (el instanceof HTMLInputElement) {
              const optLabel =
                formEl.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() ?? el.value;
              options.push({ value: el.value, label: optLabel });
            }
          });
        }
        fields.push({
          id: fieldId,
          type,
          label,
          required: required ? true : undefined,
          autocomplete,
          options,
        });
      } else if (type === "file") {
        fields.push({
          id: fieldId,
          type: "file",
          label,
          required: required ? true : undefined,
          accept: ["application/octet-stream"],
          maxFiles: 1,
          maxSizeMb: 10,
        });
      } else if (type === "number") {
        fields.push({
          id: fieldId,
          type: "number",
          label,
          required: required ? true : undefined,
        });
      } else if (type === "boolean") {
        fields.push({
          id: fieldId,
          type: "boolean",
          label,
          required: required ? true : undefined,
        });
      } else {
        fields.push({
          id: fieldId,
          type,
          label,
          required: required ? true : undefined,
          autocomplete,
        });
      }
    }

    return {
      $schema: "https://formaccurate.dev/schema/v1.json",
      formId,
      version: "1.0.0",
      title: formEl.getAttribute("aria-label") ?? formId,
      fields,
      actions: [{ id: "submit", label: "Submit", type: "submit" }],
    };
  }

  public startObserver(): void {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
      return;
    }
    if (this.observer) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      let needsRescan = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          needsRescan = true;
          break;
        }
      }
      if (needsRescan) {
        this.scan();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  public stopObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
