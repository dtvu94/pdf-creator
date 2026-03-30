import type { Template, CardElement } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";

interface SensorCardOptions {
  x: number; y: number;
  title: string; value: string; unit: string; subtitle: string;
  accentColor: string; borderColor: string;
}

function sensorCard(opts: SensorCardOptions): CardElement {
  const { x, y, title, value, unit, subtitle, accentColor, borderColor } = opts;
  return {
    id: makeId(), type: "card",
    x, y, width: 250, height: 105,
    title, value, unit, subtitle,
    accentColor, bgColor: "#FFFFFF", borderColor,
  };
}

export const SENSOR_DASHBOARD_TEMPLATE: Template = {
  name: "IoT Sensor Dashboard",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [
    {
      id: makeId(),
      header: {
        height: 80,
        elements: [
          { id: makeId(), type: "heading", x: 40, y: 16, content: "IoT Sensor Dashboard", fontSize: 22, bold: true, italic: false, underline: false, color: "#0C4A6E", width: 420 },
          { id: makeId(), type: "text",    x: 40, y: 50, content: "Station: {{station_name}}  ·  Location: {{location}}  ·  {{date}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#64748B", width: 515 },
          { id: makeId(), type: "divider", x: 40, y: 70, color: "#0EA5E9", width: 515, thickness: 2 },
        ],
      },
      footer: {
        height: 50,
        elements: [
          { id: makeId(), type: "divider", x: 40, y: 0,  color: "#E2E8F0", width: 515, thickness: 1 },
          { id: makeId(), type: "text",    x: 40, y: 12, content: "Last Updated: {{last_updated}}  ·  Alert Level: {{alert_level}}  ·  Operator: {{operator}}", fontSize: 9, bold: false, italic: false, underline: false, color: "#94A3B8", width: 515 },
        ],
      },
      elements: [
        // Row 1
        sensorCard({ x:  40, y:   0, title: "Temperature",          value: "23.5", unit: "°C",  subtitle: "Status: {{temp_status}}  ·  Threshold: {{temp_threshold}}",      accentColor: "#EF4444", borderColor: "#FEE2E2" }),
        sensorCard({ x: 305, y:   0, title: "Humidity",              value: "67.2", unit: "%",   subtitle: "Status: {{humidity_status}}  ·  Range: 40–70 %",                accentColor: "#3B82F6", borderColor: "#DBEAFE" }),
        // Row 2
        sensorCard({ x:  40, y: 115, title: "Atmospheric Pressure",  value: "1013", unit: "hPa", subtitle: "Status: {{pressure_status}}  ·  Trend: Stable",                 accentColor: "#8B5CF6", borderColor: "#EDE9FE" }),
        sensorCard({ x: 305, y: 115, title: "CO\u2082 Concentration",value: "412",  unit: "ppm", subtitle: "Status: {{co2_status}}  ·  Outdoor avg: 415 ppm",              accentColor: "#10B981", borderColor: "#D1FAE5" }),
        // Row 3
        sensorCard({ x:  40, y: 230, title: "Power Consumption",     value: "2.4",  unit: "kW",  subtitle: "Status: {{power_status}}  ·  Peak: {{power_peak}}",             accentColor: "#F59E0B", borderColor: "#FEF3C7" }),
        sensorCard({ x: 305, y: 230, title: "Wind Speed",             value: "12.3", unit: "m/s", subtitle: "Status: {{wind_status}}  ·  Direction: {{wind_dir}}",           accentColor: "#06B6D4", borderColor: "#CFFAFE" }),
        // Row 4
        sensorCard({ x:  40, y: 345, title: "UV Index",               value: "3.2",  unit: "UVI", subtitle: "Level: Low-Medium  ·  Peak hour: {{uv_peak_hour}}",            accentColor: "#F97316", borderColor: "#FFEDD5" }),
        sensorCard({ x: 305, y: 345, title: "Soil Moisture",          value: "54",   unit: "%",   subtitle: "Status: {{moisture_status}}  ·  Field capacity: 60 %",         accentColor: "#84CC16", borderColor: "#ECFCCB" }),
        // Summary
        { id: makeId(), type: "divider", x: 40, y: 462, color: "#E2E8F0", width: 515, thickness: 1 },
        { id: makeId(), type: "heading", x: 40, y: 474, content: "Alert Summary", fontSize: 12, bold: true, italic: false, underline: false, color: "#0C4A6E", width: 300 },
        { id: makeId(), type: "text",    x: 40, y: 496, content: "{{alert_summary}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 515 },
        { id: makeId(), type: "text",    x: 40, y: 550, content: "CO", fontSize: 8, bold: false, italic: false, underline: false, color: "#94A3B8", width: 15 },
        { id: makeId(), type: "text",    x: 52, y: 550, content: "2", fontSize: 8, bold: false, italic: false, underline: false, color: "#94A3B8", width: 10, subscript: true },
        { id: makeId(), type: "text",    x: 59, y: 550, content: "measured as per ISO 16000-26 standard.", fontSize: 8, bold: false, italic: false, underline: false, color: "#94A3B8", width: 250 },
      ],
    },
  ],
  styles: { primaryColor: "#0EA5E9" },
};
