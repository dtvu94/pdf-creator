"use client";

import type { WizardStep } from "./types";

function getStepStatus(idx: number, currentStep: number): "completed" | "active" | "pending" {
  if (idx < currentStep) return "completed";
  if (idx === currentStep) return "active";
  return "pending";
}

export function getNextButtonLabel(processing: boolean, processingMsg: string, isLast: boolean): string {
  if (processing) return processingMsg || "Processing\u2026";
  if (isLast) return "Export PDF";
  return "Next \u2192";
}

export function WizardStepper({
  steps,
  currentStep,
}: Readonly<{ steps: WizardStep[]; currentStep: number }>) {
  return (
    <div className="stepper-bar">
      {steps.map((step, idx) => {
        const status = getStepStatus(idx, currentStep);
        const done = status === "completed";
        const active = status === "active";
        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center", flex: idx < steps.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
              <div className={`stepper-circle ${done ? "stepper-done" : active ? "stepper-active" : "stepper-future"}`}>
                {done ? "\u2713" : idx + 1}
              </div>
              <span
                className={`stepper-label ${done ? "stepper-label-done" : active ? "stepper-label-active" : "stepper-label-future"}`}
                title={step.label}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`stepper-line ${idx < currentStep ? "stepper-line-done" : "stepper-line-future"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
