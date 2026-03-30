/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { useDragAndResize } from "../useDragAndResize";
import type { Template } from "@/types/template";

function makeTemplate(elements: Array<{ id: string; x: number; y: number; width?: number; height?: number }>): Template {
  return {
    fontFamily: "Roboto",
    pages: [
      {
        elements: elements.map((el) => ({
          id: el.id,
          x: el.x,
          y: el.y,
          type: "text" as const,
          content: "",
          fontSize: 12,
          bold: false,
          italic: false,
          underline: false,
          color: "#000",
          width: el.width ?? 100,
          ...(el.height != null ? { height: el.height } : {}),
        })),
        header: {
          height: 60,
          elements: elements.map((el) => ({
            id: `h-${el.id}`,
            x: el.x,
            y: el.y,
            type: "text" as const,
            content: "",
            fontSize: 12,
            bold: false,
            italic: false,
            underline: false,
            color: "#000",
            width: el.width ?? 100,
          })),
        },
        footer: {
          height: 50,
          elements: elements.map((el) => ({
            id: `f-${el.id}`,
            x: el.x,
            y: el.y,
            type: "text" as const,
            content: "",
            fontSize: 12,
            bold: false,
            italic: false,
            underline: false,
            color: "#000",
            width: el.width ?? 100,
          })),
        },
      },
    ],
  } as Template;
}

function mouseEvent(clientX: number, clientY: number) {
  return {
    clientX,
    clientY,
    stopPropagation: jest.fn(),
    preventDefault: jest.fn(),
  } as unknown as React.MouseEvent;
}

describe("useDragAndResize", () => {
  let template: Template;
  let latestTemplate: Template;
  const setTemplate = jest.fn((updater: Template | ((t: Template) => Template)) => {
    if (typeof updater === "function") {
      latestTemplate = updater(latestTemplate);
    } else {
      latestTemplate = updater;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    template = makeTemplate([
      { id: "el1", x: 50, y: 50, width: 100 },
      { id: "el2", x: 200, y: 100, width: 150 },
    ]);
    latestTemplate = template;
  });

  // ── handleDragStart ──────────────────────────────────────────────────────

  describe("handleDragStart", () => {
    it("drags single element on mousemove and releases on mouseup", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleDragStart(mouseEvent(100, 100), "el1");
      });

      // Simulate mousemove
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 130 }));
      });

      expect(setTemplate).toHaveBeenCalled();
      const movedEl = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect(movedEl.x).toBe(70); // 50 + (120-100)/1
      expect(movedEl.y).toBe(80); // 50 + (130-100)/1

      // Simulate mouseup
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mouseup"));
      });

      // Further moves should not trigger setTemplate
      setTemplate.mockClear();
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 200 }));
      });
      expect(setTemplate).not.toHaveBeenCalled();
    });

    it("drags multiple selected elements together", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1", "el2"]),
        }),
      );

      act(() => {
        result.current.handleDragStart(mouseEvent(100, 100), "el1");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 110, clientY: 110 }));
      });

      expect(setTemplate).toHaveBeenCalled();
      const el1 = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      const el2 = latestTemplate.pages[0].elements.find((e) => e.id === "el2")!;
      expect(el1.x).toBe(60); // 50 + 10
      expect(el2.x).toBe(210); // 200 + 10
    });

    it("does nothing when element is not found", () => {
      // Ensure no leaked listeners from prior tests
      act(() => { globalThis.dispatchEvent(new MouseEvent("mouseup")); });
      setTemplate.mockClear();

      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(),
        }),
      );

      act(() => {
        result.current.handleDragStart(mouseEvent(100, 100), "nonexistent");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 200 }));
      });

      expect(setTemplate).not.toHaveBeenCalled();
    });

    it("respects editorScale when dragging", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 2,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleDragStart(mouseEvent(100, 100), "el1");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 140 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect(el.x).toBe(60); // 50 + (20/2)
      expect(el.y).toBe(70); // 50 + (40/2)
    });

    it("clamps position to minimum 0", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleDragStart(mouseEvent(100, 100), "el1");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 0, clientY: 0 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect(el.x).toBe(0); // max(0, 50 + (0-100)) = max(0, -50)
      expect(el.y).toBe(0);
    });

    it("drags multi-select where one ID is missing from elements", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1", "missing-id"]),
        }),
      );

      act(() => {
        result.current.handleDragStart(mouseEvent(100, 100), "el1");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 110, clientY: 110 }));
      });

      expect(setTemplate).toHaveBeenCalled();
      const el1 = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect(el1.x).toBe(60);

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mouseup"));
      });
    });

    it("drags element in header section", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["h-el1"]),
        }),
      );

      act(() => {
        result.current.handleDragStart(mouseEvent(100, 100), "h-el1", "header");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 110, clientY: 110 }));
      });

      expect(setTemplate).toHaveBeenCalled();
      const el = latestTemplate.pages[0].header!.elements.find((e) => e.id === "h-el1")!;
      expect(el.x).toBe(60);
    });

    it("drags element in footer section", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["f-el1"]),
        }),
      );

      act(() => {
        result.current.handleDragStart(mouseEvent(100, 100), "f-el1", "footer");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 115, clientY: 115 }));
      });

      expect(setTemplate).toHaveBeenCalled();
      const el = latestTemplate.pages[0].footer!.elements.find((e) => e.id === "f-el1")!;
      expect(el.x).toBe(65);
    });
  });

  // ── handleResizeStart ────────────────────────────────────────────────────

  describe("handleResizeStart", () => {
    it("resizes element east handle", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      const evt = mouseEvent(100, 100);
      act(() => {
        result.current.handleResizeStart(evt, "el1", "e");
      });
      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(evt.preventDefault).toHaveBeenCalled();

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 130, clientY: 100 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect((el as { width: number }).width).toBe(130); // 100 + 30

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mouseup"));
      });
    });

    it("resizes element west handle (adjusts x and width)", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "el1", "w");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 80, clientY: 100 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect((el as { width: number }).width).toBe(120); // 100 + 20
      expect(el.x).toBe(30); // 50 - 20
    });

    it("resizes element south handle", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "el1", "s");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 130 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect((el as { height: number }).height).toBe(90); // 60 + 30
    });

    it("resizes element north handle (adjusts y and height)", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "el1", "n");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 80 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect((el as { height: number }).height).toBe(80); // 60 + 20
      expect(el.y).toBe(30); // 50 - 20
    });

    it("resizes element se handle (both width and height)", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "el1", "se");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 120 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect((el as { width: number }).width).toBe(120);
      expect((el as { height: number }).height).toBe(80);
    });

    it("resizes element nw handle (adjusts x, y, width, height)", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "el1", "nw");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 90, clientY: 90 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect((el as { width: number }).width).toBe(110); // 100 + 10
      expect((el as { height: number }).height).toBe(70); // 60 + 10
      expect(el.x).toBe(40); // 50 - 10
      expect(el.y).toBe(40); // 50 - 10
    });

    it("enforces minimum width of 20 and height of 10", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "el1", "se");
      });

      // Shrink way beyond minimums
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: -100, clientY: -100 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect((el as { width: number }).width).toBe(20);
      expect((el as { height: number }).height).toBe(10);
    });

    it("does nothing when element is not found", () => {
      // Ensure no leaked listeners from prior tests
      act(() => { globalThis.dispatchEvent(new MouseEvent("mouseup")); });
      setTemplate.mockClear();

      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "nonexistent", "se");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 200 }));
      });

      expect(setTemplate).not.toHaveBeenCalled();
    });

    it("resizes in header section", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(["h-el1"]),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "h-el1", "e", "header");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 100 }));
      });

      expect(setTemplate).toHaveBeenCalled();

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mouseup"));
      });
    });

    it("respects editorScale when resizing", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 2,
          selectedIds: new Set(["el1"]),
        }),
      );

      act(() => {
        result.current.handleResizeStart(mouseEvent(100, 100), "el1", "e");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 140, clientY: 100 }));
      });

      const el = latestTemplate.pages[0].elements.find((e) => e.id === "el1")!;
      expect((el as { width: number }).width).toBe(120); // 100 + 40/2
    });
  });

  // ── startSectionResize ───────────────────────────────────────────────────

  describe("startSectionResize", () => {
    it("resizes header height", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(),
        }),
      );

      const evt = mouseEvent(100, 100);
      act(() => {
        result.current.startSectionResize(evt, "header");
      });
      expect(evt.stopPropagation).toHaveBeenCalled();

      // Drag down to increase header height
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 130 }));
      });

      expect(setTemplate).toHaveBeenCalled();
      expect(latestTemplate.pages[0].header!.height).toBe(90); // 60 + 30

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mouseup"));
      });

      // Further moves should not update
      setTemplate.mockClear();
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 200 }));
      });
      expect(setTemplate).not.toHaveBeenCalled();
    });

    it("resizes footer height (inverted direction)", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(),
        }),
      );

      act(() => {
        result.current.startSectionResize(mouseEvent(100, 100), "footer");
      });

      // Drag up to increase footer height
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 70 }));
      });

      expect(setTemplate).toHaveBeenCalled();
      expect(latestTemplate.pages[0].footer!.height).toBe(80); // 50 + 30
    });

    it("clamps section height between 20 and 300", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 1,
          selectedIds: new Set(),
        }),
      );

      act(() => {
        result.current.startSectionResize(mouseEvent(100, 100), "header");
      });

      // Try to drag way up (reduce height below 20)
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: -500 }));
      });
      expect(latestTemplate.pages[0].header!.height).toBe(20);

      // Try to drag way down (increase height above 300)
      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 600 }));
      });
      expect(latestTemplate.pages[0].header!.height).toBe(300);
    });

    it("skips pages without the target section", () => {
      const templateNoSection = {
        ...template,
        pages: [
          { elements: template.pages[0].elements },
          template.pages[0],
        ],
      } as Template;
      latestTemplate = templateNoSection;

      const { result } = renderHook(() =>
        useDragAndResize({
          template: templateNoSection,
          setTemplate,
          activePage: 1,
          editorScale: 1,
          selectedIds: new Set(),
        }),
      );

      act(() => {
        result.current.startSectionResize(mouseEvent(100, 100), "header");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 120 }));
      });

      expect(setTemplate).toHaveBeenCalled();
      // Page 0 without header should be unchanged
      expect(latestTemplate.pages[0].header).toBeUndefined();
      // Page 1 with header should be updated
      expect(latestTemplate.pages[1].header!.height).toBe(80);

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mouseup"));
      });
    });

    it("respects editorScale when resizing sections", () => {
      const { result } = renderHook(() =>
        useDragAndResize({
          template,
          setTemplate,
          activePage: 0,
          editorScale: 2,
          selectedIds: new Set(),
        }),
      );

      act(() => {
        result.current.startSectionResize(mouseEvent(100, 100), "header");
      });

      act(() => {
        globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 140 }));
      });

      expect(latestTemplate.pages[0].header!.height).toBe(80); // 60 + 40/2
    });
  });
});
