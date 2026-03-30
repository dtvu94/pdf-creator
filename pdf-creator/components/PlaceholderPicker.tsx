"use client";

import { useState, useRef, useEffect } from "react";

interface PlaceholderPickerProps {
  existingPlaceholders: string[];
  onInsert: (name: string) => void;
  disabled?: boolean;
}

const SPECIAL = [
  { label: "Current Page", name: "page_number" },
  { label: "Total Pages",  name: "total_pages"  },
];

export default function PlaceholderPicker({
  existingPlaceholders,
  onInsert,
  disabled,
}: Readonly<PlaceholderPickerProps>) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function insert(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    onInsert(trimmed);
    setOpen(false);
    setNewName("");
  }

  const chipStyle = (color: string): React.CSSProperties => ({
    background: color,
    border: "none",
    borderRadius: 4,
    padding: "3px 9px",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "system-ui",
    whiteSpace: "nowrap",
  });

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        title={disabled ? "Select a text or heading element first" : "Insert placeholder"}
        className="toolbar-toggle"
        style={{
          background: open ? "#1D4ED8" : "#1E293B",
          color: disabled ? "#4B5563" : "#CBD5E1",
          border: `1px solid ${open ? "#3B82F6" : "#334155"}`,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13 }}>{"{}"}</span>
        <span>Placeholder</span>
      </button>

      {open && (
        <div className="ph-picker-popup flex-col gap-12">
          {/* New placeholder */}
          <div>
            <div className="section-title" style={{ marginBottom: 6, letterSpacing: "0.05em" }}>
              New placeholder
            </div>
            <div className="flex-row gap-6">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insert(newName)}
                placeholder="placeholder_name"
                className="ph-picker-input"
              />
              <button
                onClick={() => insert(newName)}
                disabled={!newName.trim()}
                style={{
                  ...chipStyle(newName.trim() ? "#1D4ED8" : "#1E293B"),
                  color: newName.trim() ? "#BFDBFE" : "#4B5563",
                  border: "1px solid #334155",
                }}
              >
                Insert
              </button>
            </div>
          </div>

          {/* Special placeholders */}
          <div>
            <div className="section-title" style={{ marginBottom: 6, letterSpacing: "0.05em" }}>
              Special
            </div>
            <div className="flex-row gap-6 flex-wrap">
              {SPECIAL.map(({ label, name }) => (
                <button
                  key={name}
                  onClick={() => insert(name)}
                  title={`Insert {{${name}}}`}
                  style={{ ...chipStyle("#065F46"), color: "#6EE7B7" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Existing placeholders */}
          {existingPlaceholders.length > 0 && (
            <div>
              <div className="section-title" style={{ marginBottom: 6, letterSpacing: "0.05em" }}>
                In this template
              </div>
              <div className="flex-row gap-5 flex-wrap">
                {existingPlaceholders.map((name) => (
                  <button
                    key={name}
                    onClick={() => insert(name)}
                    title={`Insert {{${name}}}`}
                    style={{ ...chipStyle("#78350F"), color: "#FCD34D" }}
                  >
                    {`{{${name}}}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
