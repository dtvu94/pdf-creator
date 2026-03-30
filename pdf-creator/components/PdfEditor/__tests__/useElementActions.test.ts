/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { useElementActions } from "../useElementActions";
import type { Template, TemplateElement } from "@/types/template";
import type { Section } from "../types";

function makeTemplate(): Template {
  return {
    name: "Test",
    fontFamily: "Roboto",
    pageSize: "A4",
    pages: [
      {
        id: "p1",
        elements: [
          {
            id: "el1", x: 40, y: 50, type: "text", content: "Hello",
            fontSize: 12, bold: false, italic: false, underline: false,
            color: "#000", width: 420,
          } as TemplateElement,
          {
            id: "el2", x: 40, y: 100, type: "heading", content: "Title",
            fontSize: 24, bold: true, italic: false, underline: false,
            color: "#000", width: 420,
          } as TemplateElement,
        ],
        header: { height: 60, elements: [] },
        footer: { height: 50, elements: [] },
      },
    ],
    styles: { primaryColor: "#000" },
  };
}

function makeParams(overrides: Partial<ReturnType<typeof buildParams>> = {}) {
  return buildParams(overrides);
}

function buildParams(overrides: Record<string, unknown> = {}) {
  const template = (overrides.template as Template) ?? makeTemplate();
  let latestTemplate = template;
  const setTemplate = jest.fn((updater: Template | ((t: Template) => Template)) => {
    latestTemplate = typeof updater === "function" ? updater(latestTemplate) : updater;
  });

  const base = {
    template,
    setTemplate,
    activePage: 0,
    activeSection: "body" as Section,
    selectedIds: new Set<string>(),
    selectedPageIdx: 0,
    selectedSection: "body" as Section,
    selectedId: null as string | null,
    selectedEl: null as TemplateElement | null,
    setSelectedIds: jest.fn((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      if (typeof updater === "function") updater(new Set());
    }),
    setSelectedPageIdx: jest.fn(),
    setSelectedSection: jest.fn(),
  };

  return { ...base, ...overrides, _getLatest: () => latestTemplate };
}

describe("useElementActions", () => {
  // ── addElement ─────────────────────────────────────────────────────────

  describe("addElement", () => {
    it("adds an element in body section", () => {
      const p = makeParams();
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.addElement("text"); });

      expect(p.setTemplate).toHaveBeenCalled();
      const latest = p._getLatest();
      expect(latest.pages[0].elements).toHaveLength(3);
      expect(p.setSelectedIds).toHaveBeenCalled();
      expect(p.setSelectedPageIdx).toHaveBeenCalledWith(0);
      expect(p.setSelectedSection).toHaveBeenCalledWith("body");
    });

    it("adds element in header section with explicit height", () => {
      const p = makeParams({ activeSection: "header" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.addElement("text"); });

      const latest = p._getLatest();
      expect(latest.pages[0].header!.elements).toHaveLength(1);
      expect(p.setSelectedSection).toHaveBeenCalledWith("header");
    });

    it("adds element in header section using fallback height (no header.height)", () => {
      const tmpl = makeTemplate();
      // Remove header entirely so ?? 60 fallback triggers
      delete (tmpl.pages[0] as Record<string, unknown>).header;
      const p = makeParams({ template: tmpl, activeSection: "header" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.addElement("text"); });

      // setTemplate is still called even though header section may be empty
      expect(p.setTemplate).toHaveBeenCalled();
    });

    it("adds element in footer section with explicit height", () => {
      const p = makeParams({ activeSection: "footer" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.addElement("text"); });

      const latest = p._getLatest();
      expect(latest.pages[0].footer!.elements).toHaveLength(1);
      expect(p.setSelectedSection).toHaveBeenCalledWith("footer");
    });

    it("adds element in footer section using fallback height (no footer.height)", () => {
      const tmpl = makeTemplate();
      delete (tmpl.pages[0] as Record<string, unknown>).footer;
      const p = makeParams({ template: tmpl, activeSection: "footer" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.addElement("text"); });

      expect(p.setTemplate).toHaveBeenCalled();
    });

    it("adds element in body with header and footer (subtracts heights)", () => {
      const tmpl = makeTemplate();
      tmpl.pages[0].header = { height: 80, elements: [] };
      tmpl.pages[0].footer = { height: 60, elements: [] };
      const p = makeParams({ template: tmpl, activeSection: "body" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.addElement("text"); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements).toHaveLength(3);
    });

    it("adds element in body WITHOUT header/footer (fallback ?? 0)", () => {
      const tmpl = makeTemplate();
      delete (tmpl.pages[0] as Record<string, unknown>).header;
      delete (tmpl.pages[0] as Record<string, unknown>).footer;
      const p = makeParams({ template: tmpl, activeSection: "body" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.addElement("text"); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements).toHaveLength(3);
    });
  });

  // ── updateElement ──────────────────────────────────────────────────────

  describe("updateElement", () => {
    it("updates an element property using default section", () => {
      const p = makeParams({ selectedSection: "body" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.updateElement(0, "el1", "content", "Updated"); });

      const latest = p._getLatest();
      const el = latest.pages[0].elements.find((e) => e.id === "el1") as { content: string };
      expect(el.content).toBe("Updated");
    });

    it("updates an element with explicit section parameter", () => {
      const tmpl = makeTemplate();
      tmpl.pages[0].header = {
        height: 60,
        elements: [
          {
            id: "hel1", x: 10, y: 10, type: "text", content: "Header text",
            fontSize: 10, bold: false, italic: false, underline: false,
            color: "#000", width: 200,
          } as TemplateElement,
        ],
      };
      const p = makeParams({ template: tmpl, selectedSection: "body" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.updateElement(0, "hel1", "content", "New header", "header"); });

      const latest = p._getLatest();
      const el = latest.pages[0].header!.elements.find((e) => e.id === "hel1") as { content: string };
      expect(el.content).toBe("New header");
    });
  });

  // ── deleteElement ──────────────────────────────────────────────────────

  describe("deleteElement", () => {
    it("deletes an element using default section", () => {
      const p = makeParams({ selectedSection: "body" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.deleteElement(0, "el1"); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements).toHaveLength(1);
      expect(latest.pages[0].elements[0].id).toBe("el2");
      expect(p.setSelectedIds).toHaveBeenCalled();
    });

    it("deletes an element with explicit section parameter", () => {
      const tmpl = makeTemplate();
      tmpl.pages[0].header = {
        height: 60,
        elements: [
          {
            id: "hel1", x: 10, y: 10, type: "text", content: "Header",
            fontSize: 10, bold: false, italic: false, underline: false,
            color: "#000", width: 200,
          } as TemplateElement,
        ],
      };
      const p = makeParams({ template: tmpl, selectedSection: "body" as Section });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.deleteElement(0, "hel1", "header"); });

      const latest = p._getLatest();
      expect(latest.pages[0].header!.elements).toHaveLength(0);
    });
  });

  // ── deleteSelected ─────────────────────────────────────────────────────

  describe("deleteSelected", () => {
    it("deletes all selected elements", () => {
      const p = makeParams({
        selectedIds: new Set(["el1", "el2"]),
        selectedSection: "body" as Section,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.deleteSelected(); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements).toHaveLength(0);
      expect(p.setSelectedIds).toHaveBeenCalledWith(new Set());
    });

    it("does nothing when no elements are selected", () => {
      const p = makeParams({ selectedIds: new Set<string>() });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.deleteSelected(); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });
  });

  // ── copySelected / pasteElements ───────────────────────────────────────

  describe("copySelected and pasteElements", () => {
    it("copies and pastes selected elements with offset", () => {
      const p = makeParams({
        selectedIds: new Set(["el1"]),
        selectedSection: "body" as Section,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.copySelected(); });

      expect(result.current.clipboard).toHaveLength(1);
      expect(result.current.clipboard[0].id).toBe("el1");

      act(() => { result.current.pasteElements(); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements).toHaveLength(3);
      const pasted = latest.pages[0].elements[2];
      expect(pasted.id).not.toBe("el1");
      expect(pasted.x).toBe(40 + 15);
      expect(pasted.y).toBe(50 + 15);
    });

    it("pasteElements does nothing when clipboard is empty", () => {
      const p = makeParams();
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.pasteElements(); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });

    it("copySelected does nothing when no elements are selected", () => {
      const p = makeParams({ selectedIds: new Set<string>() });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.copySelected(); });

      expect(result.current.clipboard).toHaveLength(0);
    });
  });

  // ── duplicateSelected ──────────────────────────────────────────────────

  describe("duplicateSelected", () => {
    it("duplicates selected elements", () => {
      const p = makeParams({
        selectedIds: new Set(["el1"]),
        selectedSection: "body" as Section,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.duplicateSelected(); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements).toHaveLength(3);
      const dup = latest.pages[0].elements[2];
      expect(dup.id).not.toBe("el1");
      expect(dup.x).toBe(40 + 15);
      expect(dup.y).toBe(50 + 15);
    });

    it("does nothing when no elements match selection", () => {
      const p = makeParams({ selectedIds: new Set(["nonexistent"]) });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.duplicateSelected(); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });

    it("does nothing with empty selection", () => {
      const p = makeParams({ selectedIds: new Set<string>() });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.duplicateSelected(); });

      // toDup will be empty, early return
      expect(p.setTemplate).not.toHaveBeenCalled();
    });
  });

  // ── moveZOrder ─────────────────────────────────────────────────────────

  describe("moveZOrder", () => {
    it("moves element up in z-order", () => {
      const p = makeParams({
        selectedId: "el1",
        selectedSection: "body" as Section,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.moveZOrder("up"); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements[1].id).toBe("el1");
    });

    it("moves element down in z-order", () => {
      const p = makeParams({
        selectedId: "el2",
        selectedSection: "body" as Section,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.moveZOrder("down"); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements[0].id).toBe("el2");
    });

    it("does nothing when no selectedId", () => {
      const p = makeParams({ selectedId: null });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.moveZOrder("up"); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });
  });

  // ── alignElements ──────────────────────────────────────────────────────

  describe("alignElements", () => {
    it("aligns selected elements to the left", () => {
      const tmpl = makeTemplate();
      tmpl.pages[0].elements[1].x = 100;
      const p = makeParams({
        template: tmpl,
        selectedIds: new Set(["el1", "el2"]),
        selectedSection: "body" as Section,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.alignElements("left"); });

      const latest = p._getLatest();
      expect(latest.pages[0].elements[0].x).toBe(40);
      expect(latest.pages[0].elements[1].x).toBe(40);
    });

    it("does nothing with fewer than 2 selected elements", () => {
      const p = makeParams({ selectedIds: new Set(["el1"]) });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.alignElements("left"); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });

    it("does nothing with empty selection", () => {
      const p = makeParams({ selectedIds: new Set<string>() });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.alignElements("center"); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });
  });

  // ── insertPlaceholder ──────────────────────────────────────────────────

  describe("insertPlaceholder", () => {
    it("appends placeholder to text element content", () => {
      const tmpl = makeTemplate();
      const textEl = tmpl.pages[0].elements[0];
      const p = makeParams({
        template: tmpl,
        selectedId: "el1",
        selectedEl: textEl,
        selectedSection: "body" as Section,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.insertPlaceholder("name"); });

      const latest = p._getLatest();
      const el = latest.pages[0].elements.find((e) => e.id === "el1") as { content: string };
      expect(el.content).toBe("Hello{{name}}");
    });

    it("appends placeholder to heading element content", () => {
      const tmpl = makeTemplate();
      const headingEl = tmpl.pages[0].elements[1];
      const p = makeParams({
        template: tmpl,
        selectedId: "el2",
        selectedEl: headingEl,
        selectedSection: "body" as Section,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.insertPlaceholder("title"); });

      const latest = p._getLatest();
      const el = latest.pages[0].elements.find((e) => e.id === "el2") as { content: string };
      expect(el.content).toBe("Title{{title}}");
    });

    it("does nothing when selectedEl is a non-text type (e.g. image)", () => {
      const imageEl: TemplateElement = {
        id: "img1", x: 40, y: 50, type: "image",
        label: "img", width: 200, height: 120, bgColor: "#fff",
      };
      const p = makeParams({
        selectedId: "img1",
        selectedEl: imageEl,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.insertPlaceholder("field"); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });

    it("does nothing when selectedEl is a divider", () => {
      const dividerEl: TemplateElement = {
        id: "div1", x: 40, y: 50, type: "divider",
        color: "#ccc", width: 500, thickness: 1,
      };
      const p = makeParams({
        selectedId: "div1",
        selectedEl: dividerEl,
      });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.insertPlaceholder("field"); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });

    it("does nothing when no selectedId", () => {
      const p = makeParams({ selectedId: null, selectedEl: null });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.insertPlaceholder("field"); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });

    it("does nothing when no selectedEl", () => {
      const p = makeParams({ selectedId: "el1", selectedEl: null });
      const { result } = renderHook(() => useElementActions(p));

      act(() => { result.current.insertPlaceholder("field"); });

      expect(p.setTemplate).not.toHaveBeenCalled();
    });
  });
});
