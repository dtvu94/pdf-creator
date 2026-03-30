/**
 * GET /api/fonts/[id]
 * Serve an uploaded font file from /tmp/pdf-creator-fonts/.
 * react-pdf (client-side) fetches this URL when registering an uploaded font.
 */

import fs   from "fs";
import path from "path";

const UPLOAD_DIR = "/tmp/pdf-creator-fonts";

const MIME: Record<string, string> = {
  ".ttf":   "font/ttf",
  ".otf":   "font/otf",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  // The stored filename is `{id}{ext}` — find it regardless of extension.
  let filename: string | undefined;
  try {
    filename = fs.readdirSync(UPLOAD_DIR).find(
      (e) => e === id || e.startsWith(id + ".")
    );
  } catch { /* dir does not exist */ }

  if (!filename) {
    return Response.json({ error: "Font not found." }, { status: 404 });
  }

  const ext      = path.extname(filename).toLowerCase();
  const filePath = path.join(UPLOAD_DIR, filename);
  const buffer   = fs.readFileSync(filePath);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":  MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
