import {
  applyValues,
  createFormState,
  createSubmissionReceipt,
  transitionFormState,
  validateForm,
  type AgentFormSchema,
  type FormState,
  type SubmissionReceipt,
} from "@formaccurate/core";
import { FormRegistry } from "./bind.js";
import { clearErrors, renderErrors } from "./dom-adapter.js";

export interface FormSummary {
  formId: string;
  title?: string | undefined;
}

export interface FormAccurateBridge {
  listForms(): FormSummary[];
  getSchema(formId: string): AgentFormSchema;
  getState(formId: string): FormState;
  setValues(formId: string, values: Record<string, unknown>): FormState;
  validate(formId: string): FormState;
  submit(
    formId: string,
    options?: { consent?: { confirmed: boolean } },
  ): Promise<SubmissionReceipt>;
  on(
    event: "change" | "validate" | "submit" | "error",
    handler: (payload: unknown) => void,
  ): () => void;
  debug(enabled: boolean): void;
  registerSchema(schema: AgentFormSchema): void;
}

export class FormAccurateBridgeImpl implements FormAccurateBridge {
  private registry: FormRegistry;
  private states = new Map<string, FormState>();
  private debugMode = false;
  private eventListeners = new Map<string, Set<(payload: unknown) => void>>([
    ["change", new Set()],
    ["validate", new Set()],
    ["submit", new Set()],
    ["error", new Set()],
  ]);

  constructor(registry: FormRegistry) {
    this.registry = registry;
    this.registry.onChange((formId) => {
      this.syncStateFromDom(formId);
      this.emit("change", { formId, values: this.getState(formId).values });
    });
  }

  public debug(enabled: boolean): void {
    this.debugMode = enabled;
    if (this.debugMode) {
      console.warn("[FormAccurate] Debug mode enabled");
    }
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      console.warn(`[FormAccurate] ${message}`, ...args);
    }
  }

  private emit(event: "change" | "validate" | "submit" | "error", payload: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(payload);
        } catch (err) {
          console.error(`[FormAccurate] Event handler failed for ${event}:`, err);
        }
      }
    }
  }

  public on(
    event: "change" | "validate" | "submit" | "error",
    handler: (payload: unknown) => void,
  ): () => void {
    const set = this.eventListeners.get(event);
    if (set) {
      set.add(handler);
      return () => set.delete(handler);
    }
    return () => {};
  }

  public registerSchema(schema: AgentFormSchema): void {
    this.registry.registerSchema(schema);
    this.log(`Schema registered for ${schema.formId}`);
  }

  public listForms(): FormSummary[] {
    return this.registry.listForms();
  }

  public getSchema(formId: string): AgentFormSchema {
    const schema = this.registry.getSchema(formId);
    if (!schema) {
      const err = new Error(`Form not found: '${formId}'`);
      this.emit("error", { formId, error: err });
      throw err;
    }
    return schema;
  }

  private getOrCreateState(formId: string): FormState {
    let state = this.states.get(formId);
    if (!state) {
      const domValues = this.registry.readValues(formId);
      state = createFormState({
        formId,
        initialValues: domValues,
      });
      this.states.set(formId, state);
    }
    return state;
  }

  private syncStateFromDom(formId: string): FormState {
    const state = this.getOrCreateState(formId);
    const domValues = this.registry.readValues(formId);
    const updated = applyValues(state, domValues);
    this.states.set(formId, updated);
    return updated;
  }

  public getState(formId: string): FormState {
    const schema = this.getSchema(formId);
    const state = this.getOrCreateState(schema.formId);
    return state;
  }

  public setValues(formId: string, values: Record<string, unknown>): FormState {
    this.log(`setValues called for ${formId}`, values);
    const schema = this.getSchema(formId);
    const currentState = this.getOrCreateState(schema.formId);

    // 1. Apply caller values to state
    let updatedState = applyValues(currentState, values);

    // 2. Write values to real DOM elements (triggers native input/change)
    this.registry.writeValues(schema.formId, values);

    // 3. Read back combined state from DOM
    const domValues = this.registry.readValues(schema.formId);
    if (Object.keys(domValues).length > 0) {
      updatedState = applyValues(updatedState, domValues);
    }
    this.states.set(schema.formId, updatedState);

    // Clear any previous error displays when values are modified
    const binding = this.registry.getBinding(schema.formId);
    if (binding) {
      clearErrors(binding.formElement);
    }

    this.emit("change", { formId: schema.formId, values: updatedState.values });
    return updatedState;
  }

  public validate(formId: string): FormState {
    this.log(`validate called for ${formId}`);
    const schema = this.getSchema(formId);
    const state = this.syncStateFromDom(schema.formId);

    const validatingState = transitionFormState(state, "validating");
    const errors = validateForm(schema, validatingState.values);

    const finalStatus = errors.length === 0 ? "valid" : "invalid";
    const evaluatedState = transitionFormState(validatingState, finalStatus);
    evaluatedState.errors = errors;

    this.states.set(schema.formId, evaluatedState);

    // Render error markers in DOM
    const binding = this.registry.getBinding(schema.formId);
    if (binding) {
      if (errors.length > 0) {
        renderErrors(binding.formElement, errors);
      } else {
        clearErrors(binding.formElement);
      }
    }

    this.emit("validate", { formId: schema.formId, status: finalStatus, errors });
    return evaluatedState;
  }

  public async submit(
    formId: string,
    options?: { consent?: { confirmed: boolean } },
  ): Promise<SubmissionReceipt> {
    this.log(`submit called for ${formId}`, options);
    const schema = this.getSchema(formId);
    const state = this.syncStateFromDom(schema.formId);

    // If consent requirement exists, ensure confirmed
    if (schema.consent?.required) {
      const confirmed =
        options?.consent?.confirmed === true ||
        state.values[schema.consent.confirmationFieldId] === true;

      if (!confirmed) {
        const consentError = {
          code: "consent_required",
          message: "Form submission requires explicit consent confirmation.",
        };
        state.errors = [consentError];
        this.emit("error", { formId, ...consentError });
        throw new Error(consentError.message);
      }
    }

    // Always re-validate before final submit
    const errors = validateForm(schema, state.values, { isSubmit: true });
    if (errors.length > 0) {
      const binding = this.registry.getBinding(schema.formId);
      if (binding) {
        renderErrors(binding.formElement, errors);
      }
      state.errors = errors;
      const invalidState = transitionFormState(
        transitionFormState(state, "validating"),
        "invalid",
      );
      invalidState.errors = errors;
      this.states.set(schema.formId, invalidState);
      throw new Error(`Validation failed with ${errors.length} error(s)`);
    }

    const submittingState = transitionFormState(
      state.status === "valid"
        ? state
        : transitionFormState(transitionFormState(state, "validating"), "valid"),
      "submitting",
    );
    this.states.set(schema.formId, submittingState);

    // Create verifiable receipt
    const receipt = createSubmissionReceipt({
      values: submittingState.values,
    });

    const submittedState = transitionFormState(submittingState, "submitted");
    this.states.set(schema.formId, submittedState);

    const binding = this.registry.getBinding(schema.formId);
    if (binding) {
      clearErrors(binding.formElement);
    }

    this.emit("submit", { formId: schema.formId, receipt });
    return receipt;
  }
}

declare global {
  interface Window {
    FormAccurate?: FormAccurateBridge;
  }
}

let globalRegistry: FormRegistry | null = null;
let globalBridge: FormAccurateBridge | null = null;

/**
 * Initializes FormAccurate on the current web page.
 *
 * Scans the DOM for forms annotated with `data-fa-form`, binds inputs and actions,
 * observes mutations for dynamic form additions, and mounts `window.FormAccurate`.
 * Idempotent: safe to call multiple times without duplicating observers.
 *
 * @returns The active FormAccurateBridge instance.
 */
export function initFormAccurate(): FormAccurateBridge {
  if (globalBridge && globalRegistry) {
    globalRegistry.scan();
    return globalBridge;
  }

  globalRegistry = new FormRegistry();
  globalBridge = new FormAccurateBridgeImpl(globalRegistry);

  if (typeof window !== "undefined") {
    window.FormAccurate = globalBridge;
  }

  if (typeof document !== "undefined") {
    globalRegistry.scan();
    globalRegistry.startObserver();
  }

  return globalBridge;
}

/**
 * Retrieves the currently active FormAccurateBridge instance, initializing it if needed.
 */
export function getFormAccurate(): FormAccurateBridge {
  if (!globalBridge) {
    return initFormAccurate();
  }
  return globalBridge;
}

/**
 * Resets the global FormAccurate bridge and registry, disconnecting observers.
 * Designed for test cleanup and SPA full teardown.
 */
export function resetFormAccurate(): void {
  if (globalRegistry) {
    globalRegistry.stopObserver();
    globalRegistry = null;
  }
  globalBridge = null;
  if (typeof window !== "undefined") {
    delete (window as unknown as { FormAccurate?: unknown }).FormAccurate;
  }
}
