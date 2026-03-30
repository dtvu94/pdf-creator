/**
 * Client-safe font registration helpers for @react-pdf/renderer.
 *
 * Server-side registration (which needs fs/path) lives in fontRegistry.server.ts.
 */

import { Font } from "@react-pdf/renderer";
import type { TemplateFont } from "@/types/template";
import { BUNDLED_FONTS, DEFAULT_FONT_FAMILY } from "@/lib/templates";

/** Families already registered in this process (avoids duplicate calls). */
const registeredFamilies = new Set<string>();

/**
 * Override react-pdf's built-in Helvetica with an embedded font so it never
 * produces unembedded Type1 references. Uses Calibri as a substitute.
 */
const HELVETICA_OVERRIDE = [
  { src: "/fonts/Calibri-Regular.ttf",    fontWeight: "normal" as const, fontStyle: "normal" as const },
  { src: "/fonts/Calibri-Bold.ttf",       fontWeight: "bold" as const,   fontStyle: "normal" as const },
  { src: "/fonts/Calibri-Italic.ttf",     fontWeight: "normal" as const, fontStyle: "italic" as const },
  { src: "/fonts/Calibri-BoldItalic.ttf", fontWeight: "bold" as const,   fontStyle: "italic" as const },
];

/**
 * Registers template fonts using URLs that the browser / react-pdf can fetch.
 *   - bundled faces → `/fonts/{ref}`  (served from public/)
 *   - uploaded faces → `/api/fonts/{ref}`  (served by the font API route)
 *
 * Always registers all BUNDLED_FONTS plus any extra custom fonts from the template.
 */
export function registerFontsClient(fonts?: TemplateFont[]): void {
  // Override Helvetica so react-pdf never uses the unembedded built-in
  if (!registeredFamilies.has("Helvetica")) {
    Font.register({ family: "Helvetica", fonts: HELVETICA_OVERRIDE });
    registeredFamilies.add("Helvetica");
  }

  // Register all bundled fonts
  for (const font of BUNDLED_FONTS) {
    if (registeredFamilies.has(font.family)) continue;
    Font.register({
      family: font.family,
      fonts: font.faces.map((face) => ({
        src: `/fonts/${face.ref}`,
        fontWeight: face.weight,
        fontStyle: face.style,
      })),
    });
    registeredFamilies.add(font.family);
  }

  // Register any custom (uploaded) fonts from the template
  const customFonts = (fonts ?? []).filter(
    (f) => f.faces.some((fc) => fc.source === "uploaded")
  );
  for (const font of customFonts) {
    if (registeredFamilies.has(font.family)) continue;
    Font.register({
      family: font.family,
      fonts: font.faces.map((face) => ({
        src: face.source === "bundled"
          ? `/fonts/${face.ref}`
          : `/api/fonts/${face.ref}`,
        fontWeight: face.weight,
        fontStyle: face.style,
      })),
    });
    registeredFamilies.add(font.family);
  }
}

/**
 * The active font family for the template.
 */
export function getDefaultFamily(fontFamily?: string): string {
  return fontFamily ?? DEFAULT_FONT_FAMILY;
}
