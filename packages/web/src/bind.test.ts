// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { FormRegistry } from "./bind.js";
import { FormAccurateBridgeImpl } from "./bridge.js";

describe("bind & FormRegistry", () => {
  it("scans and binds forms and fields in DOM", () => {
    document.body.innerHTML = `
      <form data-fa-form="test-form">
        <label for="f_name">Name</label>
        <input id="f_name" name="f_name" data-fa-field="f_name" type="text" value="Alice" />
        <button type="submit" data-fa-action="submit">Submit</button>
      </form>
    `;

    const registry = new FormRegistry();
    registry.scan(document.body);

    const forms = registry.listForms();
    expect(forms).toHaveLength(1);
    expect(forms[0]?.formId).toBe("test-form");

    const values = registry.readValues("test-form");
    expect(values).toEqual({ f_name: "Alice" });

    registry.writeValues("test-form", { f_name: "Bob" });
    expect(registry.readValues("test-form")).toEqual({ f_name: "Bob" });
  });

  it("exposes FormAccurateBridge methods", async () => {
    document.body.innerHTML = `
      <form data-fa-form="bridge-form">
        <input data-fa-field="title" type="text" />
        <input data-fa-field="agree" type="checkbox" />
      </form>
    `;

    const registry = new FormRegistry();
    registry.scan(document.body);

    const bridge = new FormAccurateBridgeImpl(registry);
    bridge.registerSchema({
      $schema: "https://formaccurate.dev/schema/v1.json",
      formId: "bridge-form",
      version: "1.0.0",
      title: "Bridge Form",
      fields: [
        { id: "title", type: "string", label: "Title", required: true },
        { id: "agree", type: "boolean", label: "Agree", required: true },
      ],
      actions: [{ id: "submit", label: "Submit", type: "submit" }],
    });

    const initial = bridge.getState("bridge-form");
    expect(initial.status).toBe("draft");

    // setValues
    bridge.setValues("bridge-form", { title: "Test Title", agree: true });
    expect(bridge.getState("bridge-form").values).toEqual({
      title: "Test Title",
      agree: true,
    });

    // validate
    const validated = bridge.validate("bridge-form");
    expect(validated.status).toBe("valid");

    // submit
    const receipt = await bridge.submit("bridge-form");
    expect(receipt.status).toBe("submitted");
    expect(receipt.checksum).toMatch(/^sha256:/);
  });
});
