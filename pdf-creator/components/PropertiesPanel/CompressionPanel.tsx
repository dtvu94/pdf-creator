"use client";

import type { CompressionConfig } from "@/types/template";
import Field from "./Field";
import NumInput from "./NumInput";

interface CompressionPanelProps {
  compression: CompressionConfig;
  onUpdate: (c: CompressionConfig) => void;
}

export default function CompressionPanel({ compression, onUpdate }: Readonly<CompressionPanelProps>) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <div className="section-card">
        <div className="section-title">Image Compression</div>
        <Field label="JPEG Quality (1–100)">
          <NumInput
            value={compression.imageQuality ?? 90}
            min={1}
            max={100}
            onChange={(v) => onUpdate({ ...compression, imageQuality: v })}
          />
        </Field>
        <Field label="Target DPI (0 = no resampling)">
          <NumInput
            value={compression.imageDpi ?? 0}
            min={0}
            max={600}
            onChange={(v) => onUpdate({ ...compression, imageDpi: v })}
          />
        </Field>
        <div className="step-hint">
          Quality below 90 re-encodes images as JPEG. Lower values reduce file size.
        </div>
      </div>
    </div>
  );
}
