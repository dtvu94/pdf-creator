"use client";

import { useState, useRef, useEffect } from "react";
import { downloadJson } from "@/lib/utils";
import type { WizardResult } from "./types";

export function PlaceholderStep({
  placeholders,
  resultRef,
}: Readonly<{
  placeholders: string[];
  resultRef: React.RefObject<WizardResult>;
}>) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(placeholders.map((p) => [p, ""])),
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync to result ref on every change.
  useEffect(() => {
    resultRef.current.placeholderValues = values;
  }, [values, resultRef]);

  const set = (key: string, val: string) => setValues((prev) => ({ ...prev, [key]: val }));

  const downloadTemplate = () =>
    downloadJson(Object.fromEntries(placeholders.map((p) => [p, ""])), "placeholders.json");

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setFileError("File must be a JSON object with placeholder keys.");
        return;
      }
      const merged = Object.fromEntries(
        placeholders.map((p) => [p, typeof parsed[p] === "string" ? parsed[p] : ""])
      );
      const missing = placeholders.filter((p) => typeof parsed[p] !== "string");
      if (missing.length > 0) setFileError(`Missing keys: ${missing.map((k) => "{{" + k + "}}").join(", ")} \u2014 left blank.`);
      setValues(merged);
    } catch {
      setFileError("Invalid JSON file.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="step-header">
        <span style={{ fontWeight: 700, fontSize: 14 }}>Fill in placeholders</span>
        <span style={{ color: "#64748B", fontSize: 12 }}>
          {placeholders.length} placeholder{placeholders.length === 1 ? "" : "s"} found
        </span>
      </div>

      <div className="file-bar">
        <span style={{ fontSize: 11, color: "#64748B" }}>Fill via file:</span>
        <button onClick={downloadTemplate} className="modal-btn-ghost">{"\u2B07"} Download template</button>
        <button onClick={() => fileRef.current!.click()} className="modal-btn-ghost">{"\u2B06"} Load from file</button>
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
          onChange={(e) => { void handleFileLoad(e); }} />
      </div>

      {fileError && <div className="banner-error">{fileError}</div>}

      <div style={{ padding: "12px 20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {placeholders.map((key) => (
          <label key={key} aria-label={`Placeholder ${key}`} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
              <span className="chip-ph">{`{{${key}}}`}</span>
            </span>
            <input type="text" value={values[key]} placeholder={`Value for ${key}`}
              onChange={(e) => set(key, e.target.value)}
              className="modal-input"
              autoFocus={key === placeholders[0]} />
          </label>
        ))}
      </div>
    </div>
  );
}
