"use client";

import type { TableElement } from "@/types/template";
import Field from "./Field";
import NumInput from "./NumInput";
import ColorInput from "./ColorInput";

interface TableSectionProps {
  el: TableElement;
  set: (key: string, value: unknown) => void;
}

export default function TableSection({ el, set }: Readonly<TableSectionProps>) {
  const mode = el.mode ?? "manual";

  function switchToManual() {
    set("mode", "manual");
  }

  function switchToAuto() {
    set("mode", "auto");
    // Keep only 1 preview row; add a blank one if there are none.
    if (el.rows.length === 0) {
      set("rows", [el.headers.map(() => "")]);
    } else if (el.rows.length > 1) {
      set("rows", [el.rows[0]]);
    }
  }

  function updateHeader(i: number, value: string) {
    const headers = [...el.headers];
    headers[i] = value;
    set("headers", headers);
  }

  function updateCell(ri: number, ci: number, value: string) {
    const rows = el.rows.map((r, ridx) =>
      ridx === ri ? r.map((c, cidx) => (cidx === ci ? value : c)) : r
    );
    set("rows", rows);
  }

  function deleteRow(ri: number) {
    set("rows", el.rows.filter((_, i) => i !== ri));
  }

  function addRow() {
    set("rows", [...el.rows, el.headers.map(() => "")]);
  }

  return (
    <div className="section-card">
      <div className="section-title">Table</div>

      {/* Styling */}
      <Field label="Font Size">
        <NumInput value={el.fontSize} onChange={(v) => set("fontSize", v)} min={6} max={20} />
      </Field>
      <Field label="Header Background">
        <ColorInput value={el.headerColor} onChange={(v) => set("headerColor", v)} />
      </Field>
      <Field label="Header Text Color">
        <ColorInput value={el.headerTextColor} onChange={(v) => set("headerTextColor", v)} />
      </Field>

      {/* Mode toggle */}
      <div className="flex-row gap-4" style={{ marginBottom: 10 }}>
        <button className={mode === "manual" ? "table-mode-tab-active" : "table-mode-tab-inactive"} onClick={switchToManual}>
          Manual
        </button>
        <button className={mode === "auto" ? "table-mode-tab-active" : "table-mode-tab-inactive"} onClick={switchToAuto}>
          Auto CSV
        </button>
      </div>

      {/* Headers — always editable in both modes */}
      <div style={{ marginBottom: 8 }}>
        <div className="table-label">COLUMN HEADERS</div>
        {el.headers.map((h, i) => (
          <input
            key={`table-section-header--${i + 1}`}
            aria-label={`Header ${i + 1}`}
            value={h}
            onChange={(e) => updateHeader(i, e.target.value)}
            className="input"
            style={{ marginBottom: 4 }}
          />
        ))}
      </div>

      {/* ── Manual: full row editor ─────────────────────────────────────────── */}
      {mode === "manual" && (
        <div>
          <div className="table-label">ROWS</div>
          {el.rows.map((row, ri) => (
            <div
              key={`table-section-row-manual-${ri + 1}`}
              className="flex-row gap-3"
              style={{ marginBottom: 4, alignItems: "center" }}
            >
              {row.map((cell, ci) => {
                const colName = el.headers[ci] ?? `Col ${ci + 1}`;
                return <input
                  key={`table-section-row-manual-${ri + 1}-cell-${ci}`}
                  aria-label={`Row ${ri + 1}, ${colName}`}
                  value={cell}
                  onChange={(e) => updateCell(ri, ci, e.target.value)}
                  className="table-cell-input"
                />;
              })}
              <button
                aria-label={`Delete row ${ri + 1}`}
                onClick={() => deleteRow(ri)}
                className="table-cell-delete"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addRow}
            className="table-add-row-btn"
          >
            + Add Row
          </button>
        </div>
      )}

      {/* ── Auto CSV: preview row + info ────────────────────────────────────── */}
      {mode === "auto" && (
        <div>
          <div className="table-label">PREVIEW ROW (editor only)</div>
          {el.rows[0] && (
            <div className="flex-row gap-3" style={{ marginBottom: 6 }}>
              {el.rows[0].map((cell, ci) => {
                const colName = el.headers[ci] ?? `Col ${ci + 1}`;
                return <input
                  key={`table-section-row-auto-${ci + 1}`}
                  aria-label={`Preview, ${colName}`}
                  value={cell}
                  onChange={(e) => updateCell(0, ci, e.target.value)}
                  className="table-cell-input"
                />;
              })}
            </div>
          )}
          <div className="table-auto-info">
            <strong>CSV uploaded at export</strong> — click Export PDF to upload
            a CSV file. All rows from the file will appear in the final PDF.
            The preview row above is shown in the editor only.
          </div>
        </div>
      )}
    </div>
  );
}
