"use client";

/**
 * ExportWizardModal — unified step-by-step wizard for PDF export.
 *
 * Replaces the sequential individual modals with a single modal that shows
 * a progress stepper at the top and lets the user complete each step in order.
 */

import { useState, useRef, useMemo } from "react";
import type { WizardStep, WizardResult } from "./types";
import { WizardStepper, getNextButtonLabel } from "./WizardStepper";
import { FontsStep } from "./FontsStep";
import { PlaceholderStep } from "./PlaceholderStep";
import { CsvStep } from "./CsvStep";
import { ChartStep } from "./ChartStep";
import { RepeaterStep } from "./RepeaterStep";
import { MetadataStep } from "./MetadataStep";
import { PasswordStep } from "./PasswordStep";
import { PdfAStep } from "./PdfAStep";
import { SignatureStep } from "./SignatureStep";

export {type WizardStep, type WizardResult} from "./types";

interface ExportWizardModalProps {
  steps: WizardStep[];
  onExport: (result: WizardResult) => void;
  onCancel: () => void;
}

export default function ExportWizardModal({
  steps,
  onExport,
  onCancel,
}: Readonly<ExportWizardModalProps>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [readyMap, setReadyMap] = useState<Record<number, boolean>>({});
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");

  const resultRef = useRef<WizardResult>({
    placeholderValues: {},
    resolvedRows: new Map(),
    chartImages: new Map(),
    repeaterItems: new Map(),
  });

  const [beforeNextHandlers] = useState(() => new Map<number, () => Promise<boolean>>());

  // Stable per-step callbacks derived from steps to avoid re-render loops.
  const setReadyCbs = useMemo(() =>
    new Map(steps.map((_, idx) => [
      idx,
      (ready: boolean) => setReadyMap((prev) => ({ ...prev, [idx]: ready })),
    ] as const)),
    [steps],
  );

  const regBeforeNextCbs = useMemo(() =>
    new Map(steps.map((_, idx) => [
      idx,
      (handler: () => Promise<boolean>) => { beforeNextHandlers.set(idx, handler); },
    ] as const)),
    [steps, beforeNextHandlers],
  );

  async function handleNext() {
    const handler = beforeNextHandlers.get(currentStep);
    if (handler) {
      setProcessing(true);
      setProcessingMsg("");
      try {
        const ok = await handler();
        if (!ok) { setProcessing(false); return; }
      } catch {
        setProcessing(false);
        return;
      }
      setProcessing(false);
      setProcessingMsg("");
    }

    if (currentStep === steps.length - 1) {
      onExport(resultRef.current);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Placeholders and CSV steps are always ready. Fonts/chart/repeater use readyMap.
  const isStepReady =
    step.type === "placeholders" || step.type === "csv" || step.type === "metadata" || step.type === "pdfa"
      ? true
      : readyMap[currentStep] ?? false;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog-wizard">
        {/* Stepper */}
        <WizardStepper steps={steps} currentStep={currentStep} />

        {/* Step content — all mounted, only active visible */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          {steps.map((s, idx) => (
            <div
              key={s.id}
              style={{
                display: idx === currentStep ? "flex" : "none",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {s.type === "fonts" && s.missingFonts && (
                <FontsStep
                  missingFonts={s.missingFonts}
                  setReady={setReadyCbs.get(idx)!}
                />
              )}
              {s.type === "placeholders" && s.placeholders && (
                <PlaceholderStep placeholders={s.placeholders} resultRef={resultRef} />
              )}
              {s.type === "csv" && s.table && (
                <CsvStep table={s.table} resultRef={resultRef} />
              )}
              {s.type === "chart" && s.chart && (
                <ChartStep
                  chart={s.chart}
                  active={idx === currentStep}
                  resultRef={resultRef}
                  registerBeforeNext={regBeforeNextCbs.get(idx)!}
                  setReady={setReadyCbs.get(idx)!}
                />
              )}
              {s.type === "repeater" && s.repeater && (
                <RepeaterStep
                  repeater={s.repeater}
                  resultRef={resultRef}
                  registerBeforeNext={regBeforeNextCbs.get(idx)!}
                  setReady={setReadyCbs.get(idx)!}
                  setProcessingMsg={setProcessingMsg}
                />
              )}
              {s.type === "metadata" && (
                <MetadataStep resultRef={resultRef} />
              )}
              {s.type === "password" && (
                <PasswordStep resultRef={resultRef} setReady={setReadyCbs.get(idx)!} />
              )}
              {s.type === "pdfa" && (
                <PdfAStep resultRef={resultRef} />
              )}
              {s.type === "signature" && (
                <SignatureStep resultRef={resultRef} setReady={setReadyCbs.get(idx)!} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onCancel} className="modal-btn-cancel">Cancel</button>
          <div style={{ flex: 1 }} />
          {currentStep > 0 && (
            <button onClick={handleBack} disabled={processing} className="modal-btn-back">
              {"\u2190"} Back
            </button>
          )}
          <button
            onClick={() => { void handleNext(); }}
            disabled={!isStepReady || processing}
            className={!isStepReady || processing ? "modal-btn-next-disabled" : isLast ? "modal-btn-next-green" : "modal-btn-next-blue"}
          >
            {getNextButtonLabel(processing, processingMsg, isLast)}
          </button>
        </div>
      </div>
    </div>
  );
}
