import type {
  ChartElement,
  TableElement,
  RepeaterElement,
  RepeaterItem,
  TemplateFont,
  PdfMetadata,
} from "@/types/template";

export interface WizardStep {
  id: string;
  label: string;
  type: "fonts" | "placeholders" | "csv" | "chart" | "repeater" | "metadata" | "password" | "pdfa" | "signature";
  missingFonts?: TemplateFont[];
  placeholders?: string[];
  table?: TableElement;
  chart?: ChartElement;
  repeater?: RepeaterElement;
}

export interface PdfASettings {
  /** PDF/A part: 1, 2, or 3 */
  part: number;
  /** Conformance level: "A", "B", or "U" */
  conformance: string;
}

export interface SignatureSettings {
  /** Base64-encoded keystore file */
  keystoreBase64: string;
  /** Keystore password */
  keystorePassword: string;
  /** Reason for signing */
  reason?: string;
  /** Location of signing */
  location?: string;
  /** Signer contact info */
  contactInfo?: string;
}

export interface WizardResult {
  placeholderValues: Record<string, string>;
  resolvedRows: Map<string, string[][]>;
  chartImages: Map<string, string>;
  repeaterItems: Map<string, RepeaterItem[]>;
  metadata?: PdfMetadata;
  password?: string;
  pdfA?: PdfASettings;
  signature?: SignatureSettings;
}
