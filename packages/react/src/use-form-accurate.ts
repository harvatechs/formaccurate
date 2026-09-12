import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  AgentFormSchema,
  FieldError,
  FormState,
  SubmissionReceipt,
} from "@formaccurate/core";
import {
  getFormAccurate,
  type FormAccurateBridge,
} from "@formaccurate/web";
import { FormAccurateContext } from "./context.js";

export interface UseFormAccurateResult {
  /** The active form identifier. */
  formId: string;
  /** Current reactive FormState snapshot. */
  state: FormState | null;
  /** Current registered AgentFormSchema or null if not registered yet. */
  schema: AgentFormSchema | null;
  /** Current field values mapped from form state. */
  values: Record<string, unknown>;
  /** Current validation errors. */
  errors: FieldError[];
  /** True when the form status is "valid". */
  isValid: boolean;
  /** True when the form is actively submitting. */
  isSubmitting: boolean;
  /** True when the form has been successfully submitted. */
  isSubmitted: boolean;
  /** Programmatically sets field values via the bridge and dispatches DOM updates. */
  setValues: (values: Record<string, unknown>) => FormState;
  /** Validates form values against schema constraints. */
  validate: () => FormState;
  /** Submits the form with optional consent confirmation. */
  submit: (options?: { consent?: { confirmed: boolean } }) => Promise<SubmissionReceipt>;
  /** Underlying FormAccurateBridge instance. */
  bridge: FormAccurateBridge;
}

/**
 * Primary React hook for inspecting and operating FormAccurate forms.
 *
 * Automatically re-renders host components when values, validation status,
 * or submission states change in the bridge (driven either by human interaction
 * or agent bridge calls).
 *
 * @param formIdOverride - Optional explicit formId. If omitted, uses formId from FormAccurateProvider context.
 * @returns Complete reactive form state and operational methods.
 */
export function useFormAccurate(formIdOverride?: string): UseFormAccurateResult {
  const context = useContext(FormAccurateContext);
  const formId = formIdOverride ?? context?.formId;

  if (!formId) {
    throw new Error(
      "useFormAccurate must be used within a <FormAccurateProvider> or provided with an explicit formId argument.",
    );
  }

  const bridge = context?.bridge ?? getFormAccurate();

  // Helper to safely read state
  const readState = useCallback((): FormState | null => {
    try {
      return bridge.getState(formId);
    } catch {
      return null;
    }
  }, [bridge, formId]);

  // Helper to safely read schema
  const readSchema = useCallback((): AgentFormSchema | null => {
    try {
      return bridge.getSchema(formId);
    } catch {
      return null;
    }
  }, [bridge, formId]);

  const [state, setState] = useState<FormState | null>(() => readState());
  const [schema, setSchema] = useState<AgentFormSchema | null>(() => readSchema());

  useEffect(() => {
    // Initial sync on mount
    setState(readState());
    setSchema(readSchema());

    const sync = () => {
      setState(readState());
      setSchema(readSchema());
    };

    const unsubChange = bridge.on("change", (p: unknown) => {
      const payload = p as { formId?: string };
      if (payload?.formId === formId) sync();
    });

    const unsubValidate = bridge.on("validate", (p: unknown) => {
      const payload = p as { formId?: string };
      if (payload?.formId === formId) sync();
    });

    const unsubSubmit = bridge.on("submit", (p: unknown) => {
      const payload = p as { formId?: string };
      if (payload?.formId === formId) sync();
    });

    const unsubError = bridge.on("error", (p: unknown) => {
      const payload = p as { formId?: string };
      if (payload?.formId === formId) sync();
    });

    return () => {
      unsubChange();
      unsubValidate();
      unsubSubmit();
      unsubError();
    };
  }, [bridge, formId, readState, readSchema]);

  const setValues = useCallback(
    (newValues: Record<string, unknown>): FormState => {
      const updated = bridge.setValues(formId, newValues);
      setState(updated);
      return updated;
    },
    [bridge, formId],
  );

  const validate = useCallback((): FormState => {
    const validated = bridge.validate(formId);
    setState(validated);
    return validated;
  }, [bridge, formId]);

  const submit = useCallback(
    async (options?: { consent?: { confirmed: boolean } }): Promise<SubmissionReceipt> => {
      const receipt = await bridge.submit(formId, options);
      setState(readState());
      return receipt;
    },
    [bridge, formId, readState],
  );

  const values = useMemo(() => state?.values ?? {}, [state?.values]);
  const errors = useMemo(() => state?.errors ?? [], [state?.errors]);
  const isValid = state?.status === "valid";
  const isSubmitting = state?.status === "submitting";
  const isSubmitted = state?.status === "submitted";

  return {
    formId,
    state,
    schema,
    values,
    errors,
    isValid,
    isSubmitting,
    isSubmitted,
    setValues,
    validate,
    submit,
    bridge,
  };
}
