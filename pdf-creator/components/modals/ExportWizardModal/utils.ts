import type {
  ChartElement,
  RepeaterElement,
  CardElement,
  TableElement as TblEl,
  ImageElement,
} from "@/types/template";

export function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
          else inQuote = !inQuote;
        } else if (ch === "," && !inQuote) {
          cells.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      cells.push(current.trim());
      return cells;
    });
}

export async function renderChartImage(
  option: Record<string, unknown>,
  width: number,
  height: number,
): Promise<string> {
  const echarts = await import("echarts");
  const container = document.createElement("div");
  container.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${width}px;height:${height}px;`;
  document.body.appendChild(container);
  const instance = echarts.init(container, null, { width, height, renderer: "canvas" });
  instance.setOption({ ...option, animation: false });
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  const dataUrl = instance.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
  instance.dispose();
  container.remove();
  return dataUrl;
}

const PH_RE = /\{\{([^}]+)\}\}/g;

function collectPlaceholderFields(text: string, fields: Set<string>) {
  for (const m of text.matchAll(PH_RE)) fields.add(m[1].trim());
}

function collectTextFields(el: { content: string }, fields: Set<string>) {
  collectPlaceholderFields(el.content, fields);
}

function collectCardFields(el: CardElement, fields: Set<string>) {
  for (const s of [el.title, el.value, el.subtitle]) collectPlaceholderFields(s, fields);
}

function collectTableFields(el: TblEl, fields: Set<string>) {
  for (const h of el.headers) collectPlaceholderFields(h, fields);
  if (el.rowsDataField) fields.add(el.rowsDataField);
}

function collectImageFields(el: ImageElement, fields: Set<string>) {
  collectPlaceholderFields(el.label, fields);
  if (el.srcField) fields.add(el.srcField);
}

export function getExpectedFields(repeater: RepeaterElement): string[] {
  const fields = new Set<string>();
  for (const el of repeater.cardElements) {
    switch (el.type) {
      case "text":
      case "heading":
        collectTextFields(el as { content: string }, fields);
        break;
      case "card":
        collectCardFields(el as CardElement, fields);
        break;
      case "table":
        collectTableFields(el as TblEl, fields);
        break;
      case "image":
        collectImageFields(el as ImageElement, fields);
        break;
    }
  }
  return [...fields];
}

export function buildRepeaterChartOption(
  chartEl: ChartElement,
  rawData: unknown[],
): Record<string, unknown> {
  const baseSeries = Array.isArray((chartEl.option as { series?: unknown[] }).series)
    ? (chartEl.option as { series: Record<string, unknown>[] }).series
    : [];
  const mergedSeries =
    baseSeries.length > 0
      ? baseSeries.map((s, i) => (i === 0 ? { ...s, data: rawData } : s))
      : [
          {
            type: "line", data: rawData, smooth: true, symbol: "none",
            lineStyle: { width: 1.5, color: "#3B82F6" },
            areaStyle: { opacity: 0.08, color: "#3B82F6" },
          },
        ];
  return {
    grid: { left: 8, right: 8, top: 10, bottom: 18 },
    xAxis: {
      type: "category", boundaryGap: false,
      data: rawData.map((_, i) => `D${i + 1}`),
      axisLabel: { fontSize: 7, color: "#94A3B8" },
      axisLine: { show: false }, axisTick: { show: false },
    },
    yAxis: {
      type: "value", scale: true,
      axisLabel: { fontSize: 7, color: "#94A3B8" },
      splitLine: { lineStyle: { type: "dashed", color: "#E2E8F0" } },
    },
    ...chartEl.option,
    series: mergedSeries,
    animation: false,
  };
}
