/**
 * POST /api/fonts/status
 * Check which uploaded font refs still exist on disk.
 *
 * Body: { refs: string[] }
 * Returns: { missing: string[] }
 */

import fs   from "fs";

const UPLOAD_DIR = "/tmp/pdf-creator-fonts";

export async function POST(request: Request): Promise<Response> {
  let body: { refs?: string[] };
  try {
    body = (await request.json()) as { refs?: string[] };
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const refs = body.refs ?? [];
  const missing: string[] = [];

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(UPLOAD_DIR);
  } catch { /* dir doesn't exist — all uploaded fonts are missing */ }

  for (const ref of refs) {
    const found = entries.some((e) => e === ref || e.startsWith(ref + "."));
    if (!found) missing.push(ref);
  }

  return Response.json({ missing });
}
