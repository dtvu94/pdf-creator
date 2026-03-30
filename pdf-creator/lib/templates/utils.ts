import type {
  TemplateElement,
  TemplateFont,
  TextElement,
  DividerElement,
  TableElement,
  ImageElement,
  CardElement,
  ChartElement,
  RepeaterElement,
  ShapeElement,
  LinkElement,
  PageSize,
} from "@/types/template";

export const makeId = (): string => Math.random().toString(36).slice(2, 9);

// ─── Sample logo (PNG, base64-encoded) ───────────────────────────────────────

export const SAMPLE_LOGO_SRC = "data:image/png;base64,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";

export const A4_W = 595;
export const A4_H = 842;
export const CANVAS_SCALE = 0.75;

// ─── Page dimensions (in PDF points, portrait) ───────────────────────────────

export const PAGE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  A5: { width: 420, height: 595 },
};

export function getPageDimensions(size?: PageSize): { width: number; height: number } {
  return PAGE_DIMENSIONS[size ?? "A4"];
}

// ─── Bundled fonts (files live in public/fonts/) ─────────────────────────────

function bundledFamily(family: string, prefix: string): TemplateFont {
  return {
    family,
    faces: [
      { weight: "normal", style: "normal", source: "bundled", ref: `${prefix}-Regular.ttf` },
      { weight: "bold",   style: "normal", source: "bundled", ref: `${prefix}-Bold.ttf`    },
      { weight: "normal", style: "italic", source: "bundled", ref: `${prefix}-Italic.ttf`  },
      { weight: "bold",   style: "italic", source: "bundled", ref: `${prefix}-BoldItalic.ttf` },
    ],
  };
}

export const BUNDLED_FONTS: TemplateFont[] = [
  bundledFamily("Open Sans", "OpenSans"),
  bundledFamily("Roboto",    "Roboto"),
  bundledFamily("Calibri",   "Calibri"),
  bundledFamily("Lato",      "Lato"),
  bundledFamily("Inter",     "Inter"),
  bundledFamily("Verdana",   "Verdana"),
  // Arial uses Calibri TTFs (metrically similar sans-serif) so all fonts are embedded.
  // This avoids the built-in Helvetica which is never embedded — breaking PDF/A.
  bundledFamily("Arial",     "Calibri"),
  // Times New Roman uses Liberation Serif TTFs (metrically compatible serif).
  bundledFamily("Times New Roman", "TimesNewRoman"),
  // Georgia uses Noto Serif TTFs (visually similar serif).
  bundledFamily("Georgia",   "Georgia"),
];

/** All font family names available in the font selector, in display order. */
export const SUPPORTED_FONT_FAMILIES = [
  "Open Sans",
  "Roboto",
  "Calibri",
  "Arial",
  "Verdana",
  "Lato",
  "Inter",
  "Times New Roman",
  "Georgia",
] as const;

export const DEFAULT_FONT_FAMILY = "Roboto";

// ─── Element factory ──────────────────────────────────────────────────────────

export function createElement(
  type: TemplateElement["type"],
  yOffset = 50
): TemplateElement {
  const base = { id: makeId(), x: 40, y: yOffset };

  switch (type) {
    case "heading":
      return {
        ...base,
        type: "heading",
        content: "New Heading",
        fontSize: 24,
        bold: true,
        italic: false,
        underline: false,
        color: "#1E40AF",
        width: 420,
      } satisfies TextElement;

    case "text":
      return {
        ...base,
        type: "text",
        content: "New text block. Click to edit.",
        fontSize: 12,
        bold: false,
        italic: false,
        underline: false,
        color: "#374151",
        width: 420,
      } satisfies TextElement;

    case "link":
      return {
        ...base,
        type: "link",
        content: "Click here",
        href: "https://",
        fontSize: 12,
        color: "#2563EB",
        width: 200,
        underline: true,
      } satisfies LinkElement;

    case "table":
      return {
        ...base,
        type: "table",
        mode: "manual",
        headers: ["Column 1", "Column 2", "Column 3"],
        rows: [
          ["Cell A", "Cell B", "Cell C"],
          ["Cell D", "Cell E", "Cell F"],
        ],
        headerColor: "#1E40AF",
        headerTextColor: "#ffffff",
        fontSize: 11,
        width: 515,
      } satisfies TableElement;

    case "divider":
      return {
        ...base,
        type: "divider",
        color: "#CBD5E1",
        width: 515,
        thickness: 1,
      } satisfies DividerElement;

    case "image":
      return {
        ...base,
        type: "image",
        label: "Image",
        width: 200,
        height: 120,
        bgColor: "#DBEAFE",
      } satisfies ImageElement;

    case "card":
      return {
        ...base,
        type: "card",
        title: "Sensor Name",
        value: "0.0",
        unit: "unit",
        subtitle: "Status: Normal",
        accentColor: "#3B82F6",
        bgColor: "#FFFFFF",
        borderColor: "#DBEAFE",
        width: 250,
        height: 105,
      } satisfies CardElement;

    case "chart":
      return {
        ...base,
        type: "chart",
        width: 400,
        height: 250,
        option: {},
      } satisfies ChartElement;

    case "shape":
      return {
        ...base,
        type: "shape",
        shapeType: "rectangle",
        width: 200,
        height: 120,
        fillColor: "#DBEAFE",
        strokeColor: "#3B82F6",
        strokeWidth: 2,
        borderRadius: 8,
      } satisfies ShapeElement;

    case "repeater": {
      return {
        ...base,
        type: "repeater",
        label: "Sensor Group",
        dataKey: "sensor_group",
        width: 515,
        cardWidth: 515,
        cardHeight: 360,
        itemsPerRow: 1,
        gap: 12,
        cardElements: [
          {
            id: makeId(), x: 10, y: 10, type: "heading",
            content: "{{name}}", fontSize: 13, bold: true,
            italic: false, underline: false, color: "#1E40AF", width: 495,
          },
          {
            id: makeId(), x: 10, y: 32, type: "card",
            title: "{{metric}}", value: "{{value}}", unit: "{{unit}}",
            subtitle: "{{status}}", accentColor: "#3B82F6", bgColor: "#FFFFFF",
            borderColor: "#DBEAFE", width: 495, height: 80,
          },
          {
            id: makeId(), x: 10, y: 120, type: "chart",
            width: 495, height: 120, option: {}, seriesDataField: "chartData",
          },
          {
            id: makeId(), x: 10, y: 248, type: "table",
            headers: ["Period", "Value"], rows: [], headerColor: "#1E40AF",
            headerTextColor: "#fff", fontSize: 9, width: 495, rowsDataField: "tableData",
          },
          {
            id: makeId(), x: 10, y: 330, type: "text",
            content: "vs prev month: {{comparison}}", fontSize: 10, bold: false,
            italic: false, underline: false, color: "#374151", width: 495,
          },
        ],
      } satisfies RepeaterElement;
    }
  }
}
