"use client";

import { useState, useRef, type RefObject } from "react";
import type { PdfMetadata } from "@/types/template";
import type { WizardResult } from "./types";

const FIELDS: Array<{ key: keyof PdfMetadata; label: string; placeholder: string }> = [
  { key: "fileName",         label: "File Name",         placeholder: "output.pdf" },
  { key: "title",            label: "Title",             placeholder: "Document title" },
  { key: "author",           label: "Author",            placeholder: "Author name" },
  { key: "subject",          label: "Subject",           placeholder: "Document subject" },
  { key: "keywords",         label: "Keywords",          placeholder: "keyword1, keyword2, \u2026" },
  { key: "creator",          label: "Creator",           placeholder: "Application name" },
  { key: "producer",         label: "Producer",          placeholder: "PDF producer" },
  { key: "creationDate",     label: "Creation Date",     placeholder: "YYYY-MM-DD" },
  { key: "modificationDate", label: "Modification Date", placeholder: "YYYY-MM-DD" },
];

interface MetadataStepProps {
  resultRef: RefObject<WizardResult>;
}

export function MetadataStep({ resultRef }: Readonly<MetadataStepProps>) {
  const [meta, setMeta] = useState<PdfMetadata>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState("");

  const update = (key: keyof PdfMetadata, value: string) => {
    const next = { ...meta, [key]: value || undefined };
    setMeta(next);
    resultRef.current.metadata = next;
  };

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoadError("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const next: PdfMetadata = {};
      for (const f of FIELDS) {
        const val = parsed[f.key];
        if (typeof val === "string" && val) {
          next[f.key] = val;
        }
      }
      setMeta(next);
      resultRef.current.metadata = next;
    } catch {
      setLoadError("Invalid JSON file. Expected an object with metadata fields.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div className="step-header">
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>PDF Metadata</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
          Set document properties embedded in the PDF. You can type values or load from a JSON file.
        </div>
      </div>

      {/* Load from file bar */}
      <div className="file-bar">
        <button onClick={() => fileRef.current?.click()} className="modal-btn-ghost">
          Load from JSON file
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileLoad} />
        {loadError && <span style={{ fontSize: 11, color: "#DC2626" }}>{loadError}</span>}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(meta, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "metadata.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="modal-btn-ghost"
        >
          Save as JSON
        </button>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", maxWidth: 700 }}>
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} style={key === "fileName" ? { gridColumn: "1 / -1" } : undefined}>
              <label className="step-label">{label}</label>
              <input
                value={meta[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="modal-input step-field-input"
              />
            </div>
          ))}
        </div>

        {/* JSON preview */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Preview</div>
          <pre className="json-preview">
            {JSON.stringify(
              Object.fromEntries(Object.entries(meta).filter(([, v]) => v)),
              null, 2
            ) || "{}"}
          </pre>
        </div>
      </div>
    </div>
  );
}
