"use client";

import { useRef } from "react";
import type {
  ImageElement,
} from "@/types/template";
import Field from './Field';
import ColorInput from "./ColorInput";
import { ensurePngSrc } from "@/lib/imageConvert";

type ImageSectionProps = {
  el: ImageElement;
  set: (key: string, value: unknown) => void;
};

export default function ImageSection({
  el,
  set,
}: Readonly<ImageSectionProps>) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const src = await ensurePngSrc(reader.result as string);
      set("src", src);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isDataUrl = el.src?.startsWith("data:");

  return (
    <div className="section-card">
      <div className="section-title">Image</div>

      {/* Preview */}
      {el.src && (
        <div className="img-preview-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={el.src}
            alt="preview"
            className="img-preview"
          />
        </div>
      )}

      {/* Source */}
      <Field label="Source">
        <div className="flex-row gap-4">
          <input
            value={isDataUrl ? "" : (el.src ?? "")}
            placeholder={isDataUrl ? "Uploaded file" : "https://…"}
            disabled={isDataUrl}
            onChange={(e) => set("src", e.target.value || undefined)}
            className="input"
            style={{ flex: 1, color: isDataUrl ? "#94A3B8" : undefined }}
          />
          {el.src && (
            <button
              onClick={() => set("src", undefined)}
              title="Clear image"
              className="img-delete-btn"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex-row gap-4" style={{ marginTop: 4 }}>
          <button
            onClick={() => fileRef.current?.click()}
            className="img-upload-btn"
          >
            ⬆ Upload file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFile}
          />
        </div>
      </Field>

      {/* Label & background — only shown when no image is set */}
      {!el.src && (
        <>
          <Field label="Placeholder label">
            <input
              value={el.label}
              onChange={(e) => set("label", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Placeholder background">
            <ColorInput
              value={el.bgColor}
              onChange={(v) => set("bgColor", v)}
            />
          </Field>
        </>
      )}
    </div>
  );
}
