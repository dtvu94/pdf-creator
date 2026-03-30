"use client";

import { SUPPORTED_FONT_FAMILIES, DEFAULT_FONT_FAMILY } from "@/lib/templates";

interface FontSelectorProps {
  value?: string;
  onChange: (family: string) => void;
}

export default function FontSelector({ value, onChange }: Readonly<FontSelectorProps>) {
  const current = value ?? DEFAULT_FONT_FAMILY;

  return (
    <div className="dark-select-wrap">
      <span style={{ color: "#94A3B8", fontSize: 11 }}>Font:</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="dark-select"
      >
        {SUPPORTED_FONT_FAMILIES.map((family) => (
          <option key={family} value={family}>{family}</option>
        ))}
      </select>
    </div>
  );
}
