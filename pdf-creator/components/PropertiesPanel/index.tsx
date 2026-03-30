"use client";

import { useEffect } from "react";
import type {
  TemplateElement,
  TextElement,
  LinkElement,
  DividerElement,
  TableElement,
  ImageElement,
  CardElement,
  ChartElement,
  RepeaterElement,
  ShapeElement,
} from "@/types/template";
import Field from "./Field";
import NumInput from "./NumInput";
import ColorInput from "./ColorInput";
import ImageSection from "./ImageSection";
import TableSection from "./TableSection";
import ChartSection from "./ChartSection";
import {
  ArrowUpToLine,
  ArrowDownToLine,
  MoveUp,
  MoveDown,
} from "lucide-react";

interface PropertiesPanelProps {
  el: TemplateElement | null;
  pageIdx: number;
  allElements: TemplateElement[];
  onUpdate: (pageIdx: number, elId: string, key: string, value: unknown) => void;
  onDelete: (pageIdx: number, elId: string) => void;
  onMoveZOrder: (dir: "up" | "down" | "top" | "bottom") => void;
}

export default function PropertiesPanel({
  el,
  pageIdx,
  allElements,
  onUpdate,
  onDelete,
  onMoveZOrder,
}: Readonly<PropertiesPanelProps>) {
  // Listen for toolbar text-align and shape-type events
  useEffect(() => {
    if (!el) return;
    const handleTextAlign = (e: Event) => {
      const align = (e as CustomEvent).detail;
      onUpdate(pageIdx, el.id, "textAlign", align);
    };
    const handleShapeType = (e: Event) => {
      const shapeType = (e as CustomEvent).detail;
      onUpdate(pageIdx, el.id, "shapeType", shapeType);
    };
    const handleListStyle = (e: Event) => {
      const listStyle = (e as CustomEvent).detail;
      onUpdate(pageIdx, el.id, "listStyle", listStyle);
    };
    globalThis.addEventListener("toolbar-text-align", handleTextAlign);
    globalThis.addEventListener("toolbar-shape-type", handleShapeType);
    globalThis.addEventListener("toolbar-list-style", handleListStyle);
    return () => {
      globalThis.removeEventListener("toolbar-text-align", handleTextAlign);
      globalThis.removeEventListener("toolbar-shape-type", handleShapeType);
      globalThis.removeEventListener("toolbar-list-style", handleListStyle);
    };
  }, [el, pageIdx, onUpdate]);

  if (!el) {
    return (
      <div className="props-empty">
        <div className="props-empty-icon">☝️</div>
        Select an element to edit its properties
      </div>
    );
  }

  const set = (key: string, value: unknown) =>
    onUpdate(pageIdx, el.id, key, value);

  const isText = el.type === "text" || el.type === "heading";
  const textEl = el as TextElement;
  const dividerEl = el as DividerElement;
  const tableEl = el as TableElement;
  const imageEl = el as ImageElement;
  const cardEl = el as CardElement;
  const chartEl = el as ChartElement;
  const repeaterEl = el as RepeaterElement;
  const linkEl = el as unknown as LinkElement;
  const shapeEl = el as ShapeElement;

  // Z-order info
  const elIdx = allElements.findIndex((e) => e.id === el.id);
  const isFirst = elIdx === 0;
  const isLast = elIdx === allElements.length - 1;

  return (
    <div className="props-panel-body">
      {/* Header */}
      <div className="props-header">
        <span className="props-el-type">
          {el.type}
          {el.type === "shape" && ` · ${shapeEl.shapeType}`}
        </span>
        <button
          onClick={() => onDelete(pageIdx, el.id)}
          className="props-delete-btn"
        >
          Delete
        </button>
      </div>

      {/* Position & Size */}
      <div className="section-card">
        <div className="section-title">Position & Size</div>
        <div className="grid-2col">
          {(["x", "y", "width", ...(el.type === "image" || el.type === "card" || el.type === "chart" || el.type === "shape" ? ["height"] : [])] as Array<keyof TemplateElement>).map((k) => (
            <div key={k as string}>
              <label className="field-label">
                {(k as string).toUpperCase()}
              </label>
              <NumInput
                value={el[k] as number}
                onChange={(v) => set(k as string, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div className="section-card">
        <div className="section-title">Appearance</div>
        <Field label="Opacity">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={el.opacity ?? 1}
            onChange={(e) => set("opacity", Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <span className="opacity-hint">{Math.round((el.opacity ?? 1) * 100)}%</span>
        </Field>
        <Field label="Rotation">
          <div className="flex-row" style={{ alignItems: "center", gap: 6 }}>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={el.rotation ?? 0}
              onChange={(e) => set("rotation", Number(e.target.value) || undefined)}
              style={{ flex: 1 }}
            />
            <NumInput
              value={el.rotation ?? 0}
              min={-360}
              max={360}
              onChange={(v) => set("rotation", v || undefined)}
            />
          </div>
        </Field>
      </div>

      {/* Layers / Z-order */}
      <div className="section-card">
        <div className="section-title">Layer Order</div>
        <div className="flex-row gap-4">
          <button onClick={() => onMoveZOrder("bottom")} disabled={isFirst} title="Send to back" className="z-order-btn" style={{ opacity: isFirst ? 0.4 : 1 }}>
            <ArrowDownToLine size={13} />
          </button>
          <button onClick={() => onMoveZOrder("down")} disabled={isFirst} title="Move backward" className="z-order-btn" style={{ opacity: isFirst ? 0.4 : 1 }}>
            <MoveDown size={13} />
          </button>
          <span className="opacity-hint" style={{ flex: 1, textAlign: "center" }}>
            {elIdx + 1} / {allElements.length}
          </span>
          <button onClick={() => onMoveZOrder("up")} disabled={isLast} title="Move forward" className="z-order-btn" style={{ opacity: isLast ? 0.4 : 1 }}>
            <MoveUp size={13} />
          </button>
          <button onClick={() => onMoveZOrder("top")} disabled={isLast} title="Bring to front" className="z-order-btn" style={{ opacity: isLast ? 0.4 : 1 }}>
            <ArrowUpToLine size={13} />
          </button>
        </div>
      </div>

      {/* Text / Heading */}
      {isText && (
        <div className="section-card">
          <div className="section-title">Typography</div>
          <Field label="Content">
            <textarea
              value={textEl.content}
              onChange={(e) => set("content", e.target.value)}
              rows={4}
              className="input"
              style={{ resize: "vertical" }}
            />
          </Field>
          <Field label="Font Size">
            <NumInput
              value={textEl.fontSize}
              onChange={(v) => set("fontSize", v)}
              min={6}
              max={72}
            />
          </Field>
          <Field label="Color">
            <ColorInput
              value={textEl.color}
              onChange={(v) => set("color", v)}
            />
          </Field>
          <Field label="Text Align">
            <div className="flex-row gap-4">
              {(["left", "center", "right", "justify"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => set("textAlign", a)}
                  className={(textEl.textAlign ?? "left") === a ? "toggle-btn-on" : "toggle-btn-off"}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Line Height">
            <NumInput
              value={textEl.lineHeight ?? 1.5}
              onChange={(v) => set("lineHeight", v)}
              min={0.5}
              max={4}
              step={0.1}
            />
          </Field>
          <div className="flex-row" style={{ gap: 16, marginTop: 4, flexWrap: "wrap" }}>
            {(
              [
                ["bold", "B", 700, "normal", "none"],
                ["italic", "I", 400, "italic", "none"],
                ["underline", "U", 400, "normal", "underline"],
                ["strikethrough", "S", 400, "normal", "line-through"],
              ] as const
            ).map(([key, label, fw, fs, td]) => (
              <label
                key={key}
                className="check-label"
              >
                <input
                  type="checkbox"
                  checked={!!textEl[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  style={{ margin: 0 }}
                />
                <span
                  className="sup-label"
                  style={{
                    fontWeight: fw,
                    fontStyle: fs,
                    textDecoration: td,
                  }}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
          <div className="flex-row" style={{ gap: 16, marginTop: 6 }}>
            <label className="check-label">
              <input
                type="checkbox"
                checked={!!textEl.superscript}
                onChange={(e) => { set("superscript", e.target.checked); if (e.target.checked) set("subscript", false); }}
                style={{ margin: 0 }}
              />
              <span className="sup-label">
                A<sup style={{ fontSize: 9 }}>sup</sup>
              </span>
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={!!textEl.subscript}
                onChange={(e) => { set("subscript", e.target.checked); if (e.target.checked) set("superscript", false); }}
                style={{ margin: 0 }}
              />
              <span className="sup-label">
                A<sub style={{ fontSize: 9 }}>sub</sub>
              </span>
            </label>
          </div>
          <Field label="List Style">
            <div className="flex-row gap-4">
              {(["none", "bullet", "numbered"] as const).map((ls) => (
                <button
                  key={ls}
                  onClick={() => set("listStyle", ls)}
                  className={(textEl.listStyle ?? "none") === ls ? "toggle-btn-on" : "toggle-btn-off"}
                >
                  {ls}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* Link */}
      {el.type === "link" && (
        <div className="section-card">
          <div className="section-title">Link</div>
          <Field label="Display Text">
            <input
              value={linkEl.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Click here"
              className="input"
            />
          </Field>
          <Field label="URL / Email">
            <input
              value={linkEl.href}
              onChange={(e) => set("href", e.target.value)}
              placeholder="https://… or mailto:…"
              className="input"
            />
          </Field>
          <Field label="Font Size">
            <NumInput value={linkEl.fontSize} onChange={(v) => set("fontSize", v)} min={6} max={72} />
          </Field>
          <Field label="Color">
            <ColorInput value={linkEl.color} onChange={(v) => set("color", v)} />
          </Field>
        </div>
      )}

      {/* Divider */}
      {el.type === "divider" && (
        <div className="section-card">
          <div className="section-title">Divider</div>
          <Field label="Color">
            <ColorInput
              value={dividerEl.color}
              onChange={(v) => set("color", v)}
            />
          </Field>
          <Field label="Thickness (pt)">
            <NumInput
              value={dividerEl.thickness}
              onChange={(v) => set("thickness", v)}
              min={1}
              max={10}
            />
          </Field>
        </div>
      )}

      {/* Image */}
      {el.type === "image" && (
        <ImageSection el={imageEl} set={set} />
      )}

      {/* Table */}
      {el.type === "table" && <TableSection el={tableEl} set={set} />}

      {/* Card */}
      {el.type === "card" && (
        <div className="section-card">
          <div className="section-title">Card</div>
          <Field label="Title">
            <input value={cardEl.title} onChange={(e) => set("title", e.target.value)} className="input" />
          </Field>
          <Field label="Value">
            <input value={cardEl.value} onChange={(e) => set("value", e.target.value)} className="input" />
          </Field>
          <Field label="Unit">
            <input value={cardEl.unit} onChange={(e) => set("unit", e.target.value)} className="input" />
          </Field>
          <Field label="Subtitle">
            <input value={cardEl.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="input" />
          </Field>
          <Field label="Accent Color">
            <ColorInput value={cardEl.accentColor} onChange={(v) => set("accentColor", v)} />
          </Field>
          <Field label="Background">
            <ColorInput value={cardEl.bgColor} onChange={(v) => set("bgColor", v)} />
          </Field>
          <Field label="Border Color">
            <ColorInput value={cardEl.borderColor} onChange={(v) => set("borderColor", v)} />
          </Field>
        </div>
      )}

      {/* Chart */}
      {el.type === "chart" && (
        <ChartSection el={chartEl} set={set} />
      )}

      {/* Shape */}
      {el.type === "shape" && (
        <div className="section-card">
          <div className="section-title">Shape</div>
          <Field label="Shape Type">
            <div className="flex-row gap-4" style={{ flexWrap: "wrap" }}>
              {(["rectangle", "circle", "line", "triangle", "diamond", "arrow", "heart"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => set("shapeType", t)}
                  className={shapeEl.shapeType === t ? "toggle-btn-on" : "toggle-btn-off"}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Fill Color">
            <ColorInput value={shapeEl.fillColor} onChange={(v) => set("fillColor", v)} />
          </Field>
          <Field label="Stroke Color">
            <ColorInput value={shapeEl.strokeColor} onChange={(v) => set("strokeColor", v)} />
          </Field>
          <div className="grid-2col">
            <Field label="Stroke Width">
              <NumInput value={shapeEl.strokeWidth} onChange={(v) => set("strokeWidth", v)} min={0} max={20} />
            </Field>
            {shapeEl.shapeType === "rectangle" && (
              <Field label="Border Radius">
                <NumInput value={shapeEl.borderRadius} onChange={(v) => set("borderRadius", v)} min={0} />
              </Field>
            )}
          </div>
        </div>
      )}

      {/* Repeater */}
      {el.type === "repeater" && (
        <>
          <div className="section-card">
            <div className="section-title">Repeater Settings</div>
            <Field label="Label">
              <input
                value={repeaterEl.label}
                onChange={(e) => set("label", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Data Key">
              <input
                value={repeaterEl.dataKey}
                onChange={(e) => set("dataKey", e.target.value)}
                className="input"
                placeholder="e.g. sensor_group"
              />
            </Field>
            <div className="grid-2col">
              <Field label="Card Width">
                <NumInput value={repeaterEl.cardWidth} onChange={(v) => set("cardWidth", v)} min={50} />
              </Field>
              <Field label="Card Height">
                <NumInput value={repeaterEl.cardHeight} onChange={(v) => set("cardHeight", v)} min={50} />
              </Field>
              <Field label="Items / Row">
                <NumInput value={repeaterEl.itemsPerRow} onChange={(v) => set("itemsPerRow", v)} min={1} max={6} />
              </Field>
              <Field label="Gap (pt)">
                <NumInput value={repeaterEl.gap} onChange={(v) => set("gap", v)} min={0} />
              </Field>
            </div>
          </div>

          <div className="section-card">
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <div className="section-title">Card Template Elements</div>
              <div style={{ position: "relative" }}>
                <select
                  value=""
                  onChange={(e) => {
                    const type = e.target.value;
                    if (!type) return;
                    const id = `cel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    const lastY = repeaterEl.cardElements.length > 0
                      ? Math.max(...repeaterEl.cardElements.map((c) => c.y + 20))
                      : 10;
                    let newEl: TemplateElement;
                    switch (type) {
                      case "text":
                        newEl = { id, x: 10, y: lastY, type: "text", content: "{{field}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: repeaterEl.cardWidth - 20 } as TextElement;
                        break;
                      case "heading":
                        newEl = { id, x: 10, y: lastY, type: "heading", content: "{{title}}", fontSize: 13, bold: true, italic: false, underline: false, color: "#1E40AF", width: repeaterEl.cardWidth - 20 } as TextElement;
                        break;
                      case "chart":
                        newEl = { id, x: 10, y: lastY, type: "chart", width: repeaterEl.cardWidth - 20, height: 120, option: {}, seriesDataField: "chartData" } as ChartElement;
                        break;
                      case "divider":
                        newEl = { id, x: 10, y: lastY, type: "divider", color: "#E2E8F0", width: repeaterEl.cardWidth - 20, thickness: 1 } as DividerElement;
                        break;
                      case "card":
                        newEl = { id, x: 10, y: lastY, type: "card", title: "{{title}}", value: "{{value}}", unit: "", subtitle: "{{subtitle}}", accentColor: "#3B82F6", bgColor: "#FFFFFF", borderColor: "#DBEAFE", width: repeaterEl.cardWidth - 20, height: 90 } as CardElement;
                        break;
                      case "table":
                        newEl = { id, x: 10, y: lastY, type: "table", headers: ["Col 1", "Col 2"], rows: [], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: repeaterEl.cardWidth - 20, rowsDataField: "tableData" } as TableElement;
                        break;
                      case "image":
                        newEl = { id, x: 10, y: lastY, type: "image", label: "Image", width: repeaterEl.cardWidth - 20, height: 80, bgColor: "#E2E8F0", srcField: "imageUrl" } as ImageElement;
                        break;
                      default:
                        return;
                    }
                    set("cardElements", [...repeaterEl.cardElements, newEl]);
                  }}
                  className="input input-sm"
                  style={{ padding: "2px 4px", width: 90, cursor: "pointer", color: "#4F46E5" }}
                >
                  <option value="">+ Add…</option>
                  <option value="text">Text</option>
                  <option value="heading">Heading</option>
                  <option value="card">Card</option>
                  <option value="chart">Chart</option>
                  <option value="table">Table</option>
                  <option value="image">Image</option>
                  <option value="divider">Divider</option>
                </select>
              </div>
            </div>
            {repeaterEl.cardElements.map((cEl, idx) => {
              const updateCardEl = (key: string, value: unknown) => {
                const updated = repeaterEl.cardElements.map((c, i) =>
                  i === idx ? { ...c, [key]: value } : c
                );
                set("cardElements", updated);
              };
              const removeCardEl = () => {
                set("cardElements", repeaterEl.cardElements.filter((_, i) => i !== idx));
              };
              const moveCardEl = (dir: -1 | 1) => {
                const arr = [...repeaterEl.cardElements];
                const newIdx = idx + dir;
                if (newIdx < 0 || newIdx >= arr.length) return;
                [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
                set("cardElements", arr);
              };
              return (
                <div
                  key={cEl.id}
                  className="card-el-block"
                >
                  <div className="card-el-header">
                    <span className="card-el-type">
                      {cEl.type} #{idx + 1}
                    </span>
                    <div className="flex-row gap-2">
                      <button onClick={() => moveCardEl(-1)} disabled={idx === 0} className="card-el-btn" title="Move up">▲</button>
                      <button onClick={() => moveCardEl(1)} disabled={idx === repeaterEl.cardElements.length - 1} className="card-el-btn" title="Move down">▼</button>
                      <button onClick={removeCardEl} className="card-el-btn-delete" title="Remove">✕</button>
                    </div>
                  </div>
                  {/* Position */}
                  <div className="grid-2col-4" style={{ marginBottom: 4 }}>
                    <Field label="X"><NumInput value={cEl.x} onChange={(v) => updateCardEl("x", v)} /></Field>
                    <Field label="Y"><NumInput value={cEl.y} onChange={(v) => updateCardEl("y", v)} /></Field>
                  </div>
                  {/* Text / Heading */}
                  {(cEl.type === "text" || cEl.type === "heading") && (
                    <>
                      <Field label="Content">
                        <textarea
                          value={(cEl as TextElement).content}
                          onChange={(e) => updateCardEl("content", e.target.value)}
                          rows={2}
                          className="input input-sm"
                          style={{ resize: "vertical" }}
                        />
                      </Field>
                      <div className="grid-2col-4">
                        <Field label="Font Size"><NumInput value={(cEl as TextElement).fontSize} onChange={(v) => updateCardEl("fontSize", v)} min={6} /></Field>
                        <Field label="Color"><ColorInput value={(cEl as TextElement).color} onChange={(v) => updateCardEl("color", v)} /></Field>
                      </div>
                      <Field label="Width"><NumInput value={(cEl as TextElement).width} onChange={(v) => updateCardEl("width", v)} min={10} /></Field>
                    </>
                  )}
                  {/* Chart */}
                  {cEl.type === "chart" && (
                    <>
                      <div className="grid-2col-4">
                        <Field label="Width"><NumInput value={(cEl as ChartElement).width} onChange={(v) => updateCardEl("width", v)} min={20} /></Field>
                        <Field label="Height"><NumInput value={(cEl as ChartElement).height} onChange={(v) => updateCardEl("height", v)} min={20} /></Field>
                      </div>
                      <Field label="Series Data Field">
                        <input
                          value={(cEl as ChartElement).seriesDataField ?? ""}
                          onChange={(e) => updateCardEl("seriesDataField", e.target.value)}
                          className="input input-sm"
                          placeholder="e.g. chartData"
                        />
                      </Field>
                    </>
                  )}
                  {/* Divider */}
                  {cEl.type === "divider" && (
                    <div className="grid-2col-4">
                      <Field label="Width"><NumInput value={(cEl as DividerElement).width} onChange={(v) => updateCardEl("width", v)} min={10} /></Field>
                      <Field label="Thickness"><NumInput value={(cEl as DividerElement).thickness} onChange={(v) => updateCardEl("thickness", v)} min={1} max={10} /></Field>
                      <Field label="Color"><ColorInput value={(cEl as DividerElement).color} onChange={(v) => updateCardEl("color", v)} /></Field>
                    </div>
                  )}
                  {/* Card */}
                  {cEl.type === "card" && (
                    <>
                      <Field label="Title"><input value={(cEl as CardElement).title} onChange={(e) => updateCardEl("title", e.target.value)} className="input input-sm" placeholder="{{title}}" /></Field>
                      <Field label="Value"><input value={(cEl as CardElement).value} onChange={(e) => updateCardEl("value", e.target.value)} className="input input-sm" placeholder="{{value}}" /></Field>
                      <div className="grid-2col-4">
                        <Field label="Unit"><input value={(cEl as CardElement).unit} onChange={(e) => updateCardEl("unit", e.target.value)} className="input input-sm" /></Field>
                        <Field label="Subtitle"><input value={(cEl as CardElement).subtitle} onChange={(e) => updateCardEl("subtitle", e.target.value)} className="input input-sm" placeholder="{{subtitle}}" /></Field>
                        <Field label="Width"><NumInput value={(cEl as CardElement).width} onChange={(v) => updateCardEl("width", v)} min={20} /></Field>
                        <Field label="Height"><NumInput value={(cEl as CardElement).height} onChange={(v) => updateCardEl("height", v)} min={20} /></Field>
                        <Field label="Accent"><ColorInput value={(cEl as CardElement).accentColor} onChange={(v) => updateCardEl("accentColor", v)} /></Field>
                        <Field label="Background"><ColorInput value={(cEl as CardElement).bgColor} onChange={(v) => updateCardEl("bgColor", v)} /></Field>
                      </div>
                    </>
                  )}
                  {/* Table */}
                  {cEl.type === "table" && (
                    <>
                      <div className="grid-2col-4">
                        <Field label="Width"><NumInput value={(cEl as TableElement).width} onChange={(v) => updateCardEl("width", v)} min={20} /></Field>
                        <Field label="Font Size"><NumInput value={(cEl as TableElement).fontSize} onChange={(v) => updateCardEl("fontSize", v)} min={6} /></Field>
                      </div>
                      <Field label="Headers (comma-separated)">
                        <input
                          value={(cEl as TableElement).headers.join(", ")}
                          onChange={(e) => updateCardEl("headers", e.target.value.split(",").map((s) => s.trim()))}
                          className="input input-sm"
                          placeholder="Col 1, Col 2, Col 3"
                        />
                      </Field>
                      <Field label="Rows Data Field">
                        <input
                          value={(cEl as TableElement).rowsDataField ?? ""}
                          onChange={(e) => updateCardEl("rowsDataField", e.target.value)}
                          className="input input-sm"
                          placeholder="e.g. tableData"
                        />
                      </Field>
                      <Field label="Header Color"><ColorInput value={(cEl as TableElement).headerColor} onChange={(v) => updateCardEl("headerColor", v)} /></Field>
                    </>
                  )}
                  {/* Image */}
                  {cEl.type === "image" && (
                    <>
                      <div className="grid-2col-4">
                        <Field label="Width"><NumInput value={(cEl as ImageElement).width} onChange={(v) => updateCardEl("width", v)} min={10} /></Field>
                        <Field label="Height"><NumInput value={(cEl as ImageElement).height} onChange={(v) => updateCardEl("height", v)} min={10} /></Field>
                      </div>
                      <Field label="Label"><input value={(cEl as ImageElement).label} onChange={(e) => updateCardEl("label", e.target.value)} className="input input-sm" /></Field>
                      <Field label="Image Source Field">
                        <input
                          value={(cEl as ImageElement).srcField ?? ""}
                          onChange={(e) => updateCardEl("srcField", e.target.value)}
                          className="input input-sm"
                          placeholder="e.g. imageUrl"
                        />
                      </Field>
                    </>
                  )}
                </div>
              );
            })}
            {repeaterEl.cardElements.length === 0 && (
              <div className="card-el-empty">
                No card elements yet. Use &quot;+ Add&quot; above to add elements.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
