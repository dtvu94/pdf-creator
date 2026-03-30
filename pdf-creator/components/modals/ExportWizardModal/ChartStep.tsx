"use client";

import { useState, useRef, useEffect } from "react";
import type { ChartElement } from "@/types/template";
import type { WizardResult } from "./types";
import { renderChartImage } from "./utils";
import { MetaChip } from "./MetaChip";

export function ChartStep({
  chart,
  active,
  resultRef,
  registerBeforeNext,
  setReady,
}: Readonly<{
  chart: ChartElement;
  active: boolean;
  resultRef: React.RefObject<WizardResult>;
  registerBeforeNext: (fn: () => Promise<boolean>) => void;
  setReady: (ready: boolean) => void;
}>) {
  const isPreConfigured = Object.keys(chart.option).length > 0;
  const [jsonText, setJsonText] = useState(() =>
    isPreConfigured ? JSON.stringify(chart.option, null, 2) : "",
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [parsedOption, setParsedOption] = useState<Record<string, unknown> | null>(
    isPreConfigured ? chart.option : null,
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const chartInstRef = useRef<{ dispose: () => void; setOption: (o: unknown) => void } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const parsedRef = useRef(parsedOption);
  parsedRef.current = parsedOption;

  // Readiness: need a valid option.
  useEffect(() => { setReady(!!parsedOption); }, [parsedOption, setReady]);

  // Register beforeNext: render chart to PNG.
  useEffect(() => {
    registerBeforeNext(async () => {
      const opt = parsedRef.current;
      if (!opt) return false;
      const img = await renderChartImage(opt, chart.width, chart.height);
      resultRef.current.chartImages.set(chart.id, img);
      return true;
    });
  }, [chart, registerBeforeNext, resultRef]);

  // ECharts preview (active only).
  useEffect(() => {
    if (!active || !parsedOption || !previewRef.current) {
      chartInstRef.current?.dispose();
      chartInstRef.current = null;
      return;
    }
    let cancelled = false;
    import("echarts").then((echarts) => {
      if (cancelled || !previewRef.current) return;
      chartInstRef.current?.dispose();
      const inst = echarts.init(previewRef.current);
      inst.setOption(parsedOption);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chartInstRef.current = inst as any;
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, JSON.stringify(parsedOption)]);

  useEffect(() => () => { chartInstRef.current?.dispose(); }, []);

  function applyJson(text: string) {
    setJsonText(text);
    if (!text.trim()) { setJsonError(null); setParsedOption(null); return; }
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      setJsonError(null);
      setParsedOption(parsed);
    } catch {
      setJsonError("Invalid JSON \u2014 fix before proceeding");
      setParsedOption(null);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    applyJson(await file.text());
    e.target.value = "";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="step-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>ECharts option required</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
          <MetaChip label="Size" value={`${chart.width} \u00d7 ${chart.height} pt`} />
          <MetaChip label="Status" value={isPreConfigured ? "Pre-configured" : "Blank \u2014 option required"} highlight={!isPreConfigured} />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Editor */}
        <div className="editor-pane">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>ECharts Option JSON</span>
            <button onClick={() => fileRef.current!.click()} className="modal-btn-ghost">{"\u2B06"} Upload JSON</button>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
              onChange={(e) => { void handleFileUpload(e); }} />
          </div>
          <textarea value={jsonText} onChange={(e) => applyJson(e.target.value)} spellCheck={false}
            placeholder={'{\n  "xAxis": { "type": "category", "data": ["A","B","C"] },\n  "yAxis": { "type": "value" },\n  "series": [{ "type": "bar", "data": [1, 2, 3] }]\n}'}
            className="modal-textarea" style={{ borderColor: jsonError ? "#EF4444" : "#E2E8F0" }} />
          <div style={{ marginTop: 4, minHeight: 16 }}>
            {jsonError
              ? <span style={{ color: "#EF4444", fontSize: 11 }}>{jsonError}</span>
              : <span style={{ color: "#94A3B8", fontSize: 10 }}>Paste an ECharts option object or upload a .json file.</span>}
          </div>
        </div>
        {/* Preview */}
        <div className="preview-pane">
          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Preview</div>
          {parsedOption ? (
            <div ref={previewRef} style={{ flex: 1, border: "1px solid #E2E8F0", borderRadius: 4, background: "#fff", minHeight: 0 }} />
          ) : (
            <div className="empty-preview">Enter valid JSON or upload a file to preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
