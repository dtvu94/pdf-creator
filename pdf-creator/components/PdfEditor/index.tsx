"use client";

import { useState } from "react";
import type { Template, WatermarkConfig, CompressionConfig } from "@/types/template";
import { DEFAULT_TEMPLATE, CANVAS_SCALE, getPageDimensions } from "@/lib/templates";
import { useHistory } from "@/lib/useHistory";
import { useEditorFonts } from "@/lib/useEditorFonts";
import PropertiesPanel from "../PropertiesPanel";
import WatermarkPanel from "../PropertiesPanel/WatermarkPanel";
import CompressionPanel from "../PropertiesPanel/CompressionPanel";
import VersionHistoryPanel from "../PropertiesPanel/VersionHistoryPanel";
import MissingFontsModal from "../modals/MissingFontsModal";
import Toolbar from "./Toolbar";
import PageNavigator from "./PageNavigator";
import EditorCanvas from "./EditorCanvas";
import { getSectionElements } from "./templateUtils";
import { useSelection } from "./useSelection";
import { usePageManagement } from "./usePageManagement";
import { useElementActions } from "./useElementActions";
import { useDragAndResize } from "./useDragAndResize";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useJsonIO } from "./useJsonIO";
import { useAutoSave } from "@/lib/useAutoSave";
import { useVersionHistory } from "@/lib/useVersionHistory";

interface PdfEditorProps {
  initialTemplate?: Template;
  templateId?: string;
  onBack?: () => void;
}

const DEFAULT_WATERMARK: WatermarkConfig = {
  enabled: true, pages: "all", width: 200, height: 200,
  x: 197, y: 321, opacity: 0.15,
};

export default function PdfEditor({ initialTemplate, templateId, onBack }: Readonly<PdfEditorProps>) {
  useEditorFonts();
  const history = useHistory<Template>(initialTemplate ?? DEFAULT_TEMPLATE);
  const template = history.state;
  const setTemplate = history.set;

  // Auto-save to localStorage on every template change
  useAutoSave(templateId ?? "default", template);

  // ── Feature flags ─────────────────────────────────────────────────────────
  const [includeMetadata, setIncludeMetadata] = useState(template.includeMetadata ?? false);
  const [includePassword, setIncludePassword] = useState(false);
  const [includePdfA, setIncludePdfA] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [loadMissingFonts, setLoadMissingFonts] = useState<import("@/types/template").TemplateFont[]>([]);
  const [viewMode, setViewMode] = useState<"select" | "pan">("select");
  const [showPages, setShowPages] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [zoom, setZoom] = useState(1);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const page = usePageManagement(template, setTemplate);
  const selection = useSelection(template, page.activePage);
  const actions = useElementActions({
    template, setTemplate,
    activePage: page.activePage,
    activeSection: page.activeSection,
    selectedIds: selection.selectedIds,
    selectedPageIdx: selection.selectedPageIdx,
    selectedSection: selection.selectedSection,
    selectedId: selection.selectedId,
    selectedEl: selection.selectedEl,
    setSelectedIds: selection.setSelectedIds,
    setSelectedPageIdx: selection.setSelectedPageIdx,
    setSelectedSection: selection.setSelectedSection,
  });

  const editorScale = CANVAS_SCALE * zoom;

  const drag = useDragAndResize({
    template, setTemplate,
    activePage: page.activePage,
    editorScale,
    selectedIds: selection.selectedIds,
  });

  const jsonIO = useJsonIO({
    template, setTemplate,
    setSelectedIds: selection.setSelectedIds,
    setActivePage: page.setActivePage,
    setActiveSection: page.setActiveSection,
    setLoadMissingFonts,
  });

  useKeyboardShortcuts({
    undo: history.undo,
    redo: history.redo,
    copySelected: actions.copySelected,
    pasteElements: actions.pasteElements,
    duplicateSelected: actions.duplicateSelected,
    deleteSelected: actions.deleteSelected,
    selectAll: () => {
      const els = getSectionElements(page.activeSection, template.pages[page.activePage]);
      selection.setSelectedIds(new Set(els.map((e) => e.id)));
      selection.setSelectedSection(page.activeSection);
      selection.setSelectedPageIdx(page.activePage);
    },
  });

  // ── Watermark ─────────────────────────────────────────────────────────────
  const watermark = template.watermark ?? { ...DEFAULT_WATERMARK, enabled: false };

  const toggleWatermark = () => {
    setTemplate((t) => ({
      ...t,
      watermark: { ...(t.watermark ?? DEFAULT_WATERMARK), enabled: !(t.watermark?.enabled ?? false) },
    }));
  };

  const updateWatermark = (wm: WatermarkConfig) => {
    setTemplate((t) => ({ ...t, watermark: wm }));
  };

  // ── Compression ──────────────────────────────────────────────────────────
  const compressionEnabled = template.compression != null;

  const toggleCompression = () => {
    setTemplate((t) => ({
      ...t,
      compression: t.compression ? undefined : { imageQuality: 75 },
    }));
  };

  const updateCompression = (c: CompressionConfig) => {
    setTemplate((t) => ({ ...t, compression: c }));
  };

  // ── Version history ──────────────────────────────────────────────────────
  const [showVersions, setShowVersions] = useState(false);
  const versionHistory = useVersionHistory(templateId ?? "default");

  const restoreVersion = (t: Template) => {
    setTemplate(t);
    selection.setSelectedIds(new Set());
    page.setActivePage(0);
    page.setActiveSection("body");
  };

  // ── Layout dimensions ─────────────────────────────────────────────────────
  const currentPage = template.pages[page.activePage];
  const { width: pageW, height: pageH } = getPageDimensions(template.pageSize);
  const canvasW = pageW * editorScale;
  const canvasH = pageH * editorScale;
  const headerH = (currentPage?.header?.height ?? 0) * editorScale;
  const footerH = (currentPage?.footer?.height ?? 0) * editorScale;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      <Toolbar
        template={template}
        currentPage={currentPage}
        selectedEl={selection.selectedEl}
        selectedEls={selection.selectedEls}
        selectedIds={selection.selectedIds}
        activeSection={page.activeSection}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        clipboard={actions.clipboard}
        onBack={onBack}
        onUndo={history.undo}
        onRedo={history.redo}
        onSaveJSON={jsonIO.saveJSON}
        onLoadJSON={jsonIO.loadJSON}
        onCopyTemplate={jsonIO.copyTemplateToClipboard}
        onPasteTemplate={jsonIO.pasteTemplateFromClipboard}
        onShareUrl={jsonIO.shareAsUrl}
        onAddElement={actions.addElement}
        onInsertPlaceholder={actions.insertPlaceholder}
        onToggleSection={(type) => { page.toggleSection(type); selection.setSelectedIds(new Set()); }}
        onSectionChange={page.setActiveSection}
        onPageSizeChange={(s) => setTemplate((t) => ({ ...t, pageSize: s }))}
        onFontChange={(f) => setTemplate((t) => ({ ...t, fontFamily: f }))}
        onCopy={actions.copySelected}
        onPaste={actions.pasteElements}
        onDuplicate={actions.duplicateSelected}
        onDelete={actions.deleteSelected}
        onMoveZOrder={actions.moveZOrder}
        onAlign={actions.alignElements}
        includeMetadata={includeMetadata}
        onToggleMetadata={() => setIncludeMetadata((v) => !v)}
        includePassword={includePassword}
        onTogglePassword={() => setIncludePassword((v) => !v)}
        includePdfA={includePdfA}
        onTogglePdfA={() => setIncludePdfA((v) => !v)}
        includeSignature={includeSignature}
        onToggleSignature={() => setIncludeSignature((v) => !v)}
        watermarkEnabled={watermark.enabled}
        onToggleWatermark={toggleWatermark}
        compressionEnabled={compressionEnabled}
        onToggleCompression={toggleCompression}
        versionsEnabled={showVersions}
        onToggleVersions={() => setShowVersions((v) => !v)}
      />

      <div className="app-body">
        {/* ── Pages toggle tab ──────────────────────────────────────────────── */}
        <button
          onClick={() => setShowPages((v) => !v)}
          title={showPages ? "Hide pages" : "Show pages"}
          aria-label={showPages ? "Hide pages panel" : "Show pages panel"}
          className="panel-toggle-pages"
          style={{
            left: showPages ? 130 : 0,
            borderLeft: showPages ? "none" : "1px solid #334155",
          }}
        >
          {showPages ? "\u25C0" : "\u25B6"}
        </button>

        {/* ── Page Navigator ────────────────────────────────────────────────── */}
        {showPages && (
          <PageNavigator
            pages={template.pages}
            activePage={page.activePage}
            pageSize={template.pageSize}
            fontFamily={template.fontFamily ?? "Roboto"}
            onSelectPage={(pi) => {
              page.setActivePage(pi);
              selection.setSelectedIds(new Set());
              page.setActiveSection("body");
            }}
            onAddPage={page.addPage}
            onDeletePage={page.deletePage}
            onDuplicatePage={page.duplicatePage}
            onMovePage={page.movePage}
            onUpdateBookmark={page.updateBookmark}
          />
        )}

        <EditorCanvas
          currentPage={currentPage}
          canvasW={canvasW}
          canvasH={canvasH}
          headerH={headerH}
          footerH={footerH}
          fontFamily={template.fontFamily ?? "Roboto"}
          activeSection={page.activeSection}
          selectedIds={selection.selectedIds}
          selectedSection={selection.selectedSection}
          activePage={page.activePage}
          viewMode={viewMode}
          zoom={zoom}
          editorScale={editorScale}
          onDeselectAll={selection.handleDeselectAll}
          onSectionChange={(s) => { page.setActiveSection(s); selection.setSelectedIds(new Set()); }}
          onSelectElement={selection.handleSelectElement}
          onDragStart={drag.handleDragStart}
          onResizeStart={drag.handleResizeStart}
          onSectionResize={drag.startSectionResize}
          onViewModeChange={setViewMode}
          onZoomChange={setZoom}
          watermark={watermark}
        />

        {/* ── Properties toggle tab ─────────────────────────────────────────── */}
        <button
          onClick={() => setShowProperties((v) => !v)}
          title={showProperties ? "Hide properties" : "Show properties"}
          aria-label={showProperties ? "Hide properties panel" : "Show properties panel"}
          className="panel-toggle-props"
          style={{
            right: showProperties ? 258 : 0,
            borderRight: showProperties ? "none" : "1px solid #E2E8F0",
          }}
        >
          {showProperties ? "\u25B6" : "\u25C0"}
        </button>

        {/* ── Properties Panel ─────────────────────────────────────────────── */}
        {showProperties && (
          <div className="props-panel">
            <div className="props-panel-header">
              Properties
            </div>
            <div className="flex-1 overflow-auto">
              {selection.selectedEl ? (
                <PropertiesPanel
                  el={selection.selectedEl}
                  pageIdx={selection.selectedPageIdx}
                  allElements={getSectionElements(selection.selectedSection, template.pages[selection.selectedPageIdx])}
                  onUpdate={(pageIdx, elId, key, value) =>
                    actions.updateElement(pageIdx, elId, key, value, selection.selectedSection)
                  }
                  onDelete={(pageIdx, elId) => actions.deleteElement(pageIdx, elId, selection.selectedSection)}
                  onMoveZOrder={actions.moveZOrder}
                />
              ) : selection.selectedIds.size > 1 ? (
                <div className="props-multi-info">
                  <strong>{selection.selectedIds.size} elements</strong> selected.
                  <br />
                  <span className="props-multi-hint">Use toolbar to align or distribute.</span>
                </div>
              ) : (
                <>
                  {watermark.enabled && (
                    <WatermarkPanel
                      watermark={watermark}
                      totalPages={template.pages.length}
                      onUpdate={updateWatermark}
                    />
                  )}
                  {compressionEnabled && template.compression && (
                    <CompressionPanel
                      compression={template.compression}
                      onUpdate={updateCompression}
                    />
                  )}
                  {showVersions && (
                    <VersionHistoryPanel
                      versions={versionHistory.versions}
                      onSave={(label) => versionHistory.saveVersion(template, label)}
                      onRestore={restoreVersion}
                      onDelete={versionHistory.deleteVersion}
                    />
                  )}
                  {!watermark.enabled && !compressionEnabled && !showVersions && selection.selectedIds.size <= 1 && (
                    <div className="props-fallback">
                      Select an element to edit its properties.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {loadMissingFonts.length > 0 && (
        <MissingFontsModal
          missingFonts={loadMissingFonts}
          onResolved={() => setLoadMissingFonts([])}
          onDismiss={() => setLoadMissingFonts([])}
        />
      )}
    </div>
  );
}
