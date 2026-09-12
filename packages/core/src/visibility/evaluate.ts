import type { VisibilityRule } from "../schema/types.js";

/**
 * Performs structural deep equality comparison on primitives, arrays, and plain objects.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) {
    return false;
  }
  return keysA.every(
    (key) => Object.prototype.hasOwnProperty.call(objB, key) && deepEqual(objA[key], objB[key]),
  );
}

/**
 * Evaluates a declarative visibility rule against current form values.
 *
 * This function is pure and deterministic. It evaluates field conditions (`equals`,
 * `notEquals`, `in`, `notIn`) and recursive combinators (`allOf`, `anyOf`).
 * If no rule is provided, the field is visible by default.
 *
 * @param rule - The declarative VisibilityRule to evaluate, or undefined for unconditional visibility.
 * @param values - Current form values keyed by field ID.
 * @returns true if the field is visible/active, false otherwise.
 */
export function evaluateVisibility(
  rule: VisibilityRule | undefined,
  values: Record<string, unknown>,
): boolean {
  if (!rule) {
    return true;
  }

  if ("allOf" in rule) {
    return rule.allOf.every((subRule) => evaluateVisibility(subRule, values));
  }

  if ("anyOf" in rule) {
    return rule.anyOf.some((subRule) => evaluateVisibility(subRule, values));
  }

  const fieldValue = values[rule.field];

  if ("equals" in rule) {
    return deepEqual(fieldValue, rule.equals);
  }

  if ("notEquals" in rule) {
    return !deepEqual(fieldValue, rule.notEquals);
  }

  if ("in" in rule) {
    return rule.in.some((item) => deepEqual(item, fieldValue));
  }

  if ("notIn" in rule) {
    return !rule.notIn.some((item) => deepEqual(item, fieldValue));
  }

  return true;
}
