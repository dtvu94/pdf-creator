import { useState } from "react";
import type { Template, TemplateElement } from "@/types/template";
import type { HistoryControls } from "@/lib/useHistory";
import { createElement, makeId, getPageDimensions } from "@/lib/templates/utils";
import type { Section } from "./types";
import {
  getSectionElements,
  updateSectionElements,
  reorderZIndex,
  computeAlignment,
} from "./templateUtils";

interface UseElementActionsParams {
  template: Template;
  setTemplate: HistoryControls<Template>["set"];
  activePage: number;
  activeSection: Section;
  selectedIds: Set<string>;
  selectedPageIdx: number;
  selectedSection: Section;
  selectedId: string | null;
  selectedEl: TemplateElement | null;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedPageIdx: React.Dispatch<React.SetStateAction<number>>;
  setSelectedSection: React.Dispatch<React.SetStateAction<Section>>;
}

export function useElementActions(params: UseElementActionsParams) {
  const {
    template, setTemplate,
    activePage, activeSection,
    selectedIds, selectedPageIdx, selectedSection,
    selectedId, selectedEl,
    setSelectedIds, setSelectedPageIdx, setSelectedSection,
  } = params;

  const [clipboard, setClipboard] = useState<TemplateElement[]>([]);
  const currentPage = template.pages[activePage];

  const addElement = (type: TemplateElement["type"]) => {
    const target = activeSection;
    const existingEls = getSectionElements(target, currentPage);

    let yOffset: number;
    if (target === "header") {
      const headerH = currentPage.header?.height ?? 60;
      yOffset = Math.min(existingEls.length * 20, headerH - 20);
    } else if (target === "footer") {
      const footerH = currentPage.footer?.height ?? 50;
      yOffset = Math.min(existingEls.length * 16, footerH - 16);
    } else {
      const headerH = currentPage.header?.height ?? 0;
      const footerH = currentPage.footer?.height ?? 0;
      const { height: pageH } = getPageDimensions(template.pageSize);
      const contentH = pageH - headerH - footerH;
      yOffset = Math.min(50 + existingEls.length * 22, contentH - 120);
    }

    const el = createElement(type, yOffset);
    setTemplate((t) =>
      updateSectionElements(t, activePage, target, (els) => [...els, el]),
    );
    setSelectedIds(new Set([el.id]));
    setSelectedPageIdx(activePage);
    setSelectedSection(target);
  };

  const updateElement = (
    pageIdx: number,
    elId: string,
    key: string,
    value: unknown,
    section: Section = selectedSection,
  ) => {
    setTemplate((t) =>
      updateSectionElements(t, pageIdx, section, (els) =>
        els.map((el) => (el.id === elId ? { ...el, [key]: value } : el)),
      ),
    );
  };

  const deleteElement = (
    pageIdx: number,
    elId: string,
    section: Section = selectedSection,
  ) => {
    setTemplate((t) =>
      updateSectionElements(t, pageIdx, section, (els) =>
        els.filter((el) => el.id !== elId),
      ),
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(elId);
      return next;
    });
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    setTemplate((t) =>
      updateSectionElements(t, selectedPageIdx, selectedSection, (els) =>
        els.filter((el) => !selectedIds.has(el.id)),
      ),
    );
    setSelectedIds(new Set());
  };

  const copySelected = () => {
    const els = getSectionElements(
      selectedSection,
      template.pages[selectedPageIdx],
    );
    const copied = els.filter((el) => selectedIds.has(el.id));
    if (copied.length > 0) setClipboard(copied);
  };

  const pasteElements = () => {
    if (clipboard.length === 0) return;
    const newEls = clipboard.map((el) => ({
      ...el,
      id: makeId(),
      x: el.x + 15,
      y: el.y + 15,
    }));
    setTemplate((t) =>
      updateSectionElements(t, activePage, activeSection, (els) => [
        ...els,
        ...newEls,
      ]),
    );
    setSelectedIds(new Set(newEls.map((el) => el.id)));
    setSelectedPageIdx(activePage);
    setSelectedSection(activeSection);
  };

  const duplicateSelected = () => {
    const els = getSectionElements(
      selectedSection,
      template.pages[selectedPageIdx],
    );
    const toDup = els.filter((el) => selectedIds.has(el.id));
    if (toDup.length === 0) return;
    const newEls = toDup.map((el) => ({
      ...el,
      id: makeId(),
      x: el.x + 15,
      y: el.y + 15,
    }));
    setTemplate((t) =>
      updateSectionElements(t, selectedPageIdx, selectedSection, (els) => [
        ...els,
        ...newEls,
      ]),
    );
    setSelectedIds(new Set(newEls.map((el) => el.id)));
  };

  const moveZOrder = (direction: "up" | "down" | "top" | "bottom") => {
    if (!selectedId) return;
    setTemplate((t) =>
      updateSectionElements(t, selectedPageIdx, selectedSection, (els) =>
        reorderZIndex(els, selectedId, direction),
      ),
    );
  };

  const alignElements = (
    alignment:
      | "left"
      | "center"
      | "right"
      | "top"
      | "middle"
      | "bottom"
      | "distribute-h"
      | "distribute-v",
  ) => {
    if (selectedIds.size < 2) return;
    setTemplate((t) =>
      updateSectionElements(t, selectedPageIdx, selectedSection, (els) =>
        computeAlignment(els, selectedIds, alignment),
      ),
    );
  };

  const insertPlaceholder = (name: string) => {
    if (!selectedId || !selectedEl) return;
    if (selectedEl.type !== "text" && selectedEl.type !== "heading") return;
    const current = (selectedEl as { content: string }).content;
    updateElement(
      selectedPageIdx,
      selectedId,
      "content",
      current + `{{${name}}}`,
    );
  };

  return {
    clipboard,
    addElement,
    updateElement,
    deleteElement,
    deleteSelected,
    copySelected,
    pasteElements,
    duplicateSelected,
    moveZOrder,
    alignElements,
    insertPlaceholder,
  };
}
