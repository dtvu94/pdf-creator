import type { Template, TemplateElement } from "@/types/template";
import { makeId, BUNDLED_FONTS, SAMPLE_LOGO_SRC } from "./utils";

// ─── Shared card dimensions ───────────────────────────────────────────────────

const CARD_W = 515;
const CARD_H = 290;

// ─── Default card elements for a sensor repeater ─────────────────────────────

function sensorCardElements(): TemplateElement[] {
  const W = CARD_W - 20; // inner width with 10px padding each side
  return [
    // Sensor name
    {
      id: makeId(), x: 10, y: 10,
      type: "heading",
      content: "{{sensor_name}}",
      fontSize: 12, bold: true, italic: false, underline: false,
      color: "#1E40AF", width: W,
    },
    // Divider under name
    {
      id: makeId(), x: 10, y: 30,
      type: "divider", color: "#DBEAFE", width: W, thickness: 1,
    },
    // Chart – 1 month trend
    {
      id: makeId(), x: 10, y: 38,
      type: "chart",
      width: W, height: 140, option: {}, seriesDataField: "chartData",
    },
    // Monthly average
    {
      id: makeId(), x: 10, y: 188,
      type: "text",
      content: "The monthly average value of {{sensor_name}} is {{average_value}}",
      fontSize: 10, bold: false, italic: false, underline: false,
      color: "#374151", width: W,
    },
    // Lowest reading
    {
      id: makeId(), x: 10, y: 204,
      type: "text",
      content: "The lowest {{sensor_name}} was on {{date}} with {{lowest_value}}",
      fontSize: 10, bold: false, italic: false, underline: false,
      color: "#374151", width: W,
    },
    // Highest reading
    {
      id: makeId(), x: 10, y: 220,
      type: "text",
      content: "The highest {{sensor_name}} was on {{date}} with {{highest_value}}",
      fontSize: 10, bold: false, italic: false, underline: false,
      color: "#374151", width: W,
    },
    // Comparison to previous month
    {
      id: makeId(), x: 10, y: 236,
      type: "text",
      content: "{{sensor_name}} {{change_direction}} by {{percentage}} compared to the previous month.",
      fontSize: 10, bold: false, italic: false, underline: false,
      color: "#374151", width: W,
    },
    // Border decoration
    {
      id: makeId(), x: 10, y: 254,
      type: "divider", color: "#E2E8F0", width: W, thickness: 1,
    },
    // Status label
    {
      id: makeId(), x: 10, y: 262,
      type: "text",
      content: "{{status}}",
      fontSize: 9, bold: false, italic: true, underline: false,
      color: "#64748B", width: W,
    },
  ] satisfies TemplateElement[];
}

// ─── Page header & footer helpers ─────────────────────────────────────────────

function sectionHeader(
  title: string,
  accentColor: string
): NonNullable<import("@/types/template").TemplatePage["header"]> {
  return {
    height: 70,
    elements: [
      {
        id: makeId(), type: "image", x: 475, y: 18,
        label: "Logo", width: 80, height: 38, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC,
      },
      {
        id: makeId(), type: "heading", x: 40, y: 24,
        content: title,
        fontSize: 18, bold: true, italic: false, underline: false,
        color: accentColor, width: 420,
      },
      {
        id: makeId(), type: "divider", x: 40, y: 60,
        color: accentColor, width: 515, thickness: 2,
      },
    ] satisfies TemplateElement[],
  };
}

function reportFooter(): NonNullable<import("@/types/template").TemplatePage["footer"]> {
  return {
    height: 50,
    elements: [
      {
        id: makeId(), type: "divider", x: 40, y: 0,
        color: "#CBD5E1", width: 515, thickness: 1,
      },
      {
        id: makeId(), type: "text", x: 40, y: 10,
        content: "{{report_title}} — {{company_name}} — {{report_period}}",
        fontSize: 8, bold: false, italic: false, underline: false,
        color: "#94A3B8", width: 460,
      },
      {
        id: makeId(), type: "text", x: 525, y: 10,
        content: "{{page_number}}",
        fontSize: 8, bold: false, italic: false, underline: false,
        color: "#64748B", width: 30,
      },
    ] satisfies TemplateElement[],
  };
}

// ─── Sensor type definitions ──────────────────────────────────────────────────

const SENSOR_TYPES: Array<{ label: string; dataKey: string; unit: string; accentColor: string }> = [
  { label: "Temperature Sensors",  dataKey: "temperature_sensors",  unit: "°C",  accentColor: "#DC2626" },
  { label: "Humidity Sensors",     dataKey: "humidity_sensors",     unit: "%RH", accentColor: "#0891B2" },
  { label: "Pressure Sensors",     dataKey: "pressure_sensors",     unit: "hPa", accentColor: "#7C3AED" },
  { label: "CO₂ Sensors",          dataKey: "co2_sensors",          unit: "ppm", accentColor: "#16A34A" },
  { label: "Motion Sensors",       dataKey: "motion_sensors",       unit: "events", accentColor: "#D97706" },
];

// ─── Template ─────────────────────────────────────────────────────────────────

export const SENSOR_REPORT_TEMPLATE: Template = {
  name: "Monthly Sensor Report",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#1E40AF" },
  pages: [

    // ── Page 1 · Cover ───────────────────────────────────────────────────────
    {
      id: makeId(),
      bookmark: "Cover",
      elements: [
        // Background accent band
        {
          id: makeId(), type: "divider", x: 0, y: 0,
          color: "#1E40AF", width: 595, thickness: 8,
        },
        // Logo
        {
          id: makeId(), type: "image", x: 207, y: 140,
          label: "Company Logo", width: 180, height: 110,
          bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC,
        },
        // Title
        {
          id: makeId(), type: "heading", x: 65, y: 290,
          content: "{{report_title}}",
          fontSize: 30, bold: true, italic: false, underline: false,
          color: "#1E293B", width: 465,
        },
        {
          id: makeId(), type: "text", x: 100, y: 346,
          content: "Monthly Sensor Performance Report",
          fontSize: 14, bold: false, italic: true, underline: false,
          color: "#64748B", width: 395,
        },
        // Divider
        {
          id: makeId(), type: "divider", x: 40, y: 394,
          color: "#CBD5E1", width: 515, thickness: 1,
        },
        // Meta
        {
          id: makeId(), type: "text", x: 100, y: 414,
          content: "Period:        {{report_period}}\nPrepared by:   {{prepared_by}}\nDate:          {{report_date}}",
          fontSize: 12, bold: false, italic: false, underline: false,
          color: "#374151", width: 395,
        },
        // Sensor summary
        {
          id: makeId(), type: "divider", x: 40, y: 510,
          color: "#DBEAFE", width: 515, thickness: 1,
        },
        {
          id: makeId(), type: "text", x: 100, y: 526,
          content: "This report covers 5 sensor categories with 32 sensors each.\nAll readings are based on the most recent 30-day monitoring window.",
          fontSize: 11, bold: false, italic: true, underline: false,
          color: "#475569", width: 395,
        },
        // Footer bar
        {
          id: makeId(), type: "divider", x: 0, y: 834,
          color: "#1E40AF", width: 595, thickness: 8,
        },
        {
          id: makeId(), type: "text", x: 40, y: 800,
          content: "{{company_name}}",
          fontSize: 10, bold: false, italic: false, underline: false,
          color: "#64748B", width: 300,
        },
      ] satisfies TemplateElement[],
    },

    // ── Pages 2–6 · One page per sensor type ─────────────────────────────────
    ...SENSOR_TYPES.map(({ label, dataKey, unit, accentColor }) => ({
      id: makeId(),
      bookmark: label,
      header: sectionHeader(label, accentColor),
      footer: reportFooter(),
      elements: [
        // Section intro text
        {
          id: makeId(), type: "text", x: 40, y: 4,
          content: `${label} — 32 sensors monitored over the past 30 days. Unit: ${unit}. Data key: ${dataKey}.`,
          fontSize: 9, bold: false, italic: false, underline: false,
          color: "#94A3B8", width: 515,
        },
        // Repeater — one card per sensor
        {
          id: makeId(), x: 40, y: 22,
          type: "repeater",
          label,
          dataKey,
          width: 515,
          cardWidth: CARD_W,
          cardHeight: CARD_H,
          itemsPerRow: 1,
          gap: 15,
          cardElements: sensorCardElements(),
        },
      ] satisfies TemplateElement[],
    })),

  ],
};
