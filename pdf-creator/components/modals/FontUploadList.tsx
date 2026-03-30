"use client";

import { useRef, useState, useEffect } from "react";
import type { TemplateFont, FontFace } from "@/types/template";

interface FontUploadListProps {
  missingFonts: TemplateFont[];
  onAllDoneChange?: (allDone: boolean) => void;
}

function faceLabel(face: FontFace): string {
  const w = face.weight === "bold" ? "Bold" : "Regular";
  const s = face.style === "italic" ? " Italic" : "";
  return `${w}${s}`;
}

export function FontUploadList({
  missingFonts,
  onAllDoneChange,
}: Readonly<FontUploadListProps>) {
  const missingFaces = missingFonts.flatMap((font) =>
    font.faces.filter((f) => f.source === "uploaded").map((face) => ({ font, face })),
  );

  const [status, setStatus] = useState<Record<string, "idle" | "uploading" | "done" | "error">>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const allDone = missingFaces.every(({ face }) => status[face.ref] === "done");

  useEffect(() => {
    onAllDoneChange?.(allDone);
  }, [allDone, onAllDoneChange]);

  async function handleUpload(font: TemplateFont, face: FontFace, file: File) {
    setStatus((s) => ({ ...s, [face.ref]: "uploading" }));
    const fd = new FormData();
    fd.append("family", font.family);
    fd.append("weight", face.weight);
    fd.append("style", face.style);
    fd.append("file", file);
    try {
      const res = await fetch("/api/fonts", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      setStatus((s) => ({ ...s, [face.ref]: "done" }));
    } catch {
      setStatus((s) => ({ ...s, [face.ref]: "error" }));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {missingFaces.map(({ font, face }) => {
        const s = status[face.ref] ?? "idle";
        let borderColor = "#E2E8F0";
        if (s === "done") borderColor = "#16A34A";
        else if (s === "error") borderColor = "#EF4444";

        const isError = s === "error";

        let btnLabel = "Upload";
        if (s === "uploading") btnLabel = "Uploading\u2026";
        else if (isError) btnLabel = "Retry";

        return (
          <div
            key={face.ref}
            className="font-upload-item"
            style={{ border: `1px solid ${borderColor}` }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{font.family}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{faceLabel(face)}</div>
            </div>
            {s === "done" ? (
              <span style={{ color: "#16A34A", fontSize: 18, fontWeight: 700 }}>{"\u2713"}</span>
            ) : (
              <>
                <button
                  onClick={() => fileInputRefs.current[face.ref]?.click()}
                  disabled={s === "uploading"}
                  className="font-upload-btn"
                  style={{
                    background: isError ? "#FEE2E2" : "#EFF6FF",
                    color: isError ? "#DC2626" : "#1D4ED8",
                    border: `1px solid ${isError ? "#FECACA" : "#BFDBFE"}`,
                  }}
                >
                  {btnLabel}
                </button>
                <input
                  ref={(el) => { fileInputRefs.current[face.ref] = el; }}
                  type="file" accept=".ttf,.otf" style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(font, face, file);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
