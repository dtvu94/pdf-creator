/**
 * Persistent store for shared templates using JSON files.
 *
 * Each shared template is saved as a separate JSON file named by its UUID.
 *
 * Environment variables:
 *   - SHARE_STORE_DIR   directory for JSON files (default: "/tmp/pdf-creator-shares")
 */

import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

const STORE_DIR = process.env.SHARE_STORE_DIR || "/tmp/pdf-creator-shares";

function ensureDir() {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

/** Store a template JSON string and return its UUID. */
export function saveSharedTemplate(json: string): string {
  ensureDir();
  const id = randomUUID();
  fs.writeFileSync(path.join(STORE_DIR, `${id}.json`), json, "utf-8");
  return id;
}

/** Retrieve a shared template by UUID, or null if not found. */
export function getSharedTemplate(id: string): string | null {
  try {
    return fs.readFileSync(path.join(STORE_DIR, `${id}.json`), "utf-8");
  } catch {
    return null;
  }
}
