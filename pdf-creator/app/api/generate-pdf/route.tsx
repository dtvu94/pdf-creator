/**
 * POST /api/generate-pdf
 *
 * Accepts a multipart/form-data request and returns a PDF file.
 *
 * ── Fields ───────────────────────────────────────────────────────────────────
 *
 *  template      (required)  Template JSON — either a .json File or a raw JSON
 *                            string. Same schema as the editor's Save JSON output.
 *
 *  placeholders  (optional)  Placeholder values — a .json File or raw JSON string
 *                            with the shape { "key": "value", ... }.
 *                            Replaces every {{key}} token in the template.
 *
 *  csv           (optional)  One or more CSV / TSV Files for Auto CSV tables.
 *                            Files are matched to auto tables in the order they
 *                            appear in the template. The first row of each file
 *                            is treated as headers (ignored); subsequent rows
 *                            become the table data rows.
 *
 *  metadata      (optional)  PDF metadata — a .json File or raw JSON string
 *                            with shape { fileName, title, author, subject,
 *                            keywords, creator, producer, creationDate,
 *                            modificationDate }. All fields are optional.
 *
 * ── Example (curl) ───────────────────────────────────────────────────────────
 *
 *  # With placeholder values and a CSV for an auto table:
 *  curl -X POST http://localhost:3000/api/generate-pdf \
 *    -F "template=@template.json" \
 *    -F "placeholders=@values.json" \
 *    -F "csv=@employees.csv" \
 *    -o output.pdf
 *
 *  # Template only (no dynamic data):
 *  curl -X POST http://localhost:3000/api/generate-pdf \
 *    -F "template=@template.json" \
 *    -o output.pdf
 *
 * ── Response ─────────────────────────────────────────────────────────────────
 *
 *  200 application/pdf        PDF binary
 *  400 application/json       { error: string }  — bad request / parse failure
 *  500 application/json       { error: string }  — PDF generation failure
 */

import { renderToBuffer } from "@react-pdf/renderer";
import type { Template, PdfMetadata } from "@/types/template";
import { applyValues, applyAutoRows, collectAutoTables } from "@/lib/placeholders";
import { parseTableData } from "@/lib/utils";
import { PdfDocument } from "@/lib/serverPdfRenderer";
import { convertTemplateImages } from "@/lib/serverImageConvert";
import { renderCharts } from "@/lib/serverChartRenderer";
import { registerFontsServer } from "@/lib/fontRegistry.server";
import { convertToPdfA, encryptPdf, signPdf, type PdfAOptions } from "@/lib/pdfaService";

export async function POST(request: Request): Promise<Response> {
  // ── 1. Parse multipart form data ──────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error(400, "Request must be multipart/form-data.");
  }

  // ── 2. Parse template ─────────────────────────────────────────────────────
  const templateField = formData.get("template");
  if (!templateField) return error(400, 'Missing required field "template".');

  let template: Template;
  try {
    const raw =
      templateField instanceof File
        ? await templateField.text()
        : String(templateField);
    template = JSON.parse(raw) as Template;
  } catch {
    return error(400, 'Field "template" is not valid JSON.');
  }

  if (!template.pages || !Array.isArray(template.pages)) {
    return error(400, 'Field "template" must be a valid PDF Creator template (missing "pages").');
  }

  // ── 3. Parse placeholder values (optional) ────────────────────────────────
  let placeholderValues: Record<string, string> = {};
  const placeholdersField = formData.get("placeholders");
  if (placeholdersField) {
    try {
      const raw =
        placeholdersField instanceof File
          ? await placeholdersField.text()
          : String(placeholdersField);
      placeholderValues = JSON.parse(raw) as Record<string, string>;
    } catch {
      return error(400, 'Field "placeholders" is not valid JSON.');
    }
  }

  // ── 4. Parse CSV files for auto tables (optional) ─────────────────────────
  const csvFields = formData.getAll("csv");
  const autoTables = collectAutoTables(template);
  const rowsById = new Map<string, string[][]>();

  for (let i = 0; i < Math.min(csvFields.length, autoTables.length); i++) {
    const csvField = csvFields[i];
    try {
      const raw =
        csvField instanceof File ? await csvField.text() : String(csvField);
      const { rows } = parseTableData(raw);
      rowsById.set(autoTables[i].id, rows);
    } catch {
      return error(400, `Could not parse CSV file at index ${i}.`);
    }
  }

  // ── 4b. Parse metadata (optional) ──────────────────────────────────────────
  let metadata: PdfMetadata | undefined;
  const metadataField = formData.get("metadata");
  if (metadataField) {
    try {
      const raw =
        metadataField instanceof File
          ? await metadataField.text()
          : String(metadataField);
      metadata = JSON.parse(raw) as PdfMetadata;
    } catch {
      return error(400, 'Field "metadata" is not valid JSON.');
    }
  }

  // ── 4c. Parse password (optional) ───────────────────────────────────────────
  const passwordField = formData.get("password");
  const password = passwordField ? String(passwordField) : undefined;

  // ── 4d. Parse PDF/A settings (optional) ────────────────────────────────────
  let pdfASettings: PdfAOptions | undefined;
  const pdfaField = formData.get("pdfa");
  if (pdfaField) {
    try {
      const raw = pdfaField instanceof File ? await pdfaField.text() : String(pdfaField);
      pdfASettings = JSON.parse(raw) as PdfAOptions;
    } catch {
      return error(400, 'Field "pdfa" is not valid JSON.');
    }
  }

  // ── 4e. Parse digital signature settings (optional) ─────────────────────────
  let signatureSettings: { keystoreBase64: string; keystorePassword: string; reason?: string; location?: string; contactInfo?: string } | undefined;
  const signatureField = formData.get("signature");
  if (signatureField) {
    try {
      const raw = signatureField instanceof File ? await signatureField.text() : String(signatureField);
      signatureSettings = JSON.parse(raw);
    } catch {
      return error(400, 'Field "signature" is not valid JSON.');
    }
  }

  // ── 5. Apply data to template ─────────────────────────────────────────────
  let resolved = applyValues(template, placeholderValues);
  resolved = applyAutoRows(resolved, rowsById);
  resolved = await convertTemplateImages(resolved);

  // ── 5a. Render charts server-side ─────────────────────────────────────────
  //    Charts that already have a renderedImage (from browser export) are
  //    left untouched. Only charts with an ECharts option but no image are
  //    rendered here. This enables API-only callers to get chart output
  //    without a browser.
  resolved = await renderCharts(resolved);

  // ── 5b. Validate fonts — return 400 with missing list so the client can ───
  //        show the upload modal before retrying.
  const missingFonts = registerFontsServer(resolved.fonts);
  if (missingFonts.length > 0) {
    return Response.json(
      { error: "missing_fonts", missingFonts },
      { status: 400 }
    );
  }

  // ── 6. Render PDF ─────────────────────────────────────────────────────────
  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(<PdfDocument template={resolved} metadata={metadata} />);
  } catch (e) {
    console.error("[generate-pdf] renderToBuffer failed:", e);
    return error(500, "PDF generation failed. Check that your template is valid.");
  }

  // ── 7. Convert to PDF/A (optional) ─────────────────────────────────────────
  if (pdfASettings) {
    try {
      buffer = await convertToPdfA(buffer, {
        ...pdfASettings,
        title: metadata?.title,
        author: metadata?.author,
      });
    } catch (e) {
      console.error("[generate-pdf] PDF/A conversion failed:", e);
      return error(500, `PDF/A conversion failed: ${e instanceof Error ? e.message : "Unknown error"}. Is the pdfa-generator service running?`);
    }
  }

  // ── 8. Digitally sign (optional) ──────────────────────────────────────────
  //    Signing must happen after PDF/A but before encryption.
  if (signatureSettings) {
    try {
      buffer = await signPdf(buffer, {
        keystore: Buffer.from(signatureSettings.keystoreBase64, "base64"),
        keystorePassword: signatureSettings.keystorePassword,
        reason: signatureSettings.reason,
        location: signatureSettings.location,
        contactInfo: signatureSettings.contactInfo,
      });
    } catch (e) {
      console.error("[generate-pdf] PDF signing failed:", e);
      return error(500, `PDF signing failed: ${e instanceof Error ? e.message : "Unknown error"}. Is the pdfa-generator service running?`);
    }
  }

  // ── 9. Encrypt PDF with password (optional) ──────────────────────────────
  //    Note: encryption is incompatible with PDF/A compliance.
  if (password) {
    try {
      buffer = await encryptPdf(buffer, { userPassword: password });
    } catch (e) {
      console.error("[generate-pdf] PDF encryption failed:", e);
      return error(500, `PDF encryption failed: ${e instanceof Error ? e.message : "Unknown error"}. Is the pdfa-generator service running?`);
    }
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${metadata?.fileName || "output.pdf"}"`,
      "Content-Length": String(buffer.length),
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function error(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}
