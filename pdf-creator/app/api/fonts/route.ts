/**
 * POST /api/fonts
 * Upload a custom font face and store it in /tmp/pdf-creator-fonts/.
 *
 * Fields (multipart/form-data):
 *   family  — font family name, e.g. "My Font"
 *   weight  — "normal" | "bold"
 *   style   — "normal" | "italic"
 *   file    — the font file (.ttf | .otf)
 *
 * Returns: { ref: string }
 *   `ref` is the deterministic ID used in FontFace.ref — it is stable so that
 *   re-uploading the same face does not require updating the template.
 */

import fs   from "fs";
import path from "path";

const UPLOAD_DIR   = "/tmp/pdf-creator-fonts";
const ALLOWED_EXTS = new Set([".ttf", ".otf"]);

function fontRef(family: string, weight: string, style: string): string {
  return `${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${weight}-${style}`;
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error(400, "Request must be multipart/form-data.");
  }

  const family = formData.get("family");
  const weight = formData.get("weight");
  const style  = formData.get("style");
  const file   = formData.get("file");

  if (!family || !weight || !style || !file) {
    return error(400, "Required fields: family, weight, style, file.");
  }
  if (weight !== "normal" && weight !== "bold") {
    return error(400, 'weight must be "normal" or "bold".');
  }
  if (style !== "normal" && style !== "italic") {
    return error(400, 'style must be "normal" or "italic".');
  }
  if (!(file instanceof File)) {
    return error(400, "file must be a file upload.");
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) {
    return error(400, `Unsupported font format "${ext}". Use: ${[...ALLOWED_EXTS].join(", ")}`);
  }

  const ref      = fontRef(String(family), String(weight), String(style));
  const filename = `${ref}${ext}`;

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // Remove any previous file for this ref (different extension).
  try {
    const existing = fs.readdirSync(UPLOAD_DIR).filter((e) => e.startsWith(ref + "."));
    for (const old of existing) fs.unlinkSync(path.join(UPLOAD_DIR, old));
  } catch { /* ignore */ }

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

  return Response.json({ ref });
}

function error(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}
