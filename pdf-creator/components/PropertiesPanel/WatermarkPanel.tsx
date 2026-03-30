"use client";

import { useRef } from "react";
import type { WatermarkConfig } from "@/types/template";
import Field from "./Field";
import NumInput from "./NumInput";

interface WatermarkPanelProps {
  watermark: WatermarkConfig;
  totalPages: number;
  onUpdate: (wm: WatermarkConfig) => void;
}

export default function WatermarkPanel({ watermark, totalPages, onUpdate }: Readonly<WatermarkPanelProps>) {
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof WatermarkConfig>(key: K, value: WatermarkConfig[K]) =>
    onUpdate({ ...watermark, [key]: value });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        set("src", reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const pagesMode = watermark.pages === "all" ? "all" : "custom";
  const customPages = Array.isArray(watermark.pages) ? watermark.pages : [];

  return (
    <div className="props-panel-body">
      <div className="flex-between" style={{ marginBottom: 14 }}>
        <span className="props-el-type" style={{ textTransform: "none" }}>Watermark</span>
        <button
          onClick={() => set("enabled", !watermark.enabled)}
          className="wm-toggle-btn"
          style={{
            background: watermark.enabled ? "#16A34A" : "#94A3B8",
          }}
        >
          {watermark.enabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Image */}
      <div className="section-card">
        <div className="section-title">Image</div>
        {watermark.src ? (
          <div className="img-preview-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={watermark.src}
              alt="watermark preview"
              className="img-preview"
              style={{ maxHeight: 80 }}
            />
          </div>
        ) : (
          <div className="chart-empty" style={{ marginBottom: 8 }}>
            No image set
          </div>
        )}
        <div className="flex-row gap-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="img-upload-btn"
            style={{ background: "#3B82F6", color: "#fff", border: "none", fontWeight: 600 }}
          >
            Upload Image
          </button>
          {watermark.src && (
            <button
              onClick={() => set("src", undefined)}
              className="img-delete-btn"
              style={{ fontWeight: 600 }}
            >
              Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
      </div>

      {/* Position & Size */}
      <div className="section-card">
        <div className="section-title">Position & Size</div>
        <div className="grid-2col">
          <Field label="X"><NumInput value={watermark.x} onChange={(v) => set("x", v)} /></Field>
          <Field label="Y"><NumInput value={watermark.y} onChange={(v) => set("y", v)} /></Field>
          <Field label="Width"><NumInput value={watermark.width} onChange={(v) => set("width", v)} min={10} /></Field>
          <Field label="Height"><NumInput value={watermark.height} onChange={(v) => set("height", v)} min={10} /></Field>
        </div>
      </div>

      {/* Opacity */}
      <div className="section-card">
        <div className="section-title">Opacity</div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={watermark.opacity}
          onChange={(e) => set("opacity", Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <span className="opacity-hint">{Math.round(watermark.opacity * 100)}%</span>
      </div>

      {/* Pages */}
      <div className="section-card">
        <div className="section-title">Pages</div>
        <Field label="Apply to">
          <select
            value={pagesMode}
            onChange={(e) => {
              if (e.target.value === "all") set("pages", "all");
              else set("pages", [1]);
            }}
            className="input"
          >
            <option value="all">All pages</option>
            <option value="custom">Specific pages</option>
          </select>
        </Field>
        {pagesMode === "custom" && (
          <div style={{ marginTop: 6 }}>
            <div className="field-label">Select pages:</div>
            <div className="flex-row" style={{ flexWrap: "wrap", gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pn) => {
                const active = customPages.includes(pn);
                return (
                  <button
                    key={pn}
                    onClick={() => {
                      const next = active
                        ? customPages.filter((p) => p !== pn)
                        : [...customPages, pn].sort((a, b) => a - b);
                      set("pages", next.length > 0 ? next : [1]);
                    }}
                    className={active ? "wm-page-btn toggle-btn-on" : "wm-page-btn toggle-btn-off"}
                  >
                    {pn}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
