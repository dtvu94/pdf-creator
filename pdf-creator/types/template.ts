// ─── Page Size & Fonts ────────────────────────────────────────────────────────

export type PageSize = "A4" | "A3" | "A5";

export type FontWeight = "normal" | "bold";
export type FontStyle  = "normal" | "italic";

export interface FontFace {
  weight: FontWeight;
  style:  FontStyle;
  /**
   * "bundled" — file lives in public/fonts/, `ref` is the bare filename
   * "uploaded" — file lives in /tmp/pdf-creator-fonts/, `ref` is the opaque ID
   *              derived as `${family}-${weight}-${style}` (URL-safe, lower-case)
   */
  source: "bundled" | "uploaded";
  ref: string;
}

export interface TemplateFont {
  family: string;
  faces: FontFace[];
}

// ─── Element Types ────────────────────────────────────────────────────────────

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  /** Element opacity 0–1, defaults to 1 when absent. */
  opacity?: number;
  /** Rotation in degrees (clockwise). Defaults to 0 when absent. */
  rotation?: number;
}

export type TextAlign = "left" | "center" | "right" | "justify";

export type ListStyle = "none" | "bullet" | "numbered";

export interface TextElement extends BaseElement {
  type: "text" | "heading";
  content: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  /** Strikethrough text decoration. Defaults to false when absent. */
  strikethrough?: boolean;
  /** Render text as superscript (reduced size, raised). Defaults to false when absent. */
  superscript?: boolean;
  /** Render text as subscript (reduced size, lowered). Defaults to false when absent. */
  subscript?: boolean;
  color: string;
  width: number;
  /** Text alignment — defaults to "left" when absent. */
  textAlign?: TextAlign;
  /** Line height multiplier — defaults to 1.5 when absent. */
  lineHeight?: number;
  /** List style — defaults to "none" when absent. */
  listStyle?: ListStyle;
}

export interface LinkElement extends BaseElement {
  type: "link";
  content: string;
  href: string;
  fontSize: number;
  color: string;
  width: number;
  underline?: boolean;
}

export interface DividerElement extends BaseElement {
  type: "divider";
  color: string;
  width: number;
  thickness: number;
}

export interface TableElement extends BaseElement {
  type: "table";
  /** "manual" = rows edited in panel; "auto" = rows come from CSV uploaded at export time. Defaults to "manual". */
  mode?: "manual" | "auto";
  headers: string[];
  rows: string[][];
  headerColor: string;
  headerTextColor: string;
  fontSize: number;
  width: number;
  /** When inside a RepeaterElement card template, specifies the data field containing per-item table rows as JSON array of arrays. */
  rowsDataField?: string;
}

export interface ImageElement extends BaseElement {
  type: "image";
  label: string;
  width: number;
  height: number;
  bgColor: string;
  src?: string; // base64 or URL for real images
  /** When inside a RepeaterElement card template, specifies the data field containing per-item image URL or base64. */
  srcField?: string;
}

export interface CardElement extends BaseElement {
  type: "card";
  /** Sensor / metric name shown at the top of the card. */
  title: string;
  /** Primary numeric or text value. */
  value: string;
  /** Unit displayed next to the value (e.g. "°C", "%", "kW"). */
  unit: string;
  /** Small descriptive line at the bottom (supports {{placeholders}}). */
  subtitle: string;
  /** Accent colour for the top bar and title text. */
  accentColor: string;
  /** Card background colour. */
  bgColor: string;
  /** Card border colour. */
  borderColor: string;
  width: number;
  height: number;
}

export interface ChartElement extends BaseElement {
  type: "chart";
  width: number;
  height: number;
  /** ECharts option object — https://echarts.apache.org/en/option.html
   *  Leave as {} to require the user to provide the full option at export time. */
  option: Record<string, unknown>;
  /** Transient — populated just before PDF generation, never persisted in the JSON template. */
  renderedImage?: string;
  /** When inside a RepeaterElement card template, specifies the data field containing per-item series data. */
  seriesDataField?: string;
}

export type ShapeType = "rectangle" | "circle" | "line" | "triangle" | "diamond" | "arrow" | "heart";

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: ShapeType;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface RepeaterItem {
  fields: Record<string, string>;
  chartImages?: Record<string, string>;
}

export interface RepeaterElement extends BaseElement {
  type: "repeater";
  label: string;
  dataKey: string;
  width: number;
  cardWidth: number;
  cardHeight: number;
  itemsPerRow: number;
  gap: number;
  cardElements: TemplateElement[];
  items?: RepeaterItem[];
}

export type TemplateElement =
  | TextElement
  | LinkElement
  | DividerElement
  | TableElement
  | ImageElement
  | CardElement
  | ChartElement
  | RepeaterElement
  | ShapeElement;

// ─── Page Sections ────────────────────────────────────────────────────────────

export interface PageSection {
  /** Height of the section in PDF points. */
  height: number;
  /** Elements positioned relative to the section's top-left origin. */
  elements: TemplateElement[];
}

// ─── Page & Template ──────────────────────────────────────────────────────────

export interface TemplatePage {
  id: string;
  /** Body content elements. For pages with header/footer, y is relative to the body area top. */
  elements: TemplateElement[];
  /** Optional header section — rendered as a fixed band at the top of every page. */
  header?: PageSection;
  /** Optional footer section — rendered as a fixed band at the bottom of every page. */
  footer?: PageSection;
  /** Optional bookmark label — appears in the PDF document outline / table of contents. */
  bookmark?: string;
}

export interface TemplateStyles {
  primaryColor: string;
}

/** PDF document metadata — maps to the Document component props in @react-pdf/renderer. */
export interface PdfMetadata {
  fileName?: string;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

/** Watermark overlay rendered on selected pages. */
export interface WatermarkConfig {
  enabled: boolean;
  /** Base64 or URL of the watermark image. */
  src?: string;
  /** Which pages show the watermark: "all" or an array of 1-based page numbers. */
  pages: "all" | number[];
  width: number;
  height: number;
  /** X position in PDF points (from left). */
  x: number;
  /** Y position in PDF points (from top). */
  y: number;
  /** Opacity 0–1. */
  opacity: number;
}

/** Image compression settings applied during PDF generation. */
export interface CompressionConfig {
  /** JPEG quality 1–100 for raster images. Defaults to 90 when absent. */
  imageQuality?: number;
  /** Target DPI for images. 0 = no resampling. Defaults to 0 when absent. */
  imageDpi?: number;
}

export interface Template {
  name: string;
  /** Defaults to "A4" when absent. */
  pageSize?: PageSize;
  /**
   * The selected font family for this template. Defaults to "Roboto" when absent.
   * Must be one of the supported bundled font families or a custom-uploaded family name.
   */
  fontFamily?: string;
  /**
   * Font families used by this template. Defaults to BUNDLED_FONTS when absent.
   * All bundled fonts are always registered; `fontFamily` selects the active one.
   */
  fonts?: TemplateFont[];
  pages: TemplatePage[];
  styles: TemplateStyles;
  /** When true, the metadata wizard step is enabled by default in the editor. */
  includeMetadata?: boolean;
  /** Optional watermark overlay configuration. */
  watermark?: WatermarkConfig;
  /** Optional image compression settings. */
  compression?: CompressionConfig;
}
