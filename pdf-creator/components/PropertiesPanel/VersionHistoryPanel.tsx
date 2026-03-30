"use client";

import { useState } from "react";
import type { Template } from "@/types/template";
import type { TemplateVersion } from "@/lib/useVersionHistory";

interface VersionHistoryPanelProps {
  versions: TemplateVersion[];
  onSave: (label?: string) => void;
  onRestore: (template: Template) => void;
  onDelete: (versionId: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function VersionHistoryPanel({
  versions,
  onSave,
  onRestore,
  onDelete,
}: Readonly<VersionHistoryPanelProps>) {
  const [label, setLabel] = useState("");

  const handleSave = () => {
    onSave(label.trim() || undefined);
    setLabel("");
  };

  return (
    <div style={{ padding: "12px 14px" }}>
      <div className="section-card">
        <div className="section-title">Save Version</div>
        <div className="flex-row gap-4">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Label (optional)"
            className="input"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleSave}
            className="version-restore-btn"
            style={{
              background: "#1E40AF",
              color: "#fff",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Save
          </button>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">History ({versions.length})</div>
        {versions.length === 0 ? (
          <div style={{ color: "#94A3B8", fontSize: 11, textAlign: "center", padding: 8 }}>
            No versions saved yet.
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {versions.map((v) => (
              <div
                key={v.id}
                className="version-item"
              >
                <div className="flex-between">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1E293B" }}>{v.label}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8" }}>{formatTime(v.timestamp)}</div>
                  </div>
                  <div className="flex-row gap-3">
                    <button
                      onClick={() => onRestore(v.template)}
                      title="Restore this version"
                      className="version-restore-btn"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
                      title="Delete this version"
                      className="version-delete-btn"
                    >
                      x
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
