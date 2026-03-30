"use client";

import { useEffect, useRef } from "react";
import type { TemplateElement, ChartElement, DividerElement, TextElement, RepeaterElement, CardElement, TableElement, ImageElement, ShapeElement } from "@/types/template";
import { renderWithPlaceholders } from "@/lib/utils";

// ─── Resize handles ─────────────────────────────────────────────────────────

const HANDLE_SIZE = 8;

const HANDLES = ["nw", "ne", "sw", "se", "n", "s", "e", "w"] as const;

const HANDLE_CURSORS: Record<string, string> = {
  nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize",
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
};

function getHandleStyle(handle: string, elW: number, elH: number): React.CSSProperties {
  const half = HANDLE_SIZE / 2;
  const base: React.CSSProperties = {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    background: "#fff",
    border: "1.5px solid #3B82F6",
    borderRadius: 2,
    cursor: HANDLE_CURSORS[handle],
    zIndex: 10,
  };

  switch (handle) {
    case "nw": return { ...base, top: -half, left: -half };
    case "ne": return { ...base, top: -half, left: elW - half };
    case "sw": return { ...base, top: elH - half, left: -half };
    case "se": return { ...base, top: elH - half, left: elW - half };
    case "n":  return { ...base, top: -half, left: elW / 2 - half };
    case "s":  return { ...base, top: elH - half, left: elW / 2 - half };
    case "e":  return { ...base, top: elH / 2 - half, left: elW - half };
    case "w":  return { ...base, top: elH / 2 - half, left: -half };
    default:   return base;
  }
}

// Whether an element type supports height resizing
function hasHeight(type: string): boolean {
  return ["image", "card", "chart", "shape"].includes(type);
}

function ResizeHandles({
  el,
  scale,
  onResizeStart,
}: {
  el: TemplateElement;
  scale: number;
  onResizeStart: (e: React.MouseEvent, id: string, handle: string) => void;
}) {
  const w = ((el as { width?: number }).width ?? 100) * scale;
  const h = hasHeight(el.type) ? ((el as { height?: number }).height ?? 60) * scale : 16;

  const handles = hasHeight(el.type) ? HANDLES : (["e", "w"] as const);

  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle}
          role="presentation"
          style={getHandleStyle(handle, w, h)}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onResizeStart(e, el.id, handle);
          }}
        />
      ))}
    </>
  );
}

// ─── Chart preview sub-component (needs hooks for ECharts DOM init) ───────────

function ChartElementPreview({ el, s }: Readonly<{ el: ChartElement; s: number }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasOption = Object.keys(el.option).length > 0;

  useEffect(() => {
    if (!hasOption || !containerRef.current) return;

    let chart: { setOption: (o: unknown) => void; dispose: () => void } | null = null;
    let cancelled = false;

    import("echarts").then((echarts) => {
      if (cancelled || !containerRef.current) return;
      chart = echarts.init(containerRef.current, null, { width: el.width, height: el.height });
      chart.setOption(el.option);
    });

    return () => {
      cancelled = true;
      chart?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(el.option), hasOption]);

  if (!hasOption) {
    return (
      <div
        style={{
          width: el.width * s,
          height: el.height * s,
          background: "#F1F5F9",
          border: "2px dashed #94A3B8",
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
          fontSize: 11 * s,
          fontFamily: "system-ui, sans-serif",
          gap: 4 * s,
        }}
      >
        <span style={{ fontSize: 20 * s }}>📊</span>
        <span>Chart — no option configured</span>
        <span style={{ fontSize: 9 * s, color: "#94A3B8" }}>Select to add ECharts option</span>
      </div>
    );
  }

  return (
    <div style={{ width: el.width * s, height: el.height * s, overflow: "hidden" }}>
      <div
        ref={containerRef}
        style={{
          width: el.width,
          height: el.height,
          transform: `scale(${s})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

// ─── Shape element preview ──────────────────────────────────────────────────

function ShapePreview({ el, s }: Readonly<{ el: ShapeElement; s: number }>) {
  const w = el.width * s;
  const h = el.height * s;

  if (el.shapeType === "line") {
    return (
      <svg width={w} height={h} style={{ display: "block" }}>
        <line
          x1={0}
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke={el.strokeColor}
          strokeWidth={Math.max(1, el.strokeWidth * s)}
        />
      </svg>
    );
  }

  if (el.shapeType === "circle") {
    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: "50%",
          background: el.fillColor,
          border: el.strokeWidth > 0 ? `${Math.max(1, el.strokeWidth * s)}px solid ${el.strokeColor}` : "none",
          boxSizing: "border-box",
          opacity: el.opacity ?? 1,
        }}
      />
    );
  }

  const opacity = el.opacity ?? 1;
  const sw = Math.max(1, el.strokeWidth * s);
  const border = el.strokeWidth > 0 ? `${sw}px solid ${el.strokeColor}` : "none";

  if (el.shapeType === "triangle") {
    return (
      <svg width={w} height={h} style={{ display: "block", opacity }}>
        <polygon
          points={`${w / 2},0 ${w},${h} 0,${h}`}
          fill={el.fillColor}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth > 0 ? sw : 0}
        />
      </svg>
    );
  }

  if (el.shapeType === "diamond") {
    return (
      <svg width={w} height={h} style={{ display: "block", opacity }}>
        <polygon
          points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`}
          fill={el.fillColor}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth > 0 ? sw : 0}
        />
      </svg>
    );
  }

  if (el.shapeType === "arrow") {
    const headW = w * 0.4;
    const bodyH = h * 0.4;
    const bodyTop = (h - bodyH) / 2;
    return (
      <svg width={w} height={h} style={{ display: "block", opacity }}>
        <polygon
          points={`0,${bodyTop} ${w - headW},${bodyTop} ${w - headW},0 ${w},${h / 2} ${w - headW},${h} ${w - headW},${bodyTop + bodyH} 0,${bodyTop + bodyH}`}
          fill={el.fillColor}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth > 0 ? sw : 0}
        />
      </svg>
    );
  }

  if (el.shapeType === "heart") {
    return (
      <svg width={w} height={h} viewBox="0 0 100 100" style={{ display: "block", opacity }}>
        <path
          d="M50 90 C25 65, 0 50, 0 30 A25 25 0 0 1 50 30 A25 25 0 0 1 100 30 C100 50, 75 65, 50 90Z"
          fill={el.fillColor}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth > 0 ? (el.strokeWidth * 2) : 0}
        />
      </svg>
    );
  }

  // rectangle
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: el.borderRadius * s,
        background: el.fillColor,
        border,
        boxSizing: "border-box",
        opacity,
      }}
    />
  );
}

// ─── Main ElementView ───────────────────────────────────────────────────────

interface ElementViewProps {
  el: TemplateElement;
  selected: boolean;
  scale: number;
  fontFamily: string;
  viewMode: "select" | "pan";
  onSelect: (id: string, additive: boolean) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onResizeStart: (e: React.MouseEvent, id: string, handle: string) => void;
}

export default function ElementView({
  el,
  selected,
  scale,
  fontFamily,
  viewMode,
  onSelect,
  onDragStart,
  onResizeStart,
}: Readonly<ElementViewProps>) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === "pan") return;
    e.stopPropagation();
    const additive = e.shiftKey;
    onSelect(el.id, additive);
    if (!additive) onDragStart(e, el.id);
    else if (additive) onDragStart(e, el.id); // also allow dragging multi-select
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(el.id, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") onSelect(el.id, e.shiftKey);
  };

  let inner: React.ReactNode = null;
  const s = scale;
  const opacity = el.opacity ?? 1;

  if (el.type === "heading" || el.type === "text") {
    const listStyle = el.listStyle ?? "none";
    const lines = el.content.split("\n");
    inner = (
      <div
        style={{
          width: el.width * s,
          fontSize: (el.superscript || el.subscript) ? el.fontSize * s * 0.6 : el.fontSize * s,
          fontWeight: el.bold ? 700 : 400,
          fontStyle: el.italic ? "italic" : "normal",
          textDecoration: [el.underline && "underline", el.strikethrough && "line-through"].filter(Boolean).join(" ") || "none",
          color: el.color,
          fontFamily: `"${fontFamily}", sans-serif`,
          whiteSpace: "pre-wrap",
          lineHeight: el.lineHeight ?? 1.5,
          textAlign: el.textAlign ?? "left",
          verticalAlign: el.superscript ? "super" : el.subscript ? "sub" : undefined,
          opacity,
        }}
      >
        {listStyle === "none"
          ? renderWithPlaceholders(el.content)
          : lines.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 4 * s }}>
              <span style={{ flexShrink: 0, width: el.fontSize * s }}>
                {listStyle === "bullet" ? "\u2022" : `${i + 1}.`}
              </span>
              <span>{renderWithPlaceholders(line)}</span>
            </div>
          ))
        }
      </div>
    );
  } else if (el.type === "link") {
    inner = (
      <div
        style={{
          width: el.width * s,
          fontSize: el.fontSize * s,
          color: el.color,
          textDecoration: (el.underline ?? true) ? "underline" : "none",
          fontFamily: `"${fontFamily}", sans-serif`,
          whiteSpace: "pre-wrap",
          opacity,
          cursor: "pointer",
        }}
      >
        {renderWithPlaceholders(el.content)}
      </div>
    );
  } else if (el.type === "divider") {
    inner = (
      <div
        style={{
          width: el.width * s,
          height: Math.max(6, el.thickness * s + 4),
          display: "flex",
          alignItems: "center",
          opacity,
        }}
      >
        <hr
          style={{
            width: "100%",
            margin: 0,
            border: "none",
            borderTop: `${Math.max(1, el.thickness * s)}px solid ${el.color}`,
          }}
        />
      </div>
    );
  } else if (el.type === "image") {
    inner = el.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={el.src}
        alt={el.label || "image"}
        style={{
          width: el.width * s,
          height: el.height * s,
          objectFit: "contain",
          display: "block",
          borderRadius: 4,
          opacity,
        }}
      />
    ) : (
      <div
        style={{
          width: el.width * s,
          height: el.height * s,
          background: el.bgColor || "#E2E8F0",
          border: "2px dashed #94A3B8",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
          fontSize: 11 * s,
          fontFamily: `"${fontFamily}", sans-serif`,
          gap: 4,
          opacity,
        }}
      >
        🖼 {el.label || "Image"}
      </div>
    );
  } else if (el.type === "card") {
    inner = (
      <div
        style={{
          width: el.width * s,
          height: el.height * s,
          background: el.bgColor,
          border: `1.5px solid ${el.borderColor}`,
          borderRadius: 6 * s,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: `"${fontFamily}", sans-serif`,
          opacity,
        }}
      >
        <div style={{ height: 4 * s, background: el.accentColor, flexShrink: 0 }} />
        <div style={{ padding: `${8 * s}px ${10 * s}px`, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontSize: 8 * s, fontWeight: 700, color: el.accentColor, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {renderWithPlaceholders(el.title)}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 * s }}>
            <span style={{ fontSize: 24 * s, fontWeight: 700, color: "#1E293B", lineHeight: 1 }}>
              {renderWithPlaceholders(el.value)}
            </span>
            <span style={{ fontSize: 10 * s, color: "#64748B" }}>{el.unit}</span>
          </div>
          <div style={{ fontSize: 8 * s, color: "#94A3B8" }}>
            {renderWithPlaceholders(el.subtitle)}
          </div>
        </div>
      </div>
    );
  } else if (el.type === "chart") {
    inner = <ChartElementPreview el={el} s={s} />;
  } else if (el.type === "shape") {
    inner = <ShapePreview el={el} s={s} />;
  } else if (el.type === "repeater") {
    const rep = el as RepeaterElement;
    const fieldNames = new Set<string>();
    const PH_RE = /\{\{([^}]+)\}\}/g;
    for (const cEl of rep.cardElements) {
      if (cEl.type === "text" || cEl.type === "heading") {
        for (const m of (cEl as { content: string }).content.matchAll(PH_RE)) fieldNames.add(m[1].trim());
      } else if (cEl.type === "card") {
        const c = cEl as CardElement;
        for (const str of [c.title, c.value, c.subtitle]) {
          for (const m of str.matchAll(PH_RE)) fieldNames.add(m[1].trim());
        }
      } else if (cEl.type === "table") {
        const t = cEl as TableElement;
        for (const h of t.headers) for (const m of h.matchAll(PH_RE)) fieldNames.add(m[1].trim());
        if (t.rowsDataField) fieldNames.add(t.rowsDataField);
      } else if (cEl.type === "image") {
        const img = cEl as ImageElement;
        for (const m of img.label.matchAll(PH_RE)) fieldNames.add(m[1].trim());
        if (img.srcField) fieldNames.add(img.srcField);
      }
    }
    const hasChart = rep.cardElements.some((cEl) => cEl.type === "chart");
    inner = (
      <div
        style={{
          width: rep.width * s,
          border: "2px dashed #6366F1",
          borderRadius: 6 * s,
          background: "#EEF2FF",
          padding: `${8 * s}px`,
          fontFamily: `"${fontFamily}", sans-serif`,
          boxSizing: "border-box",
          opacity,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 * s, marginBottom: 6 * s }}>
          <span style={{ fontSize: 11 * s, fontWeight: 700, color: "#4338CA" }}>↻ Repeater</span>
          <span style={{ fontSize: 9 * s, color: "#6366F1", background: "#C7D2FE", borderRadius: 3 * s, padding: `${1 * s}px ${5 * s}px` }}>
            {rep.dataKey}
          </span>
        </div>
        <div
          style={{
            width: rep.cardWidth * s,
            height: rep.cardHeight * s,
            border: "1px solid #A5B4FC",
            borderRadius: 4 * s,
            background: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {rep.cardElements.map((cEl) => {
            let cardInner: React.ReactNode = null;
            if (cEl.type === "text" || cEl.type === "heading") {
              const tEl = cEl as TextElement;
              cardInner = (
                <div style={{ fontSize: tEl.fontSize * s, fontWeight: tEl.bold ? 700 : 400, color: tEl.color, width: tEl.width * s, fontFamily: `"${fontFamily}", sans-serif`, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                  {renderWithPlaceholders(tEl.content)}
                </div>
              );
            } else if (cEl.type === "chart") {
              cardInner = (
                <div style={{ width: (cEl as ChartElement).width * s, height: (cEl as ChartElement).height * s, background: "#F1F5F9", border: "1px dashed #94A3B8", borderRadius: 3 * s, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9 * s, color: "#64748B" }}>chart</span>
                </div>
              );
            } else if (cEl.type === "divider") {
              cardInner = <div style={{ width: (cEl as DividerElement).width * s, height: Math.max(1, (cEl as DividerElement).thickness * s), background: (cEl as DividerElement).color }} />;
            } else if (cEl.type === "card") {
              const c = cEl as CardElement;
              cardInner = (
                <div style={{ width: c.width * s, height: c.height * s, border: `${1 * s}px solid ${c.borderColor}`, borderRadius: 4 * s, background: c.bgColor, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 3 * s, background: c.accentColor, flexShrink: 0 }} />
                  <div style={{ padding: `${4 * s}px ${6 * s}px`, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 7 * s, fontWeight: 700, color: c.accentColor, textTransform: "uppercase" }}>{renderWithPlaceholders(c.title)}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2 * s }}>
                      <span style={{ fontSize: 16 * s, fontWeight: 700, color: "#1E293B", lineHeight: 1 }}>{renderWithPlaceholders(c.value)}</span>
                      <span style={{ fontSize: 7 * s, color: "#64748B" }}>{c.unit}</span>
                    </div>
                    <div style={{ fontSize: 6 * s, color: "#94A3B8" }}>{renderWithPlaceholders(c.subtitle)}</div>
                  </div>
                </div>
              );
            } else if (cEl.type === "table") {
              const t = cEl as TableElement;
              cardInner = (
                <table style={{ width: t.width * s, borderCollapse: "collapse", fontSize: (t.fontSize || 9) * s, fontFamily: `"${fontFamily}", sans-serif`, tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      {t.headers.map((h, i) => (
                        <th key={`rth-${i}`} style={{ background: t.headerColor, color: t.headerTextColor || "#fff", padding: `${2 * s}px ${3 * s}px`, textAlign: "left", fontWeight: 700, fontSize: 7 * s }}>{renderWithPlaceholders(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(t.rows.length > 0 ? t.rows.slice(0, 2) : [t.headers.map(() => "…")]).map((row, ri) => (
                      <tr key={`rtr-${ri}`}>
                        {row.map((cell, ci) => (
                          <td key={`rtd-${ci}`} style={{ padding: `${1 * s}px ${3 * s}px`, borderBottom: `${1 * s}px solid #E2E8F0`, fontSize: 7 * s, color: "#374151" }}>{renderWithPlaceholders(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {t.rowsDataField && <caption style={{ captionSide: "bottom", fontSize: 6 * s, color: "#6366F1", textAlign: "left", paddingTop: 2 * s }}>rows: {t.rowsDataField}</caption>}
                </table>
              );
            } else if (cEl.type === "image") {
              const img = cEl as ImageElement;
              cardInner = (
                <div style={{ width: img.width * s, height: img.height * s, background: img.src ? "transparent" : (img.bgColor || "#E2E8F0"), borderRadius: 3 * s, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {img.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.src} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 7 * s, color: "#64748B" }}>{img.srcField ? `img: ${img.srcField}` : img.label}</span>
                  )}
                </div>
              );
            }
            if (!cardInner) return null;
            return (
              <div key={cEl.id} style={{ position: "absolute", left: cEl.x * s, top: cEl.y * s, pointerEvents: "none" }}>
                {cardInner}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 5 * s, display: "flex", gap: 8 * s, flexWrap: "wrap" }}>
          <span style={{ fontSize: 8 * s, color: "#6366F1" }}>{rep.itemsPerRow} per row</span>
          <span style={{ fontSize: 8 * s, color: "#6366F1" }}>{rep.cardElements.length} elements</span>
          {fieldNames.size > 0 && <span style={{ fontSize: 8 * s, color: "#6366F1" }}>fields: {[...fieldNames].join(", ")}</span>}
          {hasChart && <span style={{ fontSize: 8 * s, color: "#6366F1" }}>chart</span>}
        </div>
      </div>
    );
  } else if (el.type === "table") {
    inner = (
      <table
        style={{
          width: el.width * s,
          borderCollapse: "collapse",
          fontSize: (el.fontSize || 11) * s,
          fontFamily: `"${fontFamily}", sans-serif`,
          tableLayout: "fixed",
          opacity,
        }}
      >
        <thead>
          <tr>
            {el.headers.map((h, i) => (
              <th
                key={`element-view-table-header-${i + 1}`}
                style={{
                  background: el.headerColor || "#1E40AF",
                  color: el.headerTextColor || "#fff",
                  padding: `${3 * s}px ${5 * s}px`,
                  textAlign: "left",
                  fontWeight: 700,
                  borderRight: "1px solid rgba(255,255,255,0.15)",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {renderWithPlaceholders(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {el.rows.map((row, ri) => (
            <tr
              key={`element-view-table-row-${ri + 1}`}
              style={{ background: ri % 2 === 0 ? "#F8FAFC" : "#fff" }}
            >
              {row.map((cell, ci) => (
                <td
                  key={`element-view-table-row-col-${ci + 1}`}
                  style={{
                    padding: `${3 * s}px ${5 * s}px`,
                    borderBottom: "1px solid #E2E8F0",
                    borderRight: "1px solid #E2E8F0",
                    color: "#374151",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                >
                  {renderWithPlaceholders(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        left: el.x * s,
        top: el.y * s,
        cursor: viewMode === "pan" ? "inherit" : "move",
        outline: selected ? "2px solid #3B82F6" : "2px solid transparent",
        boxSizing: "border-box",
        userSelect: "none",
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
    >
      {inner}
      {selected && (
        <>
          <div
            style={{
              position: "absolute",
              top: -1,
              left: -1,
              background: "#3B82F6",
              color: "#fff",
              fontSize: 9,
              padding: "1px 5px",
              borderRadius: "0 0 3px 0",
              pointerEvents: "none",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontFamily: "system-ui",
              fontWeight: 700,
            }}
          >
            {el.type}
            {el.type === "table" && (el as { mode?: string }).mode === "auto" && " · AUTO"}
            {el.type === "shape" && ` · ${(el as ShapeElement).shapeType}`}
          </div>
          <ResizeHandles el={el} scale={s} onResizeStart={onResizeStart} />
        </>
      )}
    </div>
  );
}
