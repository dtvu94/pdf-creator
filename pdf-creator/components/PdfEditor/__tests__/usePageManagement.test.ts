/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { usePageManagement } from "../usePageManagement";
import type { Template } from "@/types/template";

function makeTemplate(pageCount = 2): Template {
  return {
    fontFamily: "Roboto",
    pages: Array.from({ length: pageCount }, (_, i) => ({
      id: `page-${i}`,
      elements: [],
      ...(i === 0
        ? { header: { height: 60, elements: [] } }
        : {}),
    })),
  } as Template;
}

describe("usePageManagement", () => {
  let template: Template;
  let latestTemplate: Template;
  const setTemplate = jest.fn((updater: Template | ((t: Template) => Template)) => {
    latestTemplate = typeof updater === "function" ? updater(latestTemplate) : updater;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    template = makeTemplate(2);
    latestTemplate = template;
  });

  it("initializes with activePage=0 and activeSection=body", () => {
    const { result } = renderHook(() => usePageManagement(template, setTemplate));
    expect(result.current.activePage).toBe(0);
    expect(result.current.activeSection).toBe("body");
  });

  // ── addPage ──────────────────────────────────────────────────────────────

  describe("addPage", () => {
    it("adds a new page and sets activePage to it", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.addPage();
      });

      expect(setTemplate).toHaveBeenCalled();
      expect(latestTemplate.pages).toHaveLength(3);
      expect(latestTemplate.pages[2].elements).toEqual([]);
      expect(result.current.activePage).toBe(2);
      expect(result.current.activeSection).toBe("body");
    });
  });

  // ── deletePage ───────────────────────────────────────────────────────────

  describe("deletePage", () => {
    it("deletes a page and adjusts activePage", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.deletePage(1);
      });

      expect(setTemplate).toHaveBeenCalled();
      expect(latestTemplate.pages).toHaveLength(1);
    });

    it("does nothing when only one page exists", () => {
      const singlePage = makeTemplate(1);
      const { result } = renderHook(() => usePageManagement(singlePage, setTemplate));

      act(() => {
        result.current.deletePage(0);
      });

      expect(setTemplate).not.toHaveBeenCalled();
    });

    it("clamps activePage when deleting the last page", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      // Navigate to last page
      act(() => {
        result.current.setActivePage(1);
      });

      act(() => {
        result.current.deletePage(1);
      });

      // activePage should be clamped to 0 (pages.length - 2 = 0)
      expect(result.current.activePage).toBe(0);
    });
  });

  // ── toggleSection ────────────────────────────────────────────────────────

  describe("toggleSection", () => {
    it("adds a header section when none exists", () => {
      const noHeader = makeTemplate(1);
      delete (noHeader.pages[0] as Record<string, unknown>).header;
      latestTemplate = noHeader;

      const { result } = renderHook(() => usePageManagement(noHeader, setTemplate));

      act(() => {
        result.current.toggleSection("header");
      });

      expect(setTemplate).toHaveBeenCalled();
      expect(latestTemplate.pages[0].header).toBeDefined();
      expect(latestTemplate.pages[0].header!.height).toBe(60);
      expect(result.current.activeSection).toBe("header");
    });

    it("adds a footer section when none exists", () => {
      latestTemplate = template;
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.toggleSection("footer");
      });

      expect(latestTemplate.pages[0].footer).toBeDefined();
      expect(latestTemplate.pages[0].footer!.height).toBe(50);
      expect(result.current.activeSection).toBe("footer");
    });

    it("removes an existing header section", () => {
      // Page 0 has a header
      latestTemplate = template;
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.toggleSection("header");
      });

      expect(latestTemplate.pages[0].header).toBeUndefined();
    });

    it("switches activeSection to body when removing the active section", () => {
      latestTemplate = template;
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      // Set active section to header first
      act(() => {
        result.current.setActiveSection("header");
      });
      expect(result.current.activeSection).toBe("header");

      // Toggle header off — should switch to body
      act(() => {
        result.current.toggleSection("header");
      });

      expect(result.current.activeSection).toBe("body");
    });

    it("does not switch activeSection when removing a non-active section", () => {
      // Add footer to page 0
      const withFooter = {
        ...template,
        pages: template.pages.map((p, i) =>
          i === 0 ? { ...p, footer: { height: 50, elements: [] } } : p,
        ),
      } as Template;
      latestTemplate = withFooter;

      const { result } = renderHook(() => usePageManagement(withFooter, setTemplate));

      // Active section is "body", toggle footer off
      act(() => {
        result.current.toggleSection("footer");
      });

      expect(result.current.activeSection).toBe("body");
    });
  });

  // ── duplicatePage ─────────────────────────────────────────────────────────

  describe("duplicatePage", () => {
    it("duplicates a page and inserts after it", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.duplicatePage(0);
      });

      expect(setTemplate).toHaveBeenCalled();
      expect(latestTemplate.pages).toHaveLength(3);
      // New page inserted at index 1
      expect(latestTemplate.pages[1].id).not.toBe(template.pages[0].id);
      expect(result.current.activePage).toBe(1);
      expect(result.current.activeSection).toBe("body");
    });

    it("gives new unique IDs to all elements in the clone", () => {
      const templateWithElements = makeTemplate(1);
      templateWithElements.pages[0].elements = [
        { id: "el1", x: 10, y: 10, type: "text" as const, content: "Hi", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
      ];
      templateWithElements.pages[0].header = { height: 60, elements: [
        { id: "hel1", x: 0, y: 0, type: "text" as const, content: "H", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 50 },
      ] };
      templateWithElements.pages[0].footer = { height: 50, elements: [
        { id: "fel1", x: 0, y: 0, type: "text" as const, content: "F", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 50 },
      ] };
      latestTemplate = templateWithElements;

      const { result } = renderHook(() => usePageManagement(templateWithElements, setTemplate));

      act(() => {
        result.current.duplicatePage(0);
      });

      const cloned = latestTemplate.pages[1];
      expect(cloned.elements[0].id).not.toBe("el1");
      expect(cloned.header!.elements[0].id).not.toBe("hel1");
      expect(cloned.footer!.elements[0].id).not.toBe("fel1");
    });

    it("does nothing for invalid page index", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.duplicatePage(99);
      });

      expect(setTemplate).not.toHaveBeenCalled();
    });
  });

  // ── movePage ─────────────────────────────────────────────────────────────

  describe("movePage", () => {
    it("moves page up", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.setActivePage(1);
      });

      act(() => {
        result.current.movePage(1, "up");
      });

      expect(setTemplate).toHaveBeenCalled();
      // Pages should be swapped
      expect(latestTemplate.pages[0].id).toBe(template.pages[1].id);
      expect(latestTemplate.pages[1].id).toBe(template.pages[0].id);
      expect(result.current.activePage).toBe(0);
    });

    it("moves page down", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.movePage(0, "down");
      });

      expect(setTemplate).toHaveBeenCalled();
      expect(latestTemplate.pages[0].id).toBe(template.pages[1].id);
      expect(latestTemplate.pages[1].id).toBe(template.pages[0].id);
      expect(result.current.activePage).toBe(1);
    });

    it("does nothing when moving first page up", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.movePage(0, "up");
      });

      expect(setTemplate).not.toHaveBeenCalled();
    });

    it("does nothing when moving last page down", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.movePage(1, "down");
      });

      expect(setTemplate).not.toHaveBeenCalled();
    });
  });

  // ── setActivePage / setActiveSection ──────────────────────────────────────

  describe("setActivePage / setActiveSection", () => {
    it("allows setting active page", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.setActivePage(1);
      });

      expect(result.current.activePage).toBe(1);
    });

    it("allows setting active section", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.setActiveSection("footer");
      });

      expect(result.current.activeSection).toBe("footer");
    });
  });

  // ── updateBookmark ──────────────────────────────────────────────────────

  describe("updateBookmark", () => {
    it("sets bookmark on a page", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.updateBookmark(0, "Chapter 1");
      });

      expect(setTemplate).toHaveBeenCalled();
      expect(latestTemplate.pages[0].bookmark).toBe("Chapter 1");
    });

    it("clears bookmark when empty string is provided", () => {
      const withBookmark = makeTemplate(2);
      withBookmark.pages[0].bookmark = "Old Bookmark";
      latestTemplate = withBookmark;

      const { result } = renderHook(() => usePageManagement(withBookmark, setTemplate));

      act(() => {
        result.current.updateBookmark(0, "");
      });

      expect(latestTemplate.pages[0].bookmark).toBeUndefined();
    });

    it("does not affect other pages", () => {
      const { result } = renderHook(() => usePageManagement(template, setTemplate));

      act(() => {
        result.current.updateBookmark(0, "Only First");
      });

      expect(latestTemplate.pages[1].bookmark).toBeUndefined();
    });
  });
});
