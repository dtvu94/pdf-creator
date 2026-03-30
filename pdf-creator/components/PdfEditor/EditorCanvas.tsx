"use client";

import { useRef } from "react";
import type { TemplatePage, WatermarkConfig } from "@/types/template";
import ElementView from "../ElementView";
import { MousePointer2, Hand, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

type Section = "body" | "header" | "footer";

const ZOOM_STEP = 0.25;
const ZOOM_MIN  = 0.25;
const ZOOM_MAX  = 3;

interface EditorCanvasProps {
  currentPage: TemplatePage;
  canvasW: number;
  canvasH: number;
  headerH: number;
  footerH: number;
  fontFamily: string;
  activeSection: Section;
  selectedIds: Set<string>;
  selectedSection: Section;
  activePage: number;
  viewMode: "select" | "pan";
  zoom: number;
  editorScale: number;
  onDeselectAll: () => void;
  onSectionChange: (section: Section) => void;
  onSelectElement: (id: string, section: Section, additive: boolean) => void;
  onDragStart: (e: React.MouseEvent, id: string, section: Section) => void;
  onResizeStart: (e: React.MouseEvent, id: string, handle: string, section: Section) => void;
  onSectionResize: (e: React.MouseEvent, section: "header" | "footer") => void;
  onViewModeChange: (mode: "select" | "pan") => void;
  onZoomChange: (zoom: number) => void;
  watermark?: WatermarkConfig;
}

export default function EditorCanvas({
  currentPage,
  canvasW,
  canvasH,
  headerH,
  footerH,
  fontFamily,
  activeSection,
  selectedIds,
  selectedSection,
  activePage,
  viewMode,
  zoom,
  editorScale,
  onSectionChange,
  onSelectElement,
  onDragStart,
  onResizeStart,
  onSectionResize,
  onViewModeChange,
  onZoomChange,
  watermark,
}: Readonly<EditorCanvasProps>) {
  const viewportRef = useRef<HTMLDivElement>(null);

  function handleViewportMouseDown(e: React.MouseEvent) {
    if (viewMode !== "pan") return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollLeft = viewportRef.current?.scrollLeft ?? 0;
    const startScrollTop  = viewportRef.current?.scrollTop  ?? 0;
    const onMove = (ev: MouseEvent) => {
      if (!viewportRef.current) return;
      viewportRef.current.scrollLeft = startScrollLeft - (ev.clientX - startX);
      viewportRef.current.scrollTop  = startScrollTop  - (ev.clientY - startY);
    };
    const onUp = () => {
      globalThis.removeEventListener("mousemove", onMove);
      globalThis.removeEventListener("mouseup", onUp);
    };
    globalThis.addEventListener("mousemove", onMove);
    globalThis.addEventListener("mouseup", onUp);
  }

  const renderElements = (elements: TemplatePage["elements"], section: Section) =>
    elements.map((el) => (
      <ElementView
        key={el.id}
        el={el}
        selected={selectedIds.has(el.id) && selectedSection === section}
        scale={editorScale}
        fontFamily={fontFamily}
        viewMode={viewMode}
        onSelect={(id, additive) => onSelectElement(id, section, additive)}
        onDragStart={(e, id) => onDragStart(e, id, section)}
        onResizeStart={(e, id, handle) => onResizeStart(e, id, handle, section)}
      />
    ));

  return (
    <div className="canvas-wrapper">
    <div
      ref={viewportRef}
      onMouseDown={handleViewportMouseDown}
      className="canvas-viewport"
      style={{ cursor: viewMode === "pan" ? "grab" : "default" }}
    >
      {/* Plain container — section zones cover the full canvas height */}
      <div
        className="canvas-page"
        style={{ width: canvasW, height: canvasH }}
      >
        {/* ── Watermark overlay ── */}
        {watermark?.enabled && watermark.src &&
          (watermark.pages === "all" || watermark.pages.includes(activePage + 1)) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={watermark.src}
            alt="watermark"
            className="canvas-watermark"
            style={{
              left: watermark.x * editorScale,
              top: watermark.y * editorScale,
              width: watermark.width * editorScale,
              height: watermark.height * editorScale,
              opacity: watermark.opacity,
            }}
          />
        )}

        {/* ── Header zone ── */}
        {currentPage.header && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: headerH, zIndex: 1 }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (viewMode !== "pan") onSectionChange("header"); }}
              aria-label="Activate header section"
              aria-pressed={activeSection === "header"}
              className="reset-btn"
              style={{
                position: "absolute",
                inset: 0,
                background: activeSection === "header" ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.03)",
                borderBottom: `2px dashed ${activeSection === "header" ? "#3B82F6" : "#93C5FD"}`,
              }}
            >
              <span className="canvas-section-label-header">
                Header
              </span>
              {renderElements(currentPage.header.elements, "header")}
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSectionResize(e, "header"); }}
              aria-label="Drag to resize header section"
              className="reset-btn canvas-resize-handle"
              style={{ bottom: 0 }}
            />
          </div>
        )}

        {/* ── Footer zone ── */}
        {currentPage.footer && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: footerH, zIndex: 1 }}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSectionResize(e, "footer"); }}
              aria-label="Drag to resize footer section"
              className="reset-btn canvas-resize-handle"
              style={{ top: 0 }}
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (viewMode !== "pan") onSectionChange("footer"); }}
              aria-label="Activate footer section"
              aria-pressed={activeSection === "footer"}
              className="reset-btn"
              style={{
                position: "absolute",
                inset: 0,
                background: activeSection === "footer" ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.03)",
                borderTop: `2px dashed ${activeSection === "footer" ? "#10B981" : "#6EE7B7"}`,
              }}
            >
              <span className="canvas-section-label-footer">
                Footer
              </span>
              {renderElements(currentPage.footer.elements, "footer")}
            </button>
          </div>
        )}

        {/* ── Body zone ── */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (viewMode !== "pan") onSectionChange("body"); }}
          aria-label="Activate body section"
          aria-pressed={activeSection === "body"}
          className="reset-btn"
          style={{
            position: "absolute",
            top: headerH,
            bottom: footerH,
            left: 0,
            right: 0,
          }}
        >
          {renderElements(currentPage.elements, "body")}

          {currentPage.elements.length === 0 &&
            !currentPage.header &&
            !currentPage.footer && (
              <div className="canvas-empty">
                <div style={{ fontSize: 40 }}>📄</div>
                <div style={{ fontSize: 13 }}>Use the toolbar to add elements</div>
              </div>
            )}
        </button>
      </div>
    </div>

    {/* ── Floating: View mode (top-left) — positioned on the wrapper, not scrollable area ── */}
    <div className="floating-panel-tl">
      <button
        onClick={() => onViewModeChange("select")}
        title="Select & move elements"
        className={viewMode === "select" ? "floating-btn-active" : "floating-btn"}
      >
        <MousePointer2 size={16} />
      </button>
      <button
        onClick={() => onViewModeChange("pan")}
        title="Pan viewport"
        className={viewMode === "pan" ? "floating-btn-active" : "floating-btn"}
      >
        <Hand size={16} />
      </button>
    </div>

    {/* ── Floating: Zoom controls (bottom-right) — positioned on the wrapper ── */}
    <div className="floating-panel-br">
      <button
        onClick={() => onZoomChange(Math.max(ZOOM_MIN, Math.round((zoom - ZOOM_STEP) * 100) / 100))}
        disabled={zoom <= ZOOM_MIN}
        title="Zoom out"
        className="floating-btn"
        style={{ opacity: zoom <= ZOOM_MIN ? 0.4 : 1 }}
      >
        <ZoomOut size={16} />
      </button>
      <span className="zoom-label">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => onZoomChange(Math.min(ZOOM_MAX, Math.round((zoom + ZOOM_STEP) * 100) / 100))}
        disabled={zoom >= ZOOM_MAX}
        title="Zoom in"
        className="floating-btn"
        style={{ opacity: zoom >= ZOOM_MAX ? 0.4 : 1 }}
      >
        <ZoomIn size={16} />
      </button>
      <button
        onClick={() => onZoomChange(1)}
        title="Reset zoom to 100%"
        className="floating-btn"
      >
        <RotateCcw size={14} />
      </button>
    </div>
    </div>
  );
}
