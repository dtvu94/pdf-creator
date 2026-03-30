/**
 * Minimal compilation test for ExportWizardModal types.
 */

import type {
  WizardStep,
  WizardResult,
  PdfASettings,
  SignatureSettings,
} from "../types";

describe("ExportWizardModal types", () => {
  it("WizardStep type compiles correctly", () => {
    const step: WizardStep = {
      id: "test",
      label: "Test Step",
      type: "placeholders",
      placeholders: ["name"],
    };
    expect(step.id).toBe("test");
    expect(step.type).toBe("placeholders");
  });

  it("WizardResult type compiles correctly", () => {
    const result: WizardResult = {
      placeholderValues: { name: "Alice" },
      resolvedRows: new Map(),
      chartImages: new Map(),
      repeaterItems: new Map(),
    };
    expect(result.placeholderValues.name).toBe("Alice");
  });

  it("PdfASettings type compiles correctly", () => {
    const settings: PdfASettings = { part: 2, conformance: "B" };
    expect(settings.part).toBe(2);
  });

  it("SignatureSettings type compiles correctly", () => {
    const sig: SignatureSettings = {
      keystoreBase64: "abc",
      keystorePassword: "pass",
      reason: "Approval",
    };
    expect(sig.keystoreBase64).toBe("abc");
  });
});
