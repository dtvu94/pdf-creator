"use client";

import { useEffect } from "react";
import { BUNDLED_FONTS } from "@/lib/templates";

const STYLE_ID = "pdf-creator-editor-fonts";

/**
 * Injects @font-face CSS rules for all bundled fonts so the editor canvas
 * can render them in the browser. Runs once on mount.
 */
export function useEditorFonts(): void {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;

    const rules = BUNDLED_FONTS.flatMap((font) =>
      font.faces.map(
        (face) =>
          `@font-face {
  font-family: "${font.family}";
  src: url("/fonts/${face.ref}") format("woff");
  font-weight: ${face.weight === "bold" ? "700" : "400"};
  font-style: ${face.style};
  font-display: swap;
}`
      )
    );

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = rules.join("\n");
    document.head.appendChild(style);
  }, []);
}
