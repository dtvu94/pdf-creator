import { useState } from "react";
import type { Template, TemplateElement } from "@/types/template";
import type { Section } from "./types";
import { getSectionElements } from "./templateUtils";

export function useSelection(template: Template, activePage: number) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const [selectedSection, setSelectedSection] = useState<Section>("body");

  const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : null;

  const sectionEls = getSectionElements(
    selectedSection,
    template.pages[selectedPageIdx],
  );

  const selectedEl: TemplateElement | null = selectedId
    ? sectionEls.find((e) => e.id === selectedId) ?? null
    : null;

  const selectedEls = sectionEls.filter((e) => selectedIds.has(e.id));

  const handleSelectElement = (
    id: string,
    section: Section,
    additive: boolean,
  ) => {
    if (additive) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
    setSelectedSection(section);
    setSelectedPageIdx(activePage);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  return {
    selectedIds,
    setSelectedIds,
    selectedPageIdx,
    setSelectedPageIdx,
    selectedSection,
    setSelectedSection,
    selectedId,
    selectedEl,
    selectedEls,
    handleSelectElement,
    handleDeselectAll,
  };
}
