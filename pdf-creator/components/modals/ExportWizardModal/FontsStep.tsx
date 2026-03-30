"use client";

import type { TemplateFont } from "@/types/template";
import { FontUploadList } from "../FontUploadList";

export function FontsStep({
  missingFonts,
  setReady,
}: Readonly<{
  missingFonts: TemplateFont[];
  setReady: (ready: boolean) => void;
}>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="step-header">
        <span style={{ fontWeight: 700, fontSize: 14 }}>Missing Fonts</span>
        <span style={{ color: "#64748B", fontSize: 12 }}>
          The following font files were not found on the server. Please re-upload them to continue.
        </span>
      </div>

      <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
        <FontUploadList missingFonts={missingFonts} onAllDoneChange={setReady} />
      </div>

      <div style={{ padding: "8px 20px", borderTop: "1px solid #E2E8F0", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>
          Upload all missing fonts to continue, or cancel to skip the export.
        </span>
      </div>
    </div>
  );
}
