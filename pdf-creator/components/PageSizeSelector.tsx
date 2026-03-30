"use client";

import type { PageSize } from "@/types/template";
import { PAGE_DIMENSIONS } from "@/lib/templates";

interface PageSizeSelectorProps {
  value?: PageSize;
  onChange: (size: PageSize) => void;
}

const OPTIONS: { size: PageSize; label: string }[] = [
  { size: "A4", label: "A4 (210 × 297 mm)" },
  { size: "A3", label: "A3 (297 × 420 mm)" },
  { size: "A5", label: "A5 (148 × 210 mm)" },
];

export default function PageSizeSelector({ value, onChange }: Readonly<PageSizeSelectorProps>) {
  const current = value ?? "A4";
  const { width, height } = PAGE_DIMENSIONS[current];

  return (
    <div className="dark-select-wrap">
      <span style={{ color: "#94A3B8", fontSize: 11 }}>Page:</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value as PageSize)}
        className="dark-select"
      >
        {OPTIONS.map(({ size, label }) => (
          <option key={size} value={size}>{label}</option>
        ))}
      </select>
      <span className="text-slate-400 text-10">
        {width} × {height} pt
      </span>
    </div>
  );
}
