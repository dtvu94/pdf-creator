"use client";

import { useState, useEffect, type RefObject } from "react";
import type { WizardResult } from "./types";

const selectStyle: React.CSSProperties = {
  border: "1px solid #CBD5E1", borderRadius: 4,
  padding: "5px 8px", fontSize: 13, fontFamily: "system-ui", outline: "none",
  width: "100%", maxWidth: 480, boxSizing: "border-box" as const,
};

interface PdfAStepProps {
  resultRef: RefObject<WizardResult>;
}

const PARTS = [
  {
    value: 1,
    label: "PDF/A-1 \u2014 Oldest, widest compatibility",
    hint: "Based on PDF 1.4 (2005). No transparency or JPEG2000. Choose this if the recipient requires PDF/A-1 specifically, e.g. some government portals.",
  },
  {
    value: 2,
    label: "PDF/A-2 \u2014 Recommended for most uses",
    hint: "Based on PDF 1.7 (2011). Supports transparency, JPEG2000, and layers. The best default for archiving documents today.",
  },
  {
    value: 3,
    label: "PDF/A-3 \u2014 For embedding attachments",
    hint: "Same as PDF/A-2 but allows embedding arbitrary files inside the PDF (e.g. source XML for e-invoices like ZUGFeRD/Factur-X). Only needed for special workflows.",
  },
];

const CONFORMANCES = [
  {
    value: "B",
    label: "Level B \u2014 Visual preservation",
    hint: "Guarantees the document looks the same when opened anywhere. This is sufficient for most archival needs.",
  },
  {
    value: "U",
    label: "Level U \u2014 Searchable text",
    hint: "Same as Level B, plus all text can be searched and copy-pasted reliably (Unicode mappings required). Available for PDF/A-2 and PDF/A-3 only.",
  },
  {
    value: "A",
    label: "Level A \u2014 Full accessibility",
    hint: "The strictest level. Requires the document to be tagged with a logical structure (headings, reading order, alt text) so screen readers can interpret it. Difficult to achieve with auto-generated PDFs.",
  },
];

export function PdfAStep({ resultRef }: Readonly<PdfAStepProps>) {
  const [part, setPart] = useState(2);
  const [conformance, setConformance] = useState("A");

  const update = (p: number, c: string) => {
    resultRef.current.pdfA = { part: p, conformance: c };
  };

  // Initialize on mount
  useEffect(() => {
    if (!resultRef.current.pdfA) {
      resultRef.current.pdfA = { part, conformance };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPart = PARTS.find((p) => p.value === part);
  const selectedConf = CONFORMANCES.find((c) => c.value === conformance);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div className="step-header">
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>PDF/A — Archival Format</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
          PDF/A ensures your document can be opened and look identical years from now, regardless of software.
          The defaults below work for most cases — only change them if you have specific requirements.
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 480 }}>

          {/* Explanation box */}
          <div className="step-info-box">
            <strong style={{ color: "#1E293B" }}>What do these options mean?</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
              <li><strong>Version</strong> — which year&apos;s PDF/A standard to target. Newer versions support more features. PDF/A-2 is the safe default.</li>
              <li style={{ marginTop: 4 }}><strong>Level</strong> — how strict the compliance is. Level B (visual preservation) is enough for archiving. Higher levels add text searchability (U) or full accessibility (A).</li>
            </ul>
          </div>

          {/* Version selector */}
          <div>
            <label className="step-label">Version</label>
            <select
              value={part}
              onChange={(e) => {
                const p = Number(e.target.value);
                setPart(p);
                const c = p === 1 && conformance === "U" ? "B" : conformance;
                setConformance(c);
                update(p, c);
              }}
              style={selectStyle}
            >
              {PARTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {selectedPart && <div className="step-hint">{selectedPart.hint}</div>}
          </div>

          {/* Level selector */}
          <div>
            <label className="step-label">Level</label>
            <select
              value={conformance}
              onChange={(e) => {
                setConformance(e.target.value);
                update(part, e.target.value);
              }}
              style={selectStyle}
            >
              {CONFORMANCES.map((c) => (
                <option
                  key={c.value}
                  value={c.value}
                  disabled={c.value === "U" && part === 1}
                >
                  {c.label}
                </option>
              ))}
            </select>
            {selectedConf && <div className="step-hint">{selectedConf.hint}</div>}
          </div>

          {/* Output summary */}
          <div className="step-success-box">
            Output: <strong>PDF/A-{part}{conformance.toLowerCase()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
