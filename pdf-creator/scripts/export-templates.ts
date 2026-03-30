/**
 * Export all built-in templates as JSON files into public/samples/<id>/template.json
 *
 * Usage:  npx tsx scripts/export-templates.ts
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getTemplateById, TEMPLATE_REGISTRY } from "@/lib/templates/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const samplesDir = join(__dirname, "..", "public", "samples");

for (const { id } of TEMPLATE_REGISTRY) {
  const template = getTemplateById(id);
  const dir = join(samplesDir, id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const dest = join(dir, "template.json");
  writeFileSync(dest, JSON.stringify(template, null, 2) + "\n");
  console.log(`wrote ${dest}`);
}
