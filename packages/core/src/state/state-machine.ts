import { generateSessionId } from "../ids/ids.js";
import type { FormState, FormStatus, FormStepState } from "../schema/types.js";

/**
 * Error thrown when an invalid form state transition is attempted.
 */
export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly from: FormStatus,
    public readonly to: FormStatus,
  ) {
    super(`Illegal form state transition from '${from}' to '${to}'`);
    this.name = "InvalidStateTransitionError";
  }
}

/**
 * Allowed status transitions for a form session.
 */
const LEGAL_TRANSITIONS: Record<FormStatus, readonly FormStatus[]> = {
  draft: ["validating"],
  validating: ["valid", "invalid"],
  valid: ["validating", "submitting", "draft"],
  invalid: ["validating", "draft"],
  submitting: ["submitted", "failed"],
  failed: ["submitting", "validating", "draft"],
  submitted: [], // Terminal state
};

/**
 * Options for initializing a new FormState.
 */
export interface CreateFormStateOptions {
  formId: string;
  sessionId?: string;
  initialValues?: Record<string, unknown>;
  initialStep?: string;
  updatedAt?: string;
}

/**
 * Creates a fresh FormState object in the "draft" status.
 *
 * @param options - Form initialization options.
 * @returns Initialized FormState.
 */
export function createFormState(options: CreateFormStateOptions): FormState {
  const sessionId = options.sessionId ?? generateSessionId();
  const values = options.initialValues ? { ...options.initialValues } : {};
  const updatedAt = options.updatedAt ?? new Date().toISOString();

  let step: FormStepState | undefined;
  if (options.initialStep) {
    step = {
      current: options.initialStep,
      completed: [],
    };
  }

  return {
    formId: options.formId,
    sessionId,
    values,
    errors: [],
    status: "draft",
    step,
    updatedAt,
  };
}

/**
 * Checks whether transitioning from `from` status to `to` status is legal.
 *
 * @param from - Current status.
 * @param to - Target status.
 * @returns true if transition is allowed, false otherwise.
 */
export function canTransition(from: FormStatus, to: FormStatus): boolean {
  const allowed = LEGAL_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Advances the form state to a new lifecycle status if permitted by the state machine.
 *
 * @param state - Current form state.
 * @param newStatus - Target lifecycle status.
 * @returns New immutable FormState with updated status and timestamp.
 * @throws InvalidStateTransitionError if the transition is illegal.
 */
export function transitionFormState(state: FormState, newStatus: FormStatus): FormState {
  if (!canTransition(state.status, newStatus)) {
    throw new InvalidStateTransitionError(state.status, newStatus);
  }

  return {
    ...state,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Merges partial or new values into the form state.
 *
 * Value modification is permitted in "draft", "valid", "invalid", and "failed" states.
 * When values are modified from "valid", "invalid", or "failed", status automatically
 * resets to "draft" because previous validation or submission states are invalidated by new inputs.
 * Mutating values while "submitting" or after "submitted" throws InvalidStateTransitionError.
 *
 * @param state - Current form state.
 * @param newValues - Field values to merge.
 * @returns New immutable FormState with merged values.
 */
export function applyValues(state: FormState, newValues: Record<string, unknown>): FormState {
  if (state.status === "submitting" || state.status === "submitted") {
    throw new InvalidStateTransitionError(state.status, "draft");
  }

  const mergedValues = {
    ...state.values,
    ...newValues,
  };

  const nextStatus: FormStatus =
    state.status === "valid" || state.status === "invalid" || state.status === "failed"
      ? "draft"
      : state.status;

  return {
    ...state,
    values: mergedValues,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Navigates to a specific step in a multi-step form session.
 *
 * @param state - Current form state.
 * @param targetStepId - Step ID to navigate to.
 * @returns Updated FormState with updated step navigation.
 */
export function updateFormStep(state: FormState, targetStepId: string): FormState {
  if (!state.step) {
    return state;
  }

  const completed = new Set(state.step.completed);
  if (state.step.current !== targetStepId) {
    completed.add(state.step.current);
  }

  return {
    ...state,
    step: {
      current: targetStepId,
      completed: Array.from(completed),
    },
    updatedAt: new Date().toISOString(),
  };
}
