"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartElement } from "@/types/template";
import Field from "./Field";

type ChartSectionProps = {
  el: ChartElement;
  set: (key: string, value: unknown) => void;
};

const PANEL_W = 260;

function ChartPreviewScaled({
  containerRef,
  width,
  height,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
}) {
  const scale = PANEL_W / width;
  return (
    <div className="chart-preview-container" style={{ height: height * scale }}>
      <div
        ref={containerRef}
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

export default function ChartSection({ el, set }: Readonly<ChartSectionProps>) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(el.option, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<{ dispose: () => void } | null>(null);

  // Keep textarea in sync when element changes externally (e.g. undo / load JSON).
  useEffect(() => {
    setJsonText(JSON.stringify(el.option, null, 2));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el.id]);

  // Live ECharts preview inside the panel.
  useEffect(() => {
    if (!containerRef.current || Object.keys(el.option).length === 0) {
      chartRef.current?.dispose();
      chartRef.current = null;
      return;
    }

    let cancelled = false;
    import("echarts").then((echarts) => {
      if (cancelled || !containerRef.current) return;
      if (chartRef.current) {
        chartRef.current.dispose();
      }
      // Init at full PDF dimensions so font sizes / grid padding render correctly.
      const chart = echarts.init(containerRef.current, null, { width: el.width, height: el.height });
      chart.setOption(el.option);
      chartRef.current = chart;
    });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(el.option)]);

  // Dispose on unmount.
  useEffect(() => () => { chartRef.current?.dispose(); }, []);

  function handleJsonChange(text: string) {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      setJsonError(null);
      set("option", parsed);
    } catch {
      setJsonError("Invalid JSON");
    }
  }

  const hasOption = Object.keys(el.option).length > 0;

  return (
    <div className="section-card">
      <div className="section-title">Chart (ECharts option)</div>

      {/* Live preview — render at full PDF size, CSS-scaled to fit the panel */}
      {hasOption ? (
        <ChartPreviewScaled containerRef={containerRef} width={el.width} height={el.height} />
      ) : (
        <div className="chart-empty">
          No option configured — chart will be required at export
        </div>
      )}

      {/* JSON editor */}
      <Field label="ECharts Option (JSON)">
        <textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={10}
          spellCheck={false}
          className="chart-textarea"
          style={{
            borderColor: jsonError ? "#EF4444" : undefined,
          }}
        />
        {jsonError && (
          <div className="chart-error">{jsonError}</div>
        )}
        <div style={{ color: "#94A3B8", fontSize: 10, marginTop: 4 }}>
          Paste any{" "}
          <a
            href="https://echarts.apache.org/en/option.html"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#3B82F6" }}
          >
            ECharts option
          </a>
          . Leave empty to require input at export time.
        </div>
      </Field>
    </div>
  );
}
