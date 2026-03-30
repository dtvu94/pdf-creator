import React from "react";

/**
 * Triggers a browser download of the given data serialised as JSON.
 */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parses pasted CSV or TSV text into table headers and rows.
 * Auto-detects the delimiter (tab takes priority over comma).
 * First line is treated as the header row.
 * Strips surrounding double-quotes from each cell (simple CSV quoting only).
 */
export function parseTableData(raw: string): { headers: string[]; rows: string[][] } {
  const lines = raw.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const strip = (s: string) => s.trim().replaceAll(/^"|"$/g, "");

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(delimiter).map(strip);

  const rows = dataLines.map((line) => {
    const cells = line.split(delimiter).map(strip);
    while (cells.length < headers.length) cells.push("");
    return cells.slice(0, headers.length);
  });

  return { headers, rows };
}

/**
 * Renders a string with {{placeholder}} tokens highlighted as amber chips.
 * Returns an array of plain and styled spans suitable for React rendering.
 */
export function renderWithPlaceholders(text: string): React.ReactNode {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) =>
    part.startsWith("{{") && part.endsWith("}}") ? (
      <span
        key={`ph-${part}-${i}`}
        className="placeholder-chip"
      >
        {part}
      </span>
    ) : (
      <span key={`txt-${part}-${i}`}>{part}</span>
    )
  );
}
