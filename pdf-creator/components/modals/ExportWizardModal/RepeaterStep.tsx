"use client";

import { useState, useRef, useEffect } from "react";
import type { ChartElement, RepeaterElement, RepeaterItem } from "@/types/template";
import type { WizardResult } from "./types";
import { parseCsv, getExpectedFields, buildRepeaterChartOption, renderChartImage } from "./utils";
import { MetaChip } from "./MetaChip";

export function RepeaterStep({
  repeater,
  resultRef,
  registerBeforeNext,
  setReady,
  setProcessingMsg,
}: Readonly<{
  repeater: RepeaterElement;
  resultRef: React.RefObject<WizardResult>;
  registerBeforeNext: (fn: () => Promise<boolean>) => void;
  setReady: (ready: boolean) => void;
  setProcessingMsg: (msg: string) => void;
}>) {
  const expectedFields = getExpectedFields(repeater);
  const chartElements = repeater.cardElements.filter(
    (el): el is ChartElement => el.type === "chart",
  );
  const hasCharts = chartElements.some((c) => c.seriesDataField);

  const [inputText, setInputText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<RepeaterItem[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const parsedRef = useRef(parsedItems);
  parsedRef.current = parsedItems;

  // Readiness.
  useEffect(() => {
    setReady(!!parsedItems && parsedItems.length > 0 && !parseError);
  }, [parsedItems, parseError, setReady]);

  // Register beforeNext: render charts per item if needed.
  useEffect(() => {
    registerBeforeNext(async () => {
      const items = parsedRef.current;
      if (!items || items.length === 0) return false;

      const chartsToRender = chartElements.filter((c) => c.seriesDataField);
      if (chartsToRender.length === 0) {
        resultRef.current.repeaterItems.set(repeater.id, items);
        return true;
      }

      let updatedItems = [...items];
      const total = chartsToRender.length * items.length;
      let done = 0;

      for (const chartEl of chartsToRender) {
        const newItems: RepeaterItem[] = [];
        for (const item of updatedItems) {
          const seriesRaw = item.fields[chartEl.seriesDataField!];
          if (!seriesRaw) { newItems.push(item); continue; }
          done++;
          setProcessingMsg(`Rendering chart ${done} / ${total}\u2026`);
          await new Promise<void>((r) => setTimeout(r, 0));
          try {
            const rawData = JSON.parse(seriesRaw) as unknown[];
            const option = buildRepeaterChartOption(chartEl, rawData);
            const img = await renderChartImage(option, chartEl.width, chartEl.height);
            newItems.push({ ...item, chartImages: { ...item.chartImages, [chartEl.id]: img } });
          } catch {
            newItems.push(item);
          }
        }
        updatedItems = newItems;
      }

      resultRef.current.repeaterItems.set(repeater.id, updatedItems);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeater, registerBeforeNext, resultRef, setProcessingMsg]);

  function parseInput(text: string) {
    setInputText(text);
    setParseError(null);
    setParsedItems(null);
    const trimmed = text.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed) as unknown[];
        if (!Array.isArray(arr)) { setParseError("JSON must be an array of objects"); return; }
        const items: RepeaterItem[] = arr.map((row) => ({
          fields: Object.fromEntries(
            Object.entries(row as Record<string, unknown>).map(([k, v]) => {
              if (v == null) return [k, ""];
              if (typeof v === "object") return [k, JSON.stringify(v)];
              return [k, String(v)]; //NOSONAR
            }),
          ),
        }));
        setParsedItems(items);
        return;
      } catch { setParseError("Invalid JSON array"); return; }
    }

    try {
      const rows = parseCsv(trimmed);
      if (rows.length < 2) { setParseError("CSV must have a header row and at least one data row"); return; }
      const [headerRow, ...dataRows] = rows;
      setParsedItems(dataRows.map((row) => ({ fields: Object.fromEntries(headerRow.map((h, i) => [h, row[i] ?? ""])) })));
    } catch { setParseError("Could not parse input as JSON array or CSV"); }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    parseInput(await file.text());
    e.target.value = "";
  }

  function downloadSampleCsv() {
    const fields = expectedFields.length > 0 ? expectedFields : ["name", "value"];
    const escape = (s: string) => (s.includes(",") ? `"${s}"` : s);
    const lines = [fields.map(escape).join(","), fields.map(() => "").join(",")];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `repeater-${repeater.dataKey}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const PREVIEW_LIMIT = 5;
  const previewItems = parsedItems?.slice(0, PREVIEW_LIMIT) ?? [];
  const previewFields = parsedItems
    ? [...new Set(parsedItems.flatMap((item) => Object.keys(item.fields)))]
    : expectedFields;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="step-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>{repeater.label}</span>
          <span className="repeater-data-key">
            {repeater.dataKey}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
          <MetaChip label="Layout" value={`${repeater.itemsPerRow} per row \u00b7 ${repeater.cardWidth}\u00d7${repeater.cardHeight} pt`} />
          {hasCharts && <MetaChip label="Charts" value="auto-rendered from series data" highlight />}
        </div>
        {expectedFields.length > 0 && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#64748B", whiteSpace: "nowrap", marginTop: 2 }}>Fields:</span>
            {expectedFields.map((f) => (
              <span key={f} className="chip-field">{f}</span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Input pane */}
        <div className="editor-pane">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Paste JSON array or CSV</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={downloadSampleCsv} className="modal-btn-ghost">{"\u2B07"} Sample CSV</button>
              <button onClick={() => fileRef.current!.click()} className="modal-btn-ghost">{"\u2B06"} Upload file</button>
              <input ref={fileRef} type="file" accept=".json,.csv,.tsv" style={{ display: "none" }}
                onChange={(e) => { void handleFile(e); }} />
            </div>
          </div>
          <textarea value={inputText} onChange={(e) => parseInput(e.target.value)} spellCheck={false}
            placeholder={`JSON array:\n[\n  { "sensor_name": "Sensor A", "average_value": "23.1" },\n  ...\n]\n\nOr CSV:\nsensor_name,average_value\nSensor A,23.1`}
            className="modal-textarea" style={{ borderColor: parseError ? "#EF4444" : "#E2E8F0" }} />
          <div style={{ marginTop: 4, minHeight: 16 }}>
            {parseError && <span style={{ color: "#EF4444", fontSize: 11 }}>{parseError}</span>}
            {!parseError && parsedItems && (
              <span style={{ color: "#16A34A", fontSize: 11 }}>{parsedItems.length} item{parsedItems.length === 1 ? "" : "s"} parsed</span>
            )}
            {!parseError && !parsedItems && (
              <span style={{ color: "#94A3B8", fontSize: 10 }}>Accepts a JSON array of objects or a CSV with a header row.</span>
            )}
          </div>
        </div>

        {/* Preview pane */}
        <div className="preview-pane">
          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Preview{parsedItems && parsedItems.length > PREVIEW_LIMIT ? ` (first ${PREVIEW_LIMIT} of ${parsedItems.length})` : ""}
          </div>
          {previewItems.length > 0 ? (
            <div style={{ overflowX: "auto", flex: 1, minHeight: 0 }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11, fontFamily: "system-ui", width: "100%" }}>
                <thead>
                  <tr>{previewFields.map((f) => <th key={f} className="wizard-th">{f}</th>)}</tr>
                </thead>
                <tbody>
                  {previewItems.map((item, ri) => (
                    <tr key={`rp-${ri + 1}`} style={{ background: ri % 2 === 0 ? "#F8FAFC" : "#fff" }}>
                      {previewFields.map((f) => (
                        <td key={f} className="wizard-td">{item.fields[f] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-preview">Parsed items will appear here</div>
          )}
          {hasCharts && parsedItems && (
            <div className="repeater-chart-info">
              Chart images will be automatically rendered when you proceed to the next step.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
