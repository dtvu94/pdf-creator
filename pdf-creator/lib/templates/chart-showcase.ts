import type { Template, ChartElement } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";

// ─── Layout constants ─────────────────────────────────────────────────────────
//  A4 body (header 70 + footer 40) = 842 − 110 = 732 pt
//  Per-page: heading y=8, description y=30, divider y=52,
//            chart-label y=62, chart1 y=72 (h=248), divider y=328,
//            chart-label y=336, chart2 y=346 (h=248) → total 594 ✓

const CW = 515;
const CH = 248;

function chart(x: number, y: number, option: Record<string, unknown>, w = CW, h = CH): ChartElement {
  return { id: makeId(), type: "chart", x, y, width: w, height: h, option };
}

// ─── Pre-configured options — structure only, NO series data ─────────────────
//  Series data is intentionally empty. Upload a data file at export time.
//  Sample files: public/samples/chart-showcase/<chart-name>-data.json

const VERTICAL_BAR_OPTION: Record<string, unknown> = {
  title: {
    text: "Quarterly Production — 2023 vs 2024 (units)",
    textStyle: { fontSize: 12, color: "#1E293B", fontWeight: "bold" },
  },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  // Legend top-right avoids collision with x-axis labels
  legend: { data: ["2023", "2024"], right: 8, top: 8, textStyle: { fontSize: 10 } },
  grid: { left: 56, right: 16, top: 52, bottom: 36 },
  xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"], axisTick: { alignWithLabel: true } },
  yAxis: { type: "value", name: "Units", nameTextStyle: { color: "#94A3B8", fontSize: 10 } },
  series: [
    { name: "2023", type: "bar", barGap: "6%", data: [12400, 15800, 14200, 17600], itemStyle: { color: "#6366F1" }, label: { show: true, position: "top", fontSize: 9, color: "#374151" } },
    { name: "2024", type: "bar",               data: [14100, 17300, 16800, 21200], itemStyle: { color: "#F59E0B" }, label: { show: true, position: "top", fontSize: 9, color: "#374151" } },
  ],
};

const HORIZONTAL_BAR_OPTION: Record<string, unknown> = {
  title: {
    text: "Revenue by Market, H1 vs H2 2024 ($M)",
    textStyle: { fontSize: 12, color: "#1E293B", fontWeight: "bold" },
  },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  legend: { data: ["H1", "H2"], right: 8, top: 8, textStyle: { fontSize: 10 } },
  grid: { left: 120, right: 60, top: 52, bottom: 28 },
  xAxis: { type: "value", name: "$M", nameTextStyle: { color: "#94A3B8", fontSize: 10 } },
  yAxis: {
    type: "category",
    data: ["Middle East", "Latin America", "EMEA", "APAC", "North America"],
    axisLabel: { fontSize: 10 },
  },
  series: [
    { name: "H1", type: "bar", data: [18.4, 24.7, 53.2, 76.5, 112.8], itemStyle: { color: "#3B82F6" }, label: { show: true, position: "right", fontSize: 9 } },
    { name: "H2", type: "bar", data: [21.3, 28.1, 61.4, 89.2, 128.6], itemStyle: { color: "#10B981" }, label: { show: true, position: "right", fontSize: 9 } },
  ],
};

const LINE_OPTION: Record<string, unknown> = {
  title: {
    text: "Monthly Temperature Trend (°C)",
    textStyle: { fontSize: 12, color: "#1E293B", fontWeight: "bold" },
  },
  tooltip: { trigger: "axis" },
  legend: { data: ["Zone A", "Zone B"], right: 8, top: 8, textStyle: { fontSize: 10 } },
  grid: { left: 50, right: 20, top: 52, bottom: 36 },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  yAxis: { type: "value", name: "°C", nameTextStyle: { color: "#94A3B8", fontSize: 10 } },
  series: [
    { name: "Zone A", type: "line", smooth: true, data: [4.2, 5.8, 10.1, 15.4, 20.7, 25.3, 28.6, 27.9, 23.2, 17.5, 10.8, 6.1], itemStyle: { color: "#3B82F6" }, areaStyle: { color: "#3B82F6", opacity: 0.08 }, symbol: "circle", symbolSize: 5 },
    { name: "Zone B", type: "line", smooth: true, data: [7.5, 9.2, 13.8, 18.6, 23.4, 28.1, 31.4, 30.8, 26.3, 20.1, 13.9, 9.2], itemStyle: { color: "#10B981" }, areaStyle: { color: "#10B981", opacity: 0.08 }, symbol: "circle", symbolSize: 5 },
  ],
};

const PIE_OPTION: Record<string, unknown> = {
  title: {
    text: "Website Traffic Sources",
    left: "center",
    textStyle: { fontSize: 12, color: "#1E293B", fontWeight: "bold" },
  },
  tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
  legend: { orient: "vertical", left: 16, top: "middle", textStyle: { fontSize: 10, color: "#374151" }, itemGap: 10 },
  series: [
    {
      type: "pie",
      radius: ["36%", "68%"],
      center: ["60%", "54%"],
      data: [
        { name: "Organic Search", value: 4821 },
        { name: "Direct",         value: 2934 },
        { name: "Referral",       value: 1872 },
        { name: "Social Media",   value: 1563 },
        { name: "Email",          value: 847  },
        { name: "Paid Ads",       value: 612  },
      ],
      label: { show: true, position: "inside", formatter: "{d}%", fontSize: 10, fontWeight: "bold", color: "#fff" },
      labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 6 },
    },
  ],
};

// ─── Shared header / footer ───────────────────────────────────────────────────

function pageHeader() {
  return {
    height: 70,
    elements: [
      { id: makeId(), type: "heading" as const, x: 40, y: 14, content: "Chart Showcase — Data Visualisation Report", fontSize: 17, bold: true, italic: false, underline: false, color: "#1E293B", width: 440 },
      { id: makeId(), type: "text" as const, x: 40, y: 46, content: "Report date: {{report_date}}  ·  Prepared by: {{author}}  ·  Page {{page_number}} of {{total_pages}}", fontSize: 9, bold: false, italic: false, underline: false, color: "#64748B", width: 515 },
      { id: makeId(), type: "divider" as const, x: 40, y: 63, color: "#3B82F6", width: 515, thickness: 2 },
    ],
  };
}

function pageFooter(note: string) {
  return {
    height: 40,
    elements: [
      { id: makeId(), type: "divider" as const, x: 40, y: 0, color: "#E2E8F0", width: 515, thickness: 1 },
      { id: makeId(), type: "text" as const, x: 40, y: 12, content: note, fontSize: 8, bold: false, italic: true, underline: false, color: "#94A3B8", width: 515 },
    ],
  };
}

function chartLabel(x: number, y: number, text: string, color: string) {
  return { id: makeId(), type: "text" as const, x, y, content: text, fontSize: 8, bold: true, italic: false, underline: false, color, width: 515 };
}

// ─── Template ─────────────────────────────────────────────────────────────────

export const CHART_SHOWCASE_TEMPLATE: Template = {
  name: "Chart Showcase",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [
    // ── Page 1: Vertical Bar + Horizontal Bar ─────────────────────────────────
    {
      id: makeId(),
      header: pageHeader(),
      footer: pageFooter("Default data is pre-filled. Override at export time via public/samples/chart-showcase/vertical-bar-chart-data.json or horizontal-bar-chart-data.json"),
      elements: [
        { id: makeId(), type: "heading", x: 40, y: 8, content: "Page 1 — Bar Charts", fontSize: 13, bold: true, italic: false, underline: false, color: "#6366F1", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 30, content: "Each chart below requires a data file upload at export time. The chart structure (axes, colours, labels) is already configured.", fontSize: 9, bold: false, italic: false, underline: false, color: "#64748B", width: 515 },
        { id: makeId(), type: "divider", x: 40, y: 50, color: "#E2E8F0", width: 515, thickness: 1 },

        chartLabel(40, 60, "VERTICAL BAR CHART  ·  pre-filled data  ·  override at export via public/samples/chart-showcase/vertical-bar-chart-data.json", "#6366F1"),
        chart(40, 72, VERTICAL_BAR_OPTION),

        { id: makeId(), type: "divider", x: 40, y: 328, color: "#E2E8F0", width: 515, thickness: 1 },
        chartLabel(40, 336, "HORIZONTAL BAR CHART  ·  pre-filled data  ·  override at export via public/samples/chart-showcase/horizontal-bar-chart-data.json", "#3B82F6"),
        chart(40, 346, HORIZONTAL_BAR_OPTION),
      ],
    },

    // ── Page 2: Line + Pie ────────────────────────────────────────────────────
    {
      id: makeId(),
      header: pageHeader(),
      footer: pageFooter("Default data is pre-filled. Override at export time via public/samples/chart-showcase/line-chart-data.json or pie-chart-data.json"),
      elements: [
        { id: makeId(), type: "heading", x: 40, y: 8, content: "Page 2 — Line & Pie Charts", fontSize: 13, bold: true, italic: false, underline: false, color: "#0EA5E9", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 30, content: "Each chart below requires a data file upload at export time. The chart structure (axes, colours, labels) is already configured.", fontSize: 9, bold: false, italic: false, underline: false, color: "#64748B", width: 515 },
        { id: makeId(), type: "divider", x: 40, y: 50, color: "#E2E8F0", width: 515, thickness: 1 },

        chartLabel(40, 60, "LINE CHART  ·  pre-filled data  ·  override at export via public/samples/chart-showcase/line-chart-data.json", "#3B82F6"),
        chart(40, 72, LINE_OPTION),

        { id: makeId(), type: "divider", x: 40, y: 328, color: "#E2E8F0", width: 515, thickness: 1 },
        chartLabel(40, 336, "PIE / DONUT CHART  ·  pre-filled data  ·  override at export via public/samples/chart-showcase/pie-chart-data.json", "#10B981"),
        chart(40, 346, PIE_OPTION),
      ],
    },

    // ── Page 3: Scatter + Heatmap (fully blank) ───────────────────────────────
    {
      id: makeId(),
      header: pageHeader(),
      footer: pageFooter("Fully blank charts — provide a complete ECharts option JSON at export time."),
      elements: [
        { id: makeId(), type: "heading", x: 40, y: 8, content: "Page 3 — Charts Configured at Export", fontSize: 13, bold: true, italic: false, underline: false, color: "#F59E0B", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 30, content: "These charts have no pre-set structure. Provide a complete ECharts option JSON at export — use the sample files as a starting point.", fontSize: 9, bold: false, italic: false, underline: false, color: "#64748B", width: 515 },
        { id: makeId(), type: "divider", x: 40, y: 50, color: "#E2E8F0", width: 515, thickness: 1 },

        chartLabel(40, 60, "SCATTER CHART  ·  full option required at export  ·  see public/samples/chart-showcase/scatter-chart-option.json", "#F59E0B"),
        chart(40, 72, {}),

        { id: makeId(), type: "divider", x: 40, y: 328, color: "#E2E8F0", width: 515, thickness: 1 },
        chartLabel(40, 336, "HEATMAP CHART  ·  full option required at export  ·  see public/samples/chart-showcase/heatmap-chart-option.json", "#EF4444"),
        chart(40, 346, {}),
      ],
    },
  ],
  styles: { primaryColor: "#3B82F6" },
};
