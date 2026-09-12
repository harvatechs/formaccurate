import { describe, expect, it } from "vitest";
import { evaluateVisibility } from "./evaluate.js";

describe("evaluateVisibility", () => {
  it("returns true when rule is undefined", () => {
    expect(evaluateVisibility(undefined, {})).toBe(true);
    expect(evaluateVisibility(undefined, { foo: "bar" })).toBe(true);
  });

  it("evaluates equals correctly for primitives and objects", () => {
    expect(
      evaluateVisibility({ field: "business_type", equals: "llc" }, { business_type: "llc" }),
    ).toBe(true);
    expect(
      evaluateVisibility(
        { field: "business_type", equals: "llc" },
        { business_type: "corporation" },
      ),
    ).toBe(false);
    expect(evaluateVisibility({ field: "count", equals: 42 }, { count: 42 })).toBe(true);
    expect(evaluateVisibility({ field: "count", equals: 42 }, { count: "42" })).toBe(false);
    expect(
      evaluateVisibility(
        { field: "meta", equals: { active: true } },
        { meta: { active: true } },
      ),
    ).toBe(true);
  });

  it("evaluates notEquals correctly", () => {
    expect(
      evaluateVisibility(
        { field: "business_type", notEquals: "sole_proprietor" },
        { business_type: "llc" },
      ),
    ).toBe(true);
    expect(
      evaluateVisibility(
        { field: "business_type", notEquals: "llc" },
        { business_type: "llc" },
      ),
    ).toBe(false);
  });

  it("evaluates in correctly", () => {
    const rule = { field: "role", in: ["admin", "editor", "owner"] };
    expect(evaluateVisibility(rule, { role: "admin" })).toBe(true);
    expect(evaluateVisibility(rule, { role: "owner" })).toBe(true);
    expect(evaluateVisibility(rule, { role: "viewer" })).toBe(false);
    expect(evaluateVisibility(rule, {})).toBe(false);
  });

  it("evaluates notIn correctly", () => {
    const rule = { field: "role", notIn: ["guest", "banned"] };
    expect(evaluateVisibility(rule, { role: "member" })).toBe(true);
    expect(evaluateVisibility(rule, { role: "guest" })).toBe(false);
    expect(evaluateVisibility(rule, {})).toBe(true);
  });

  it("evaluates allOf combinator", () => {
    const rule = {
      allOf: [
        { field: "is_business", equals: true },
        { field: "country", equals: "US" },
      ],
    };
    expect(evaluateVisibility(rule, { is_business: true, country: "US" })).toBe(true);
    expect(evaluateVisibility(rule, { is_business: true, country: "CA" })).toBe(false);
    expect(evaluateVisibility(rule, { is_business: false, country: "US" })).toBe(false);
  });

  it("evaluates anyOf combinator", () => {
    const rule = {
      anyOf: [
        { field: "tier", equals: "gold" },
        { field: "tier", equals: "platinum" },
      ],
    };
    expect(evaluateVisibility(rule, { tier: "gold" })).toBe(true);
    expect(evaluateVisibility(rule, { tier: "platinum" })).toBe(true);
    expect(evaluateVisibility(rule, { tier: "silver" })).toBe(false);
  });

  it("evaluates nested allOf and anyOf combinators", () => {
    const rule = {
      allOf: [
        { field: "status", equals: "active" },
        {
          anyOf: [
            { field: "business_type", equals: "llc" },
            {
              allOf: [
                { field: "business_type", equals: "corporation" },
                { field: "has_subsidiaries", equals: true },
              ],
            },
          ],
        },
      ],
    };

    expect(
      evaluateVisibility(rule, { status: "active", business_type: "llc" }),
    ).toBe(true);

    expect(
      evaluateVisibility(rule, {
        status: "active",
        business_type: "corporation",
        has_subsidiaries: true,
      }),
    ).toBe(true);

    expect(
      evaluateVisibility(rule, {
        status: "active",
        business_type: "corporation",
        has_subsidiaries: false,
      }),
    ).toBe(false);

    expect(
      evaluateVisibility(rule, {
        status: "pending",
        business_type: "llc",
      }),
    ).toBe(false);
  });
});
