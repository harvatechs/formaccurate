import { describe, expect, it } from "vitest";
import type { FormStatus } from "../schema/types.js";
import {
  InvalidStateTransitionError,
  applyValues,
  canTransition,
  createFormState,
  transitionFormState,
  updateFormStep,
} from "./state-machine.js";

describe("state-machine", () => {
  describe("createFormState", () => {
    it("initializes draft state with defaults", () => {
      const state = createFormState({ formId: "permit-form" });
      expect(state.formId).toBe("permit-form");
      expect(state.sessionId).toMatch(/^sess_[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(state.status).toBe("draft");
      expect(state.values).toEqual({});
      expect(state.errors).toEqual([]);
      expect(state.step).toBeUndefined();
      expect(typeof state.updatedAt).toBe("string");
    });

    it("initializes with provided values and initialStep", () => {
      const state = createFormState({
        formId: "multi-form",
        sessionId: "sess_custom123",
        initialValues: { name: "Alice" },
        initialStep: "step_one",
      });
      expect(state.sessionId).toBe("sess_custom123");
      expect(state.values).toEqual({ name: "Alice" });
      expect(state.step).toEqual({ current: "step_one", completed: [] });
    });
  });

  describe("canTransition & transitionFormState (All legal and illegal transitions)", () => {
    const allStatuses: FormStatus[] = [
      "draft",
      "validating",
      "valid",
      "invalid",
      "submitting",
      "submitted",
      "failed",
    ];

    const legalMap: Record<FormStatus, FormStatus[]> = {
      draft: ["validating"],
      validating: ["valid", "invalid"],
      valid: ["validating", "submitting", "draft"],
      invalid: ["validating", "draft"],
      submitting: ["submitted", "failed"],
      failed: ["submitting", "validating", "draft"],
      submitted: [],
    };

    allStatuses.forEach((fromStatus) => {
      const expectedLegal = legalMap[fromStatus];

      allStatuses.forEach((toStatus) => {
        const isLegal = expectedLegal.includes(toStatus);

        it(`handles transition from '${fromStatus}' to '${toStatus}' (legal = ${isLegal})`, () => {
          expect(canTransition(fromStatus, toStatus)).toBe(isLegal);

          const state = {
            formId: "test",
            sessionId: "sess_1",
            values: {},
            errors: [],
            status: fromStatus,
            updatedAt: "2026-01-01T00:00:00Z",
          };

          if (isLegal) {
            const next = transitionFormState(state, toStatus);
            expect(next.status).toBe(toStatus);
            expect(next.updatedAt).not.toBe("2026-01-01T00:00:00Z");
          } else {
            expect(() => transitionFormState(state, toStatus)).toThrow(
              InvalidStateTransitionError,
            );
          }
        });
      });
    });
  });

  describe("applyValues", () => {
    it("merges partial values and preserves draft status", () => {
      const state = createFormState({
        formId: "test",
        initialValues: { a: 1, b: 2 },
      });
      const updated = applyValues(state, { b: 3, c: 4 });
      expect(updated.values).toEqual({ a: 1, b: 3, c: 4 });
      expect(updated.status).toBe("draft");
    });

    it("resets invalid, valid, or failed status back to draft when values change", () => {
      const validState = {
        formId: "test",
        sessionId: "sess_1",
        values: { a: 1 },
        errors: [],
        status: "valid" as const,
        updatedAt: "2026-01-01T00:00:00Z",
      };

      const updated = applyValues(validState, { a: 2 });
      expect(updated.status).toBe("draft");
      expect(updated.values).toEqual({ a: 2 });

      const invalidState = { ...validState, status: "invalid" as const };
      expect(applyValues(invalidState, { a: 3 }).status).toBe("draft");

      const failedState = { ...validState, status: "failed" as const };
      expect(applyValues(failedState, { a: 4 }).status).toBe("draft");
    });

    it("throws InvalidStateTransitionError when attempting to modify values in submitting or submitted status", () => {
      const submittingState = {
        formId: "test",
        sessionId: "sess_1",
        values: { a: 1 },
        errors: [],
        status: "submitting" as const,
        updatedAt: "2026-01-01T00:00:00Z",
      };

      expect(() => applyValues(submittingState, { a: 2 })).toThrow(
        InvalidStateTransitionError,
      );

      const submittedState = { ...submittingState, status: "submitted" as const };
      expect(() => applyValues(submittedState, { a: 2 })).toThrow(
        InvalidStateTransitionError,
      );
    });
  });

  describe("updateFormStep", () => {
    it("records completed steps as user navigates forward", () => {
      const initial = createFormState({
        formId: "steps",
        initialStep: "step_1",
      });

      const step2 = updateFormStep(initial, "step_2");
      expect(step2.step?.current).toBe("step_2");
      expect(step2.step?.completed).toEqual(["step_1"]);

      const step3 = updateFormStep(step2, "step_3");
      expect(step3.step?.current).toBe("step_3");
      expect(step3.step?.completed).toEqual(["step_1", "step_2"]);
    });

    it("no-ops if form does not have steps defined", () => {
      const state = createFormState({ formId: "single" });
      const updated = updateFormStep(state, "step_2");
      expect(updated.step).toBeUndefined();
    });
  });
});
