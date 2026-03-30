import { useRef, useCallback } from "react";
import type { Template } from "@/types/template";
import type { HistoryControls } from "@/lib/useHistory";
import type { Section, DragState, ResizeState } from "./types";
import { getSectionElements, updateSectionElements } from "./templateUtils";

interface UseDragAndResizeParams {
  template: Template;
  setTemplate: HistoryControls<Template>["set"];
  activePage: number;
  editorScale: number;
  selectedIds: Set<string>;
}

export function useDragAndResize(params: UseDragAndResizeParams) {
  const { template, setTemplate, activePage, editorScale, selectedIds } =
    params;
  const dragState = useRef<DragState | null>(null);
  const resizeState = useRef<ResizeState | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent, elId: string, section: Section = "body") => {
      const pageIdx = activePage;
      const sectionEls = getSectionElements(section, template.pages[pageIdx]);
      const el = sectionEls.find((el) => el.id === elId);
      if (!el) return;

      dragState.current = {
        elId,
        pageIdx,
        section,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        scale: editorScale,
      };

      const allOriginals = new Map<string, { x: number; y: number }>();
      if (selectedIds.has(elId) && selectedIds.size > 1) {
        for (const id of selectedIds) {
          const other = sectionEls.find((e) => e.id === id);
          if (other) allOriginals.set(id, { x: other.x, y: other.y });
        }
      } else {
        allOriginals.set(elId, { x: el.x, y: el.y });
      }

      const onMove = (e: MouseEvent) => {
        const { pageIdx, section, startX, startY, scale } = dragState.current!;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        const moveEl = (el: import("@/types/template").TemplateElement) => {
          const orig = allOriginals.get(el.id);
          if (!orig) return el;
          return {
            ...el,
            x: Math.max(0, Math.round(orig.x + dx)),
            y: Math.max(0, Math.round(orig.y + dy)),
          };
        };
        setTemplate((t) =>
          updateSectionElements(t, pageIdx, section, (els) => els.map(moveEl)),
        );
      };

      const onUp = () => {
        dragState.current = null;
        globalThis.removeEventListener("mousemove", onMove);
        globalThis.removeEventListener("mouseup", onUp);
      };

      globalThis.addEventListener("mousemove", onMove);
      globalThis.addEventListener("mouseup", onUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePage, template, editorScale, selectedIds],
  );

  const handleResizeStart = useCallback(
    (
      e: React.MouseEvent,
      elId: string,
      handle: string,
      section: Section = "body",
    ) => {
      e.stopPropagation();
      e.preventDefault();
      const pageIdx = activePage;
      const sectionEls = getSectionElements(section, template.pages[pageIdx]);
      const el = sectionEls.find((el) => el.id === elId);
      if (!el) return;

      const w = (el as { width?: number }).width ?? 100;
      const h = (el as { height?: number }).height ?? 60;

      resizeState.current = {
        elId,
        pageIdx,
        section,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: w,
        origH: h,
        scale: editorScale,
      };

      const onMove = (ev: MouseEvent) => {
        const rs = resizeState.current!;
        const dx = (ev.clientX - rs.startX) / rs.scale;
        const dy = (ev.clientY - rs.startY) / rs.scale;

        let newX = rs.origX,
          newY = rs.origY,
          newW = rs.origW,
          newH = rs.origH;

        if (rs.handle.includes("e"))
          newW = Math.max(20, Math.round(rs.origW + dx));
        if (rs.handle.includes("w")) {
          newW = Math.max(20, Math.round(rs.origW - dx));
          newX = Math.max(0, Math.round(rs.origX + dx));
        }
        if (rs.handle.includes("s"))
          newH = Math.max(10, Math.round(rs.origH + dy));
        if (rs.handle.includes("n")) {
          newH = Math.max(10, Math.round(rs.origH - dy));
          newY = Math.max(0, Math.round(rs.origY + dy));
        }

        setTemplate((t) =>
          updateSectionElements(t, rs.pageIdx, rs.section, (els) =>
            els.map((el) =>
              el.id === rs.elId
                ? ({
                    ...el,
                    x: newX,
                    y: newY,
                    width: newW,
                    height: newH,
                  } as import("@/types/template").TemplateElement)
                : el,
            ),
          ),
        );
      };

      const onUp = () => {
        resizeState.current = null;
        globalThis.removeEventListener("mousemove", onMove);
        globalThis.removeEventListener("mouseup", onUp);
      };

      globalThis.addEventListener("mousemove", onMove);
      globalThis.addEventListener("mouseup", onUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePage, template, editorScale],
  );

  const startSectionResize = useCallback(
    (e: React.MouseEvent, section: "header" | "footer") => {
      e.stopPropagation();
      e.preventDefault();
      const startY = e.clientY;
      const page = template.pages[activePage];
      const initialHeight =
        section === "header"
          ? page.header!.height
          : page.footer!.height;

      const onMove = (ev: MouseEvent) => {
        const dy = (ev.clientY - startY) / editorScale;
        const newHeight = Math.round(
          Math.max(
            20,
            Math.min(
              300,
              section === "header" ? initialHeight + dy : initialHeight - dy,
            ),
          ),
        );
        setTemplate((t) => ({
          ...t,
          pages: t.pages.map((p, i) =>
            i === activePage && p[section]
              ? { ...p, [section]: { ...p[section]!, height: newHeight } }
              : p,
          ),
        }));
      };

      const onUp = () => {
        globalThis.removeEventListener("mousemove", onMove);
        globalThis.removeEventListener("mouseup", onUp);
      };

      globalThis.addEventListener("mousemove", onMove);
      globalThis.addEventListener("mouseup", onUp);
    },
    [activePage, template, editorScale, setTemplate],
  );

  return { handleDragStart, handleResizeStart, startSectionResize };
}
