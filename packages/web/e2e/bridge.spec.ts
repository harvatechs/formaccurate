import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("FormAccurate Browser Bridge (Vanilla HTML E2E)", () => {
  test("fills, validates, and submits form through window.FormAccurate bridge", async ({
    page,
  }) => {
    const fixturePath = path
      .resolve(process.cwd(), "../../examples/vanilla-html/index.html")
      .replace(/\\/g, "/");

    await page.goto(`file:///${fixturePath}`);

    // Verify bridge exists on window
    const hasBridge = await page.evaluate(() => typeof window.FormAccurate !== "undefined");
    expect(hasBridge).toBe(true);

    // List forms
    const forms = await page.evaluate(() => window.FormAccurate!.listForms());
    expect(forms.some((f) => f.formId === "business-permit-application")).toBe(true);

    // Step 1: Agent sets incomplete values and triggers validate
    await page.evaluate(() => {
      window.FormAccurate!.setValues("business-permit-application", {
        legal_name: "Incomplete Corp",
        email: "not-an-email",
        business_type: "llc",
        // missing llc_registration_number and declaration
      });
      window.FormAccurate!.validate("business-permit-application");
    });

    // Check DOM reflects validation errors
    const emailError = page.locator('[data-fa-error-for="email"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText("valid email address");

    const llcError = page.locator('[data-fa-error-for="llc_registration_number"]');
    await expect(llcError).toBeVisible();

    // Step 2: Agent fills complete, valid inputs
    await page.evaluate(() => {
      window.FormAccurate!.setValues("business-permit-application", {
        legal_name: "Apex Autonomous Systems LLC",
        email: "filings@apex-systems.io",
        business_type: "llc",
        llc_registration_number: "LLC-994812",
        employee_count: 12,
        declaration_true: true,
      });
    });

    // Assert DOM elements reflect agent-set values directly
    await expect(page.locator("#legal_name")).toHaveValue("Apex Autonomous Systems LLC");
    await expect(page.locator("#email")).toHaveValue("filings@apex-systems.io");
    await expect(page.locator("#business_type")).toHaveValue("llc");
    await expect(page.locator("#llc_registration_number")).toHaveValue("LLC-994812");
    await expect(page.locator("#employee_count")).toHaveValue("12");
    await expect(page.locator("#declaration_true")).toBeChecked();

    // Step 3: Agent validates valid form
    const validState = await page.evaluate(() => {
      return window.FormAccurate!.validate("business-permit-application");
    });

    expect(validState.status).toBe("valid");
    expect(validState.errors).toHaveLength(0);

    // Errors should be cleared from DOM
    await expect(page.locator(".fa-error-message")).toHaveCount(0);

    // Step 4: Agent submits and receives verifiable receipt
    const receipt = await page.evaluate(async () => {
      return await window.FormAccurate!.submit("business-permit-application");
    });

    expect(receipt.status).toBe("submitted");
    expect(receipt.submissionId).toMatch(/^sub_/);
    expect(receipt.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);

    // Terminal and receipt UI updated
    await expect(page.locator("#receipt-display")).toBeVisible();
  });
});
