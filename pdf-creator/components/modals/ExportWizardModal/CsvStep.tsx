"use client";

import { useState, useRef, useEffect } from "react";
import type { TableElement } from "@/types/template";
import { parseTableData } from "@/lib/utils";
import type { WizardResult } from "./types";

export function CsvStep({
  table,
  resultRef,
}: Readonly<{
  table: TableElement;
  resultRef: React.RefObject<WizardResult>;
}>) {
  const [parsedRows, setParsedRows] = useState<string[][] | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Default: use existing table rows.
  useEffect(() => {
    if (!resultRef.current.resolvedRows.has(table.id)) {
      resultRef.current.resolvedRows.set(table.id, table.rows);
    }
  }, [table, resultRef]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setWarning(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const { headers, rows } = parseTableData(await file.text());
    if (headers.length !== table.headers.length) {
      setWarning(`Column count mismatch \u2014 expected ${table.headers.length}, got ${headers.length}. Rows will be trimmed or padded.`);
    }
    const cols = table.headers.length;
    const normalised = rows.map((r) => {
      const row = [...r];
      while (row.length < cols) row.push("");
      return row.slice(0, cols);
    });
    setParsedRows(normalised);
    resultRef.current.resolvedRows.set(table.id, normalised);
    e.target.value = "";
  }

  function downloadSampleCsv() {
    const previewRow = table.rows[0] ?? table.headers.map(() => "");
    const escape = (s: string) => (s.includes(",") ? `"${s}"` : s);
    const lines = [table.headers.map(escape).join(","), previewRow.map(escape).join(",")];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const PREVIEW_LIMIT = 5;
  const previewRows = parsedRows ?? table.rows;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="step-header">
        <span style={{ fontWeight: 700, fontSize: 14 }}>Upload CSV data</span>
        <span style={{ color: "#64748B", fontSize: 12 }}>Table is set to <strong>Auto CSV</strong> mode.</span>
      </div>

      <div className="file-bar" style={{ gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>Columns:</span>
        {table.headers.map((h) => (
          <span key={`wiz-csv-hdr-${h}`} className="chip-green">{h}</span>
        ))}
      </div>

      <div className="file-bar">
        <button onClick={downloadSampleCsv} className="modal-btn-ghost">{"\u2B07"} Download sample CSV</button>
        <button onClick={() => fileRef.current!.click()} className="modal-btn-ghost">{"\u2B06"} Upload CSV / TSV</button>
        <input ref={fileRef} type="file" accept=".csv,.tsv,text/csv" style={{ display: "none" }}
          onChange={(e) => { void handleFile(e); }} />
      </div>

      {warning && <div className="banner-warning">{warning}</div>}

      <div style={{ padding: "12px 20px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>
          {(() => {
            const pluralSuffix = (n: number) => (n === 1 ? "" : "s");
            if (parsedRows) {
              return `${parsedRows.length} row${pluralSuffix(parsedRows.length)} loaded from file`;
            }
            return `Using ${table.rows.length} existing row${pluralSuffix(table.rows.length)} from template`;
          })()}
          {previewRows.length > PREVIEW_LIMIT ? ` \u2014 showing first ${PREVIEW_LIMIT}` : ""}
        </div>
        {previewRows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "system-ui" }}>
              <thead>
                <tr>
                  {table.headers.map((h) => (
                    <th key={`wiz-csv-th-${h}`} className="wizard-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, PREVIEW_LIMIT).map((row, ri) => (
                  <tr key={`wiz-csv-row-${row[0] ?? ri}`} style={{ background: ri % 2 === 0 ? "#F8FAFC" : "#fff" }}>
                    {row.map((cell, ci) => (
                      <td key={`${table.headers[ci] ?? ci}-${cell}`} className="wizard-td">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
