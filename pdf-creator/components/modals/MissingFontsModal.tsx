"use client";

import { useState } from "react";
import type { TemplateFont } from "@/types/template";
import { FontUploadList } from "./FontUploadList";

interface MissingFontsModalProps {
  missingFonts: TemplateFont[];
  onResolved: () => void;
  onDismiss: () => void;
}

export default function MissingFontsModal({
  missingFonts,
  onResolved,
  onDismiss,
}: Readonly<MissingFontsModalProps>) {
  const [allDone, setAllDone] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="modal-dialog-sm">
        <div className="modal-header">
          <span style={{ fontWeight: 700, fontSize: 14 }}>Missing Fonts</span>
          <span style={{ color: "#64748B", fontSize: 12 }}>
            The following font files were not found. Please re-upload them to continue.
          </span>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", maxHeight: 340 }}>
          <FontUploadList missingFonts={missingFonts} onAllDoneChange={setAllDone} />
        </div>

        <div className="modal-footer">
          <button onClick={onDismiss} className="missing-fonts-dismiss-btn">Continue without fonts</button>
          <button
            onClick={onResolved}
            disabled={!allDone}
            className="missing-fonts-resolve-btn"
            style={{
              background: allDone ? "#16A34A" : "#94A3B8",
              color: "#fff",
              cursor: allDone ? "pointer" : "not-allowed",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
