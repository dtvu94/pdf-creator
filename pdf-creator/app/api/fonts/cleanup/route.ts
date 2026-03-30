/**
 * POST /api/fonts/cleanup
 * Deletes all uploaded font files older than 24 hours from /tmp/pdf-creator-fonts/.
 * Called by the daily cron at 23:59. Requires the Authorization header to match
 * the CRON_SECRET environment variable.
 *
 * Returns: { deleted: number }
 */

import fs   from "fs";
import path from "path";

const UPLOAD_DIR    = "/tmp/pdf-creator-fonts";
const MAX_AGE_MS    = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(UPLOAD_DIR);
  } catch {
    return Response.json({ deleted: 0 });
  }

  const now     = Date.now();
  let   deleted = 0;

  for (const entry of entries) {
    const filePath = path.join(UPLOAD_DIR, entry);
    try {
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs >= MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    } catch { /* file may have already been removed */ }
  }

  return Response.json({ deleted });
}
