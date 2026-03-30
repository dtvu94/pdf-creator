import { useState, useCallback } from "react";
import type { Template, PageSection } from "@/types/template";
import type { HistoryControls } from "@/lib/useHistory";
import { makeId } from "@/lib/templates/utils";
import type { Section } from "./types";

export function usePageManagement(
  template: Template,
  setTemplate: HistoryControls<Template>["set"],
) {
  const [activePage, setActivePage] = useState(0);
  const [activeSection, setActiveSection] = useState<Section>("body");

  const addPage = useCallback(() => {
    setTemplate((t) => ({
      ...t,
      pages: [...t.pages, { id: makeId(), elements: [] }],
    }));
    setActivePage(template.pages.length);
    setActiveSection("body");
  }, [template.pages.length, setTemplate]);

  const deletePage = useCallback((pi: number) => {
    if (template.pages.length <= 1) return;
    setTemplate((t) => ({ ...t, pages: t.pages.filter((_, i) => i !== pi) }));
    setActivePage((prev) => Math.min(prev, template.pages.length - 2));
  }, [template.pages.length, setTemplate]);

  const duplicatePage = useCallback((pi: number) => {
    const source = template.pages[pi];
    if (!source) return;
    const clonePage = JSON.parse(JSON.stringify(source)) as typeof source;
    clonePage.id = makeId();
    // Give every element a new unique ID so selections don't clash
    clonePage.elements = clonePage.elements.map((el) => ({ ...el, id: makeId() }));
    if (clonePage.header) {
      clonePage.header.elements = clonePage.header.elements.map((el) => ({ ...el, id: makeId() }));
    }
    if (clonePage.footer) {
      clonePage.footer.elements = clonePage.footer.elements.map((el) => ({ ...el, id: makeId() }));
    }
    setTemplate((t) => ({
      ...t,
      pages: [...t.pages.slice(0, pi + 1), clonePage, ...t.pages.slice(pi + 1)],
    }));
    setActivePage(pi + 1);
    setActiveSection("body");
  }, [template.pages, setTemplate]);

  const movePage = useCallback((pi: number, direction: "up" | "down") => {
    const target = direction === "up" ? pi - 1 : pi + 1;
    if (target < 0 || target >= template.pages.length) return;
    setTemplate((t) => {
      const pages = [...t.pages];
      [pages[pi], pages[target]] = [pages[target], pages[pi]];
      return { ...t, pages };
    });
    setActivePage(target);
  }, [template.pages.length, setTemplate]);

  const toggleSection = useCallback((type: "header" | "footer") => {
    const page = template.pages[activePage];
    if (page[type]) {
      setTemplate((t) => ({
        ...t,
        pages: t.pages.map((p, i) =>
          i === activePage ? { ...p, [type]: undefined } : p,
        ),
      }));
      if (activeSection === type) setActiveSection("body");
    } else {
      const defaults: PageSection =
        type === "header"
          ? { height: 60, elements: [] }
          : { height: 50, elements: [] };
      setTemplate((t) => ({
        ...t,
        pages: t.pages.map((p, i) =>
          i === activePage ? { ...p, [type]: defaults } : p,
        ),
      }));
      setActiveSection(type);
    }
  }, [template.pages, activePage, activeSection, setTemplate]);

  const updateBookmark = useCallback((pi: number, bookmark: string) => {
    setTemplate((t) => ({
      ...t,
      pages: t.pages.map((p, i) =>
        i === pi ? { ...p, bookmark: bookmark || undefined } : p,
      ),
    }));
  }, [setTemplate]);

  return {
    activePage,
    setActivePage,
    activeSection,
    setActiveSection,
    addPage,
    deletePage,
    duplicatePage,
    movePage,
    toggleSection,
    updateBookmark,
  };
}
