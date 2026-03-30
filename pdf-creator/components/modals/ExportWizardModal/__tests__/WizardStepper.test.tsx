/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import type { WizardStep } from "../types";
import { WizardStepper, getNextButtonLabel } from "../WizardStepper";

const steps: WizardStep[] = [
  { id: "s1", label: "Step 1", type: "placeholders", placeholders: [] },
  { id: "s2", label: "Step 2", type: "metadata" },
  { id: "s3", label: "Step 3", type: "password" },
];

describe("WizardStepper", () => {
  it("renders all step labels", () => {
    const { container } = render(<WizardStepper steps={steps} currentStep={0} />);
    expect(container.textContent).toContain("Step 1");
    expect(container.textContent).toContain("Step 2");
    expect(container.textContent).toContain("Step 3");
  });

  it("shows checkmark for completed steps", () => {
    const { container } = render(<WizardStepper steps={steps} currentStep={2} />);
    expect(container.textContent).toContain("\u2713");
  });

  it("shows step numbers for active and pending steps", () => {
    const { container } = render(<WizardStepper steps={steps} currentStep={0} />);
    expect(container.textContent).toContain("1");
    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("3");
  });

  it("highlights only the active step", () => {
    render(<WizardStepper steps={steps} currentStep={1} />);
    // Step 1 completed, step 2 active, step 3 pending
  });
});

describe("getNextButtonLabel", () => {
  it("returns processing message when processing", () => {
    expect(getNextButtonLabel(true, "Working...", false)).toBe("Working...");
  });

  it("returns default processing when no custom message", () => {
    expect(getNextButtonLabel(true, "", false)).toBe("Processing\u2026");
  });

  it("returns Export PDF for last step", () => {
    expect(getNextButtonLabel(false, "", true)).toBe("Export PDF");
  });

  it("returns Next arrow for non-last step", () => {
    expect(getNextButtonLabel(false, "", false)).toBe("Next \u2192");
  });
});
