"use client";

import { useRef, useState } from "react";
import type { TemplateFont, FontFace, FontWeight, FontStyle } from "@/types/template";
import { BUNDLED_FONTS } from "@/lib/templates";

interface FontManagerPanelProps {
  fonts?: TemplateFont[];
  onChange: (fonts: TemplateFont[]) => void;
}

const FACE_DEFS: { weight: FontWeight; style: FontStyle; label: string }[] = [
  { weight: "normal", style: "normal",  label: "Regular"     },
  { weight: "bold",   style: "normal",  label: "Bold"        },
  { weight: "normal", style: "italic",  label: "Italic"      },
  { weight: "bold",   style: "italic",  label: "Bold Italic" },
];

function fontRef(family: string, weight: string, style: string): string {
  return `${family.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${weight}-${style}`;
}

function faceStatus(face: FontFace | undefined): "ok" | "none" {
  return face ? "ok" : "none";
}

export default function FontManagerPanel({ fonts, onChange }: Readonly<FontManagerPanelProps>) {
  const list = fonts ?? BUNDLED_FONTS;
  const [addingFamily, setAddingFamily] = useState(false);
  const [newFamily, setNewFamily] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function uploadFace(font: TemplateFont, weight: FontWeight, style: FontStyle, file: File) {
    const ref = fontRef(font.family, weight, style);
    const fd = new FormData();
    fd.append("family", font.family);
    fd.append("weight", weight);
    fd.append("style",  style);
    fd.append("file",   file);

    const res = await fetch("/api/fonts", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");

    const newFace: FontFace = { weight, style, source: "uploaded", ref };
    onChange(
      list.map((f) =>
        f.family === font.family
          ? {
              ...f,
              faces: [
                ...f.faces.filter((fc) => !(fc.weight === weight && fc.style === style)),
                newFace,
              ],
            }
          : f
      )
    );
  }

  function addFamily() {
    const name = newFamily.trim();
    if (!name || list.some((f) => f.family === name)) return;
    onChange([...list, { family: name, faces: [] }]);
    setNewFamily("");
    setAddingFamily(false);
  }

  function removeFont(family: string) {
    // Bundled fonts cannot be removed.
    onChange(list.filter((f) => f.family !== family || BUNDLED_FONTS.some((b) => b.family === family)));
  }

  return (
    <div className="fm-container">
      <div className="text-slate-400 text-11 uppercase tracking-wider font-bold">
        Fonts
      </div>

      {list.map((font) => {
        const isBundled = BUNDLED_FONTS.some((b) => b.family === font.family);
        return (
          <div key={font.family} className="fm-family-box">
            <div className="flex-between" style={{ marginBottom: 8 }}>
              <span style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600 }}>{font.family}</span>
              <div className="flex-row gap-6">
                {isBundled && (
                  <span className="fm-bundled-badge">bundled</span>
                )}
                {!isBundled && (
                  <button
                    onClick={() => removeFont(font.family)}
                    style={{
                      background: "transparent", color: "#EF4444",
                      border: "1px solid #7F1D1D", borderRadius: 4,
                      padding: "1px 6px", fontSize: 11, cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Face grid — only shown for non-bundled (uploaded) fonts */}
            {!isBundled && (
              <div className="fm-face-grid">
                {FACE_DEFS.map(({ weight, style, label }) => {
                  const ref  = fontRef(font.family, weight, style);
                  const face = font.faces.find((f) => f.weight === weight && f.style === style);
                  const st   = faceStatus(face);
                  return (
                    <div
                      key={ref}
                      className="fm-face-item"
                      style={{ borderColor: st === "ok" ? "#16A34A" : "#334155" }}
                    >
                      <span style={{ color: "#CBD5E1", fontSize: 11 }}>{label}</span>
                      {st === "ok" ? (
                        <span style={{ color: "#4ADE80", fontSize: 13 }}>✓</span>
                      ) : (
                        <>
                          <button
                            onClick={() => fileRefs.current[ref]!.click()}
                            style={{
                              background: "#1D4ED8", color: "#fff", border: "none",
                              borderRadius: 3, padding: "2px 7px", fontSize: 10,
                              cursor: "pointer",
                              fontFamily: "system-ui",
                            }}
                          >
                            Upload
                          </button>
                          <input
                            ref={(el) => { fileRefs.current[ref] = el; }}
                            type="file"
                            accept=".ttf,.otf"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]; // files may be null in some browsers
                              if (file) void uploadFace(font, weight, style, file);
                              e.target.value = "";
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Add custom font family */}
      {addingFamily ? (
        <div className="flex-row gap-6">
          <input
            value={newFamily}
            onChange={(e) => setNewFamily(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFamily()}
            placeholder="Family name…"
            autoFocus
            className="ph-picker-input"
            style={{ fontSize: 12 }}
          />
          <button
            onClick={addFamily}
            style={{
              background: "#1D4ED8", color: "#fff", border: "none",
              borderRadius: 4, padding: "4px 10px", fontSize: 12,
              cursor: "pointer", fontFamily: "system-ui",
            }}
          >
            Add
          </button>
          <button
            onClick={() => { setAddingFamily(false); setNewFamily(""); }}
            style={{
              background: "transparent", color: "#94A3B8",
              border: "1px solid #334155", borderRadius: 4,
              padding: "4px 8px", fontSize: 12, cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button onClick={() => setAddingFamily(true)} className="fm-add-btn">
          + Add custom font
        </button>
      )}
    </div>
  );
}
