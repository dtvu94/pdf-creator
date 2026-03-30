/**
 * Server-side font registration helpers for @react-pdf/renderer.
 *
 * This file uses Node.js fs/path — do NOT import it from client components.
 * Client-side registration lives in fontRegistry.ts.
 */

import { Font } from "@react-pdf/renderer";
import type { FontStyle, FontWeight } from "@react-pdf/types";
import type { TemplateFont } from "@/types/template";
import { BUNDLED_FONTS, DEFAULT_FONT_FAMILY } from "@/lib/templates";
import path from "path";
import fs from "fs";

const BUNDLED_DIR = path.join(process.cwd(), "public", "fonts");
const UPLOAD_DIR  = "/tmp/pdf-creator-fonts";

/** Families already registered in this process (avoids duplicate calls). */
const registeredFamilies = new Set<string>();

/**
 * Override react-pdf's built-in Helvetica with an embedded font so it never
 * produces unembedded Type1 references. Uses Calibri as a substitute.
 */
function helveticaOverride(): { src: string; fontWeight: FontWeight; fontStyle: FontStyle }[] {
  return [
    { src: path.join(BUNDLED_DIR, "Calibri-Regular.ttf"),    fontWeight: "normal", fontStyle: "normal" },
    { src: path.join(BUNDLED_DIR, "Calibri-Bold.ttf"),       fontWeight: "bold",   fontStyle: "normal" },
    { src: path.join(BUNDLED_DIR, "Calibri-Italic.ttf"),     fontWeight: "normal", fontStyle: "italic" },
    { src: path.join(BUNDLED_DIR, "Calibri-BoldItalic.ttf"), fontWeight: "bold",   fontStyle: "italic" },
  ];
}

/**
 * Registers template fonts using absolute filesystem paths.
 *   - bundled faces → `{cwd}/public/fonts/{ref}`
 *   - uploaded faces → `/tmp/pdf-creator-fonts/{ref}.*` (any extension)
 *
 * Always registers all BUNDLED_FONTS plus any extra custom fonts from the template.
 * Returns the family names of any uploaded fonts whose files were not found.
 */
export function registerFontsServer(fonts?: TemplateFont[]): string[] {
  const missing: string[] = [];

  // Override Helvetica so react-pdf never uses the unembedded built-in
  if (!registeredFamilies.has("Helvetica")) {
    Font.register({ family: "Helvetica", fonts: helveticaOverride() });
    registeredFamilies.add("Helvetica");
  }

  // Register all bundled fonts
  for (const font of BUNDLED_FONTS) {
    if (registeredFamilies.has(font.family)) continue;
    const resolvedFaces: { src: string; fontWeight: FontWeight; fontStyle: FontStyle }[] = [];
    for (const face of font.faces) {
      resolvedFaces.push({
        src: path.join(BUNDLED_DIR, face.ref),
        fontWeight: face.weight,
        fontStyle: face.style,
      });
    }
    if (resolvedFaces.length > 0) {
      Font.register({ family: font.family, fonts: resolvedFaces });
      registeredFamilies.add(font.family);
    }
  }

  // Register any custom (uploaded) fonts from the template
  const customFonts = (fonts ?? []).filter(
    (f) => f.faces.some((fc) => fc.source === "uploaded")
  );
  for (const font of customFonts) {
    if (registeredFamilies.has(font.family)) continue;

    const resolvedFaces: { src: string; fontWeight: FontWeight; fontStyle: FontStyle }[] = [];

    for (const face of font.faces) {
      let src: string;

      if (face.source === "bundled") {
        src = path.join(BUNDLED_DIR, face.ref);
      } else {
        let found: string | undefined;
        try {
          const entries = fs.readdirSync(UPLOAD_DIR);
          const match = entries.find(
            (e: string) => e === face.ref || e.startsWith(face.ref + ".")
          );
          found = match ? path.join(UPLOAD_DIR, match) : undefined;
        } catch {
          // UPLOAD_DIR may not exist yet.
        }
        if (!found) {
          missing.push(`${font.family} (${face.weight} ${face.style})`);
          continue;
        }
        src = found;
      }

      resolvedFaces.push({ src, fontWeight: face.weight, fontStyle: face.style });
    }

    if (resolvedFaces.length > 0) {
      Font.register({ family: font.family, fonts: resolvedFaces });
      registeredFamilies.add(font.family);
    }
  }

  return missing;
}

/**
 * The active font family for the template.
 */
export function getDefaultFamily(fontFamily?: string): string {
  return fontFamily ?? DEFAULT_FONT_FAMILY;
}
