"use client";

/**
 * ExportPdfButton.tsx
 *
 * Unified export flow:
 *   1. Compute wizard steps (missing fonts, placeholders, auto-tables, charts, repeaters, metadata)
 *   2. If steps exist → show ExportWizardModal
 *   3. Generate & download PDF
 */

import { useState, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import { PdfDocument } from "./PdfTemplate";
import type { Template } from "@/types/template";
import {
  extractPlaceholders,
  applyValues,
  collectAutoTables,
  applyAutoRows,
  collectCharts,
  applyChartImages,
  collectRepeaters,
  applyRepeaterItems,
} from "@/lib/placeholders";
import { registerFontsClient } from "@/lib/fontRegistry";
import ExportWizardModal, { type WizardStep, type WizardResult } from "./modals/ExportWizardModal";

interface ExportPdfButtonProps {
  template: Template;
  includeMetadata?: boolean;
  includePassword?: boolean;
  includePdfA?: boolean;
  includeSignature?: boolean;
}

type Phase = "idle" | "preparing" | "wizard" | "loading";

export default function ExportPdfButton({ template, includeMetadata, includePassword, includePdfA, includeSignature }: Readonly<ExportPdfButtonProps>) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const wizardStepsRef = useRef<WizardStep[]>([]);

  // ── Kick off export: compute steps (including font check) ─────────────────
  async function handleClick() {
    setPhase("preparing");
    const steps: WizardStep[] = [];

    // 0. Metadata step (if toggled on — always first so user sets filename early).
    if (includeMetadata) {
      steps.push({ id: "metadata", label: "Metadata", type: "metadata" });
    }

    // 0b. Password step (if toggled on).
    if (includePassword) {
      steps.push({ id: "password", label: "Password", type: "password" });
    }

    // 0c. PDF/A step (if toggled on).
    if (includePdfA) {
      steps.push({ id: "pdfa", label: "PDF/A", type: "pdfa" });
    }

    // 0d. Digital signature step (if toggled on).
    if (includeSignature) {
      steps.push({ id: "signature", label: "Signature", type: "signature" });
    }

    // 1. Check uploaded fonts for missing files.
    const uploadedFonts = (template.fonts ?? []).filter((f) =>
      f.faces.some((fc) => fc.source === "uploaded"),
    );
    if (uploadedFonts.length > 0) {
      const refs = uploadedFonts.flatMap((f) =>
        f.faces.filter((fc) => fc.source === "uploaded").map((fc) => fc.ref),
      );
      try {
        const res = await fetch("/api/fonts/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refs }),
        });
        const data = (await res.json()) as { missing: string[] };
        if (data.missing.length > 0) {
          const missingSet = new Set(data.missing);
          const missingFonts = uploadedFonts
            .map((f) => ({
              ...f,
              faces: f.faces.filter((fc) => fc.source === "uploaded" && missingSet.has(fc.ref)),
            }))
            .filter((f) => f.faces.length > 0);
          steps.push({ id: "fonts", label: "Missing Fonts", type: "fonts", missingFonts });
        }
      } catch {
        /* network error — proceed, server will handle it */
      }
    }

    // 2. Placeholders.
    const placeholders = extractPlaceholders(template);
    if (placeholders.length > 0) {
      steps.push({ id: "ph", label: "Placeholders", type: "placeholders", placeholders });
    }

    // 3. Auto-tables.
    for (const table of collectAutoTables(template)) {
      steps.push({ id: table.id, label: "Table Data", type: "csv", table });
    }

    // 4. Charts.
    for (const chart of collectCharts(template)) {
      steps.push({ id: chart.id, label: "Chart", type: "chart", chart });
    }

    // 5. Repeaters.
    for (const repeater of collectRepeaters(template)) {
      steps.push({ id: repeater.id, label: repeater.label, type: "repeater", repeater });
    }

    if (steps.length === 0) {
      generate({
        placeholderValues: {},
        resolvedRows: new Map(),
        chartImages: new Map(),
        repeaterItems: new Map(),
      });
    } else {
      wizardStepsRef.current = steps;
      setPhase("wizard");
    }
  }

  // ── Generate PDF from wizard results ──────────────────────────────────────
  async function generate(result: WizardResult) {
    setPhase("loading");
    setExportError(null);
    try {
      let t = applyValues(template, result.placeholderValues);
      t = applyAutoRows(t, result.resolvedRows);
      t = applyChartImages(t, result.chartImages);
      t = applyRepeaterItems(t, result.repeaterItems);

      const metadata = result.metadata;
      const fileName = metadata?.fileName || "output.pdf";

      if (result.password || result.pdfA || result.signature) {
        // Password / PDF/A / Signature require server-side processing.
        const form = new FormData();
        form.append("template", JSON.stringify(t));
        if (metadata) form.append("metadata", JSON.stringify(metadata));
        if (result.password) form.append("password", result.password);
        if (result.pdfA) form.append("pdfa", JSON.stringify(result.pdfA));
        if (result.signature) form.append("signature", JSON.stringify(result.signature));

        const res = await fetch("/api/generate-pdf", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "PDF generation failed." }));
          throw new Error((body as { error?: string }).error ?? "PDF generation failed.");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        registerFontsClient(t.fonts);
        const blob = await pdf(<PdfDocument template={t} metadata={metadata} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "An unexpected error occurred.";
      setExportError(message);
    } finally {
      setPhase("idle");
    }
  }

  const busy = phase === "loading" || phase === "preparing";

  return (
    <>
      <button
        onClick={() => { void handleClick(); }}
        disabled={busy}
        className="export-btn"
        style={{ background: busy ? "#6B7280" : "#16A34A", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}
      >
        {phase === "loading" ? "Building…" : "Export PDF"}
      </button>

      {phase === "wizard" && (
        <ExportWizardModal
          steps={wizardStepsRef.current}
          onExport={(result) => { void generate(result); }}
          onCancel={() => setPhase("idle")}
        />
      )}

      {exportError && (
        <div className="export-error-toast">
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#991B1B", marginBottom: 4 }}>
              Export failed
            </div>
            <div style={{ fontSize: 12, color: "#DC2626", lineHeight: 1.5 }}>
              {exportError}
            </div>
          </div>
          <button
            onClick={() => setExportError(null)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#991B1B", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0,
            }}
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}
