"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Template, TemplatePage, TemplateElement } from "@/types/template";
import PageSizeSelector from "../PageSizeSelector";
import FontSelector from "../FontSelector";
import PlaceholderPicker from "../PlaceholderPicker";
import { extractPlaceholders } from "@/lib/placeholders";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Heading,
  Type,
  Table,
  Minus,
  Image,
  RectangleHorizontal,
  BarChart3,
  Repeat,
  Upload,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  MoveUp,
  MoveDown,
  AlignStartVertical,
  AlignCenterHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Square,
  Circle,
  Spline,
  Triangle,
  Diamond,
  ArrowRight,
  Heart,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  FileSignature,
  Droplets,
  Lock,
  PenTool,
  ImageDown,
  ClipboardCopy,
  ClipboardCheck,
  Share2,
  History,
} from "lucide-react";

type Section = "body" | "header" | "footer";

function sectionActiveBackground(s: Section): string {
  if (s === "header") return "#1D4ED8";
  if (s === "footer") return "#065F46";
  return "#334155";
}

function sectionActiveBorder(s: Section): string {
  if (s === "header") return "#3B82F6";
  if (s === "footer") return "#10B981";
  return "#64748B";
}

const ExportPdfButton = dynamic(() => import("../ExportPdfButton"), {
  ssr: false,
  loading: () => (
    <span className="btn btn-slate" style={{ opacity: 0.6 }}>Loading…</span>
  ),
});

const ICON_SIZE = 14;
const ICON_SM = 13;

/* ── Element groups for row 3 ─────────────────────────────────────────────── */

const LAYOUT_ITEMS: Array<{ type: TemplateElement["type"]; icon: React.ReactNode; label: string }> = [
  { type: "repeater", icon: <Repeat size={ICON_SIZE} />,  label: "Repeater" },
  { type: "shape",    icon: <Square size={ICON_SIZE} />,   label: "Shape"    },
];

const CONTENT_ITEMS: Array<{ type: TemplateElement["type"]; icon: React.ReactNode; label: string }> = [
  { type: "card",     icon: <RectangleHorizontal size={ICON_SIZE} />, label: "Card"    },
  { type: "heading",  icon: <Heading size={ICON_SIZE} />,             label: "Heading" },
  { type: "text",     icon: <Type size={ICON_SIZE} />,                label: "Text"    },
  { type: "link",     icon: <LinkIcon size={ICON_SIZE} />,            label: "Link"    },
  { type: "image",    icon: <Image size={ICON_SIZE} />,               label: "Image"   },
  { type: "table",    icon: <Table size={ICON_SIZE} />,               label: "Table"   },
  { type: "chart",    icon: <BarChart3 size={ICON_SIZE} />,           label: "Chart"   },
  { type: "divider",  icon: <Minus size={ICON_SIZE} />,               label: "Divider" },
];

interface ToolbarProps {
  template: Template;
  currentPage: TemplatePage;
  selectedEl: TemplateElement | null;
  selectedEls: TemplateElement[];
  selectedIds: Set<string>;
  activeSection: Section;
  canUndo: boolean;
  canRedo: boolean;
  clipboard: TemplateElement[];
  onBack?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveJSON: () => void;
  onLoadJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyTemplate: () => void;
  onPasteTemplate: () => void;
  onShareUrl: () => void;
  onAddElement: (type: TemplateElement["type"]) => void;
  onInsertPlaceholder: (name: string) => void;
  onToggleSection: (type: "header" | "footer") => void;
  onSectionChange: (section: Section) => void;
  onPageSizeChange: (s: NonNullable<Template["pageSize"]>) => void;
  onFontChange: (family: string) => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveZOrder: (dir: "up" | "down" | "top" | "bottom") => void;
  onAlign: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom" | "distribute-h" | "distribute-v") => void;
  includeMetadata: boolean;
  onToggleMetadata: () => void;
  includePassword: boolean;
  onTogglePassword: () => void;
  includePdfA: boolean;
  onTogglePdfA: () => void;
  includeSignature: boolean;
  onToggleSignature: () => void;
  watermarkEnabled: boolean;
  onToggleWatermark: () => void;
  compressionEnabled: boolean;
  onToggleCompression: () => void;
  versionsEnabled: boolean;
  onToggleVersions: () => void;
}

export default function Toolbar({
  template,
  currentPage,
  selectedEl,
  selectedEls,
  selectedIds,
  activeSection,
  canUndo,
  canRedo,
  clipboard,
  onBack,
  onUndo,
  onRedo,
  onSaveJSON,
  onLoadJSON,
  onCopyTemplate,
  onPasteTemplate,
  onShareUrl,
  onAddElement,
  onInsertPlaceholder,
  onToggleSection,
  onSectionChange,
  onPageSizeChange,
  onFontChange,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onMoveZOrder,
  onAlign,
  includeMetadata,
  onToggleMetadata,
  includePassword,
  onTogglePassword,
  includePdfA,
  onTogglePdfA,
  includeSignature,
  onToggleSignature,
  watermarkEnabled,
  onToggleWatermark,
  compressionEnabled,
  onToggleCompression,
  versionsEnabled,
  onToggleVersions,
}: Readonly<ToolbarProps>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(true);
  const hasSelection = selectedIds.size > 0;
  const multiSelect = selectedIds.size > 1;
  const isText = selectedEl?.type === "text" || selectedEl?.type === "heading";
  const textAlign = isText ? ((selectedEl as { textAlign?: string }).textAlign ?? "left") : "left";

  return (
    <>
      {/* ── Row 1: nav + title + undo/redo + file actions ──────────────── */}
      <div className="toolbar-row toolbar-row-1">
        {onBack && (
          <button
            onClick={onBack}
            className="btn-element"
          >
            <ArrowLeft size={ICON_SIZE} style={{ color: "#CBD5E1" }} />
            <span style={{ color: "#E2E8F0" }}>Templates</span>
          </button>
        )}

        <span className="toolbar-title">
          <FileText size={ICON_SIZE} /> PDF Creator
        </span>

        <div className="toolbar-sep" />

        {/* Undo / Redo */}
        <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="icon-btn" style={{ opacity: canUndo ? 1 : 0.35 }}>
          <Undo2 size={16} />
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="icon-btn" style={{ opacity: canRedo ? 1 : 0.35 }}>
          <Redo2 size={16} />
        </button>

        <div className="flex-1" />

        <button onClick={onSaveJSON} className="btn btn-sky">
          <Download size={ICON_SIZE} /> Save JSON
        </button>
        <button onClick={() => fileRef.current?.click()} className="btn btn-violet">
          <Upload size={ICON_SIZE} /> Load JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={onLoadJSON}
        />

        <button onClick={onCopyTemplate} title="Copy template JSON to clipboard" className="btn btn-slate">
          <ClipboardCopy size={ICON_SIZE} /> Copy
        </button>
        <button onClick={onPasteTemplate} title="Paste template JSON from clipboard" className="btn btn-slate">
          <ClipboardCheck size={ICON_SIZE} /> Paste
        </button>
        <button onClick={onShareUrl} title="Copy shareable URL to clipboard" className="btn btn-teal">
          <Share2 size={ICON_SIZE} /> Share
        </button>

        <ExportPdfButton template={template} includeMetadata={includeMetadata} includePassword={includePassword} includePdfA={includePdfA} includeSignature={includeSignature} />

        <div className="toolbar-sep" />

        <button
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? "Collapse toolbar" : "Expand toolbar"}
          aria-label={expanded ? "Collapse toolbar" : "Expand toolbar"}
          className="toolbar-expand-btn"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* ── Row 2: page layout + font + metadata toggle ───────────────── */}
      {expanded && <div className="toolbar-row toolbar-row-2">
        <PageSizeSelector
          value={template.pageSize}
          onChange={onPageSizeChange}
        />

        <FontSelector
          value={template.fontFamily}
          onChange={onFontChange}
        />

        <div className="toolbar-sep" />

        <button
          onClick={onToggleMetadata}
          title={includeMetadata ? "Metadata will be included during export" : "Click to include PDF metadata during export"}
          className="toolbar-toggle"
          style={{
            background: includeMetadata ? "#7C3AED" : "#1E293B",
            border: `1px solid ${includeMetadata ? "#A78BFA" : "#334155"}`,
          }}
        >
          <FileSignature size={ICON_SIZE} style={{ color: includeMetadata ? "#E9D5FF" : "#94A3B8" }} />
          <span className="toolbar-toggle-label" style={{ color: includeMetadata ? "#F5F3FF" : "#CBD5E1" }}>Metadata</span>
        </button>

        <button
          onClick={onTogglePassword}
          title={includePassword ? "Password protection enabled — click to disable" : "Click to add password protection to exported PDF"}
          className="toolbar-toggle"
          style={{
            background: includePassword ? "#B45309" : "#1E293B",
            border: `1px solid ${includePassword ? "#F59E0B" : "#334155"}`,
          }}
        >
          <Lock size={ICON_SIZE} style={{ color: includePassword ? "#FEF3C7" : "#94A3B8" }} />
          <span className="toolbar-toggle-label" style={{ color: includePassword ? "#FFFBEB" : "#CBD5E1" }}>Password</span>
        </button>

        <button
          onClick={onTogglePdfA}
          title={includePdfA ? "PDF/A archival enabled — click to disable" : "Click to export as PDF/A (archival format)"}
          className="toolbar-toggle"
          style={{
            background: includePdfA ? "#065F46" : "#1E293B",
            border: `1px solid ${includePdfA ? "#34D399" : "#334155"}`,
          }}
        >
          <FileSignature size={ICON_SIZE} style={{ color: includePdfA ? "#A7F3D0" : "#94A3B8" }} />
          <span className="toolbar-toggle-label" style={{ color: includePdfA ? "#ECFDF5" : "#CBD5E1" }}>PDF/A</span>
        </button>

        <button
          onClick={onToggleSignature}
          title={includeSignature ? "Digital signature enabled — click to disable" : "Click to digitally sign the exported PDF"}
          className="toolbar-toggle"
          style={{
            background: includeSignature ? "#7C2D12" : "#1E293B",
            border: `1px solid ${includeSignature ? "#FB923C" : "#334155"}`,
          }}
        >
          <PenTool size={ICON_SIZE} style={{ color: includeSignature ? "#FED7AA" : "#94A3B8" }} />
          <span className="toolbar-toggle-label" style={{ color: includeSignature ? "#FFF7ED" : "#CBD5E1" }}>Sign</span>
        </button>

        <button
          onClick={onToggleWatermark}
          title={watermarkEnabled ? "Watermark enabled — click to disable" : "Click to enable watermark overlay"}
          className="toolbar-toggle"
          style={{
            background: watermarkEnabled ? "#0E7490" : "#1E293B",
            border: `1px solid ${watermarkEnabled ? "#22D3EE" : "#334155"}`,
          }}
        >
          <Droplets size={ICON_SIZE} style={{ color: watermarkEnabled ? "#CFFAFE" : "#94A3B8" }} />
          <span className="toolbar-toggle-label" style={{ color: watermarkEnabled ? "#ECFEFF" : "#CBD5E1" }}>Watermark</span>
        </button>

        <button
          onClick={onToggleCompression}
          title={compressionEnabled ? "Compression enabled — click to disable" : "Click to enable image compression"}
          className="toolbar-toggle"
          style={{
            background: compressionEnabled ? "#4338CA" : "#1E293B",
            border: `1px solid ${compressionEnabled ? "#818CF8" : "#334155"}`,
          }}
        >
          <ImageDown size={ICON_SIZE} style={{ color: compressionEnabled ? "#E0E7FF" : "#94A3B8" }} />
          <span className="toolbar-toggle-label" style={{ color: compressionEnabled ? "#EEF2FF" : "#CBD5E1" }}>Compress</span>
        </button>

        <button
          onClick={onToggleVersions}
          title={versionsEnabled ? "Version history open — click to close" : "Click to open version history"}
          className="toolbar-toggle"
          style={{
            background: versionsEnabled ? "#7C3AED" : "#1E293B",
            border: `1px solid ${versionsEnabled ? "#A78BFA" : "#334155"}`,
          }}
        >
          <History size={ICON_SIZE} style={{ color: versionsEnabled ? "#EDE9FE" : "#94A3B8" }} />
          <span className="toolbar-toggle-label" style={{ color: versionsEnabled ? "#F5F3FF" : "#CBD5E1" }}>Versions</span>
        </button>
      </div>}

      {/* ── Row 3: element insert — layout | content + placeholder ─────── */}
      {expanded && <div className="toolbar-row toolbar-row-3">
        {/* Section 1: Layout elements */}
        {LAYOUT_ITEMS.map(({ type, icon, label }) => (
          <button key={type} onClick={() => onAddElement(type)} className="btn-element" title={`Add ${label}`}>
            <span className="btn-element-icon">{icon}</span>
            <span className="btn-element-label">{label}</span>
          </button>
        ))}

        <div className="toolbar-sep" />

        {/* Section 2: Content elements */}
        {CONTENT_ITEMS.map(({ type, icon, label }) => (
          <button key={type} onClick={() => onAddElement(type)} className="btn-element" title={`Add ${label}`}>
            <span className="btn-element-icon">{icon}</span>
            <span className="btn-element-label">{label}</span>
          </button>
        ))}

        <PlaceholderPicker
          existingPlaceholders={extractPlaceholders(template)}
          onInsert={onInsertPlaceholder}
          disabled={selectedEl?.type !== "text" && selectedEl?.type !== "heading"}
        />
      </div>}

      {/* ── Row 4: context tools + sections ───────────────────────────── */}
      {expanded && <div className="toolbar-row toolbar-row-4">
        {/* ── Edit actions (copy/paste/dup/delete) ── */}
        {hasSelection && (
          <>
            <button onClick={onCopy} title="Copy (Ctrl+C)" className="icon-btn">
              <Copy size={ICON_SM} />
            </button>
            <button onClick={onPaste} title="Paste (Ctrl+V)" className="icon-btn" style={{ opacity: clipboard.length > 0 ? 1 : 0.35 }}>
              <ClipboardPaste size={ICON_SM} />
            </button>
            <button onClick={onDuplicate} title="Duplicate (Ctrl+D)" className="icon-btn">
              <CopyPlus size={ICON_SM} />
            </button>
            <button onClick={onDelete} title="Delete (Del)" className="icon-btn" style={{ color: "#F87171" }}>
              <Trash2 size={ICON_SM} />
            </button>
            <div className="toolbar-sep" />
          </>
        )}

        {/* ── Z-order (single select) ── */}
        {hasSelection && !multiSelect && (
          <>
            <button onClick={() => onMoveZOrder("top")} title="Bring to front" className="icon-btn">
              <ArrowUpToLine size={ICON_SM} />
            </button>
            <button onClick={() => onMoveZOrder("up")} title="Move forward" className="icon-btn">
              <MoveUp size={ICON_SM} />
            </button>
            <button onClick={() => onMoveZOrder("down")} title="Move backward" className="icon-btn">
              <MoveDown size={ICON_SM} />
            </button>
            <button onClick={() => onMoveZOrder("bottom")} title="Send to back" className="icon-btn">
              <ArrowDownToLine size={ICON_SM} />
            </button>
            <div className="toolbar-sep" />
          </>
        )}

        {/* ── Alignment (multi-select) ── */}
        {multiSelect && (
          <>
            <span className="toolbar-label">Align:</span>
            <button onClick={() => onAlign("left")} title="Align left" className="icon-btn">
              <AlignStartVertical size={ICON_SM} />
            </button>
            <button onClick={() => onAlign("center")} title="Align center" className="icon-btn">
              <AlignCenterHorizontal size={ICON_SM} />
            </button>
            <button onClick={() => onAlign("right")} title="Align right" className="icon-btn">
              <AlignEndVertical size={ICON_SM} />
            </button>
            <button onClick={() => onAlign("top")} title="Align top" className="icon-btn">
              <AlignStartHorizontal size={ICON_SM} />
            </button>
            <button onClick={() => onAlign("middle")} title="Align middle" className="icon-btn">
              <AlignCenterVertical size={ICON_SM} />
            </button>
            <button onClick={() => onAlign("bottom")} title="Align bottom" className="icon-btn">
              <AlignEndHorizontal size={ICON_SM} />
            </button>
            {selectedEls.length >= 3 && (
              <>
                <button onClick={() => onAlign("distribute-h")} title="Distribute horizontally" className="icon-btn">
                  <AlignHorizontalSpaceAround size={ICON_SM} />
                </button>
                <button onClick={() => onAlign("distribute-v")} title="Distribute vertically" className="icon-btn">
                  <AlignVerticalSpaceAround size={ICON_SM} />
                </button>
              </>
            )}
            <div className="toolbar-sep" />
          </>
        )}

        {/* ── Text alignment (single text element selected) ── */}
        {isText && !multiSelect && (
          <>
            <span className="toolbar-label">Text:</span>
            {(
              [
                ["left", <AlignLeft key="al" size={ICON_SM} />],
                ["center", <AlignCenter key="ac" size={ICON_SM} />],
                ["right", <AlignRight key="ar" size={ICON_SM} />],
                ["justify", <AlignJustify key="aj" size={ICON_SM} />],
              ] as const
            ).map(([align, icon]) => (
              <button
                key={align}
                onClick={() => {
                  if (selectedEl) {
                    const event = new CustomEvent("toolbar-text-align", { detail: align });
                    globalThis.dispatchEvent(event);
                  }
                }}
                title={`Align ${align}`}
                className={textAlign === align ? "icon-btn-active" : "icon-btn"}
              >
                {icon}
              </button>
            ))}
            <div className="toolbar-sep" />
            {(
              [
                ["none", <Type key="no" size={ICON_SM} />],
                ["bullet", <List key="bu" size={ICON_SM} />],
                ["numbered", <ListOrdered key="nu" size={ICON_SM} />],
              ] as const
            ).map(([ls, icon]) => (
              <button
                key={ls}
                onClick={() => {
                  if (selectedEl) {
                    const event = new CustomEvent("toolbar-list-style", { detail: ls });
                    globalThis.dispatchEvent(event);
                  }
                }}
                title={ls === "none" ? "Plain text" : `${ls} list`}
                className={(selectedEl as { listStyle?: string }).listStyle === ls || (!((selectedEl as { listStyle?: string }).listStyle) && ls === "none") ? "icon-btn-active" : "icon-btn"}
              >
                {icon}
              </button>
            ))}
            <div className="toolbar-sep" />
          </>
        )}

        {/* ── Shape shortcuts ── */}
        {selectedEl?.type === "shape" && !multiSelect && (
          <>
            <span className="toolbar-label">Shape:</span>
            {(
              [
                ["rectangle", <Square key="sq" size={ICON_SM} />],
                ["circle", <Circle key="ci" size={ICON_SM} />],
                ["line", <Spline key="li" size={ICON_SM} />],
                ["triangle", <Triangle key="tr" size={ICON_SM} />],
                ["diamond", <Diamond key="di" size={ICON_SM} />],
                ["arrow", <ArrowRight key="ar" size={ICON_SM} />],
                ["heart", <Heart key="he" size={ICON_SM} />],
              ] as const
            ).map(([shape, icon]) => (
              <button
                key={shape}
                onClick={() => {
                  const event = new CustomEvent("toolbar-shape-type", { detail: shape });
                  globalThis.dispatchEvent(event);
                }}
                title={shape}
                className={(selectedEl as { shapeType?: string }).shapeType === shape ? "icon-btn-active" : "icon-btn"}
              >
                {icon}
              </button>
            ))}
            <div className="toolbar-sep" />
          </>
        )}

        {/* ── Page sections ── */}
        <span className="toolbar-section-label">Sections:</span>

        <button
          onClick={() => onToggleSection("header")}
          title={currentPage.header ? "Remove header section" : "Add header section"}
          className="toolbar-toggle"
          style={{
            background: currentPage.header ? "#1D4ED8" : "#1E293B",
            border: `1px solid ${currentPage.header ? "#3B82F6" : "#334155"}`,
          }}
        >
          <ChevronUp size={12} style={{ color: currentPage.header ? "#93C5FD" : "#94A3B8" }} />
          <span style={{ color: currentPage.header ? "#BFDBFE" : "#CBD5E1" }}>Header</span>
        </button>

        <button
          onClick={() => onToggleSection("footer")}
          title={currentPage.footer ? "Remove footer section" : "Add footer section"}
          className="toolbar-toggle"
          style={{
            background: currentPage.footer ? "#065F46" : "#1E293B",
            border: `1px solid ${currentPage.footer ? "#10B981" : "#334155"}`,
          }}
        >
          <ChevronDown size={12} style={{ color: currentPage.footer ? "#6EE7B7" : "#94A3B8" }} />
          <span style={{ color: currentPage.footer ? "#A7F3D0" : "#CBD5E1" }}>Footer</span>
        </button>

        {/* Active section indicator */}
        {(currentPage.header || currentPage.footer) && (
          <>
            <div className="toolbar-sep" />
            <span className="toolbar-label">Target:</span>
            {(["body", "header", "footer"] as Section[])
              .filter((s) => s === "body" || (s === "header" && !!currentPage.header) || (s === "footer" && !!currentPage.footer))
              .map((s) => (
                <button
                  key={s}
                  onClick={() => onSectionChange(s)}
                  className="toolbar-toggle"
                  style={{
                    background: activeSection === s ? sectionActiveBackground(s) : "#1E293B",
                    border: `1px solid ${activeSection === s ? sectionActiveBorder(s) : "#1E293B"}`,
                    textTransform: "capitalize",
                  }}
                >
                  <span style={{ color: "#CBD5E1" }}>{s}</span>
                </button>
              ))}
          </>
        )}
      </div>}
    </>
  );
}
