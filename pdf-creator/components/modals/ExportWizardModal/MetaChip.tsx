"use client";


export function MetaChip({
  label,
  value,
  highlight = false,
}: Readonly<{ label: string; value: string; highlight?: boolean }>) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span className="meta-chip-label">{label}</span>
      <span
        className="meta-chip-value"
        style={{
          color: highlight ? "#B45309" : "#374151",
          background: highlight ? "#FEF3C7" : "#F1F5F9",
          border: `1px solid ${highlight ? "#FDE68A" : "#E2E8F0"}`,
        }}
      >{value}</span>
    </div>
  );
}
