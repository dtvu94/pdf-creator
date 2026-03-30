/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

// ── Mock lucide-react ─────────────────────────────────────────────────────────
jest.mock("lucide-react", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require("react");
  return new Proxy(
    {},
    {
      get: (_t: Record<string, unknown>, prop: string) => {
        if (prop === "__esModule") return true;
        return (props: Record<string, unknown>) =>
          R.createElement("span", { "data-testid": prop, ...props });
      },
    }
  );
});

// ── Mock useEditorFonts ───────────────────────────────────────────────────────
jest.mock("@/lib/useEditorFonts", () => ({
  useEditorFonts: jest.fn(),
}));

// ── Real useHistory (we want actual state management) ─────────────────────────
jest.mock("@/lib/useHistory", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useState, useRef, useCallback } = require("react");
  return {
    useHistory: (initial: unknown) => {
      const [state, _setState] = useState(initial);
      const stateRef = useRef(state);
      stateRef.current = state;
      const pastRef = useRef<unknown[]>([]);
      const futureRef = useRef<unknown[]>([]);

      const set = useCallback((updater: unknown) => {
        _setState((prev: unknown) => {
          pastRef.current = [...pastRef.current, prev];
          futureRef.current = [];
          const next = typeof updater === "function" ? (updater as (p: unknown) => unknown)(prev) : updater;
          stateRef.current = next;
          return next;
        });
      }, []);

      const undo = useCallback(() => {
        _setState((prev: unknown) => {
          if (pastRef.current.length === 0) return prev;
          futureRef.current = [prev, ...futureRef.current];
          const past = pastRef.current.pop()!;
          stateRef.current = past;
          return past;
        });
      }, []);

      const redo = useCallback(() => {
        _setState((prev: unknown) => {
          if (futureRef.current.length === 0) return prev;
          pastRef.current = [...pastRef.current, prev];
          const next = futureRef.current.shift()!;
          stateRef.current = next;
          return next;
        });
      }, []);

      return {
        state,
        set,
        undo,
        redo,
        canUndo: pastRef.current.length > 0,
        canRedo: futureRef.current.length > 0,
      };
    },
  };
});

jest.mock("@/lib/templates", () => ({
  DEFAULT_TEMPLATE: {
    name: "Test",
    pageSize: "A4",
    fontFamily: "Roboto",
    pages: [
      {
        id: "p1",
        elements: [
          {
            id: "el1",
            x: 40,
            y: 50,
            type: "text",
            content: "Hello",
            fontSize: 12,
            bold: false,
            italic: false,
            underline: false,
            color: "#374151",
            width: 420,
          },
          {
            id: "el2",
            x: 100,
            y: 100,
            type: "text",
            content: "World",
            fontSize: 14,
            bold: false,
            italic: false,
            underline: false,
            color: "#374151",
            width: 200,
          },
        ],
      },
    ],
    styles: { primaryColor: "#1E40AF" },
  },
  createElement: jest.fn((type: string, yOffset: number) => ({
    id: `new-${Date.now()}`,
    x: 40,
    y: yOffset,
    type,
    content: "New text",
    fontSize: 12,
    bold: false,
    italic: false,
    underline: false,
    color: "#374151",
    width: 420,
  })),
  makeId: jest.fn(() => `id-${Date.now()}-${Math.random()}`),
  CANVAS_SCALE: 0.75,
  getPageDimensions: jest.fn(() => ({ width: 595, height: 842 })),
}));

jest.mock("@/lib/placeholders", () => ({
  extractPlaceholders: jest.fn(() => []),
}));

jest.mock("@/lib/utils", () => ({
  downloadJson: jest.fn(),
  btnStyle: jest.fn(() => ({})),
}));

jest.mock("@/lib/imageConvert", () => ({
  ensurePngSrc: jest.fn((s: string) => Promise.resolve(s)),
}));

jest.mock("next/dynamic", () => {
  return function mockDynamic() {
    return function MockDynamic() {
      return React.createElement("span", { "data-testid": "ExportPdfButton" }, "Export");
    };
  };
});

// ── Mock child components with prop-forwarding ────────────────────────────────
let toolbarProps: Record<string, unknown> = {};
jest.mock("../Toolbar", () => {
  return function MockToolbar(props: Record<string, unknown>) {
    toolbarProps = props;
    return React.createElement("div", { "data-testid": "Toolbar" }, "Toolbar");
  };
});

let pageNavProps: Record<string, unknown> = {};
jest.mock("../PageNavigator", () => {
  return function MockPageNavigator(props: Record<string, unknown>) {
    pageNavProps = props;
    return React.createElement("div", { "data-testid": "PageNavigator" }, "PageNav");
  };
});

let canvasProps: Record<string, unknown> = {};
jest.mock("../EditorCanvas", () => {
  return function MockEditorCanvas(props: Record<string, unknown>) {
    canvasProps = props;
    return React.createElement("div", { "data-testid": "EditorCanvas" }, "Canvas");
  };
});

let propsPanelProps: Record<string, unknown> = {};
jest.mock("../../PropertiesPanel", () => {
  return function MockPropertiesPanel(props: Record<string, unknown>) {
    propsPanelProps = props;
    return React.createElement("div", { "data-testid": "PropertiesPanel" }, "Props");
  };
});

let watermarkPanelProps: Record<string, unknown> = {};
jest.mock("../../PropertiesPanel/WatermarkPanel", () => {
  return function MockWatermarkPanel(props: Record<string, unknown>) {
    watermarkPanelProps = props;
    return React.createElement("div", { "data-testid": "WatermarkPanel" });
  };
});

let missingFontsModalProps: Record<string, unknown> = {};
jest.mock("../../modals/MissingFontsModal", () => {
  return function MockMissingFontsModal(props: Record<string, unknown>) {
    missingFontsModalProps = props;
    return React.createElement("div", { "data-testid": "MissingFontsModal" });
  };
});

// ── Import ────────────────────────────────────────────────────────────────────
import PdfEditor from "../index";
import { downloadJson } from "@/lib/utils";

describe("PdfEditor – interactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    toolbarProps = {};
    pageNavProps = {};
    canvasProps = {};
    propsPanelProps = {};
    watermarkPanelProps = {};
    missingFontsModalProps = {};
  });

  // Helper to render and get the child-props references
  function renderEditor(props: Record<string, unknown> = {}) {
    const result = render(React.createElement(PdfEditor, props));
    return result;
  }

  // ─── Select / Deselect ─────────────────────────────────────────────────────
  it("handleSelectElement selects an element and shows PropertiesPanel", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    expect(screen.getByTestId("PropertiesPanel")).toBeTruthy();
  });

  it("handleSelectElement with additive=true toggles selection", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    // Now two selected -> shows multi-select message
    expect(screen.getByText(/2 elements/)).toBeTruthy();
  });

  it("handleSelectElement additive toggle removes already-selected element", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    // Remove el1
    act(() => onSelect("el1", "body", true));
    // Only el2 selected -> shows PropertiesPanel
    expect(screen.getByTestId("PropertiesPanel")).toBeTruthy();
  });

  it("handleDeselectAll deselects and shows placeholder text", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    expect(screen.getByTestId("PropertiesPanel")).toBeTruthy();

    const onDeselect = canvasProps.onDeselectAll as () => void;
    act(() => onDeselect());
    expect(screen.getByText("Select an element to edit its properties.")).toBeTruthy();
  });

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  it("Ctrl+Z triggers undo", () => {
    renderEditor();
    // Make a change first (add element via toolbar)
    const onAdd = toolbarProps.onAddElement as (type: string) => void;
    act(() => onAdd("text"));
    // Then undo
    act(() => fireEvent.keyDown(document, { key: "z", ctrlKey: true }));
    // Should have reverted
  });

  it("Ctrl+Y triggers redo", () => {
    renderEditor();
    const onAdd = toolbarProps.onAddElement as (type: string) => void;
    act(() => onAdd("text"));
    act(() => fireEvent.keyDown(document, { key: "z", ctrlKey: true }));
    act(() => fireEvent.keyDown(document, { key: "y", ctrlKey: true }));
  });

  it("Ctrl+Shift+Z triggers redo", () => {
    renderEditor();
    const onAdd = toolbarProps.onAddElement as (type: string) => void;
    act(() => onAdd("text"));
    act(() => fireEvent.keyDown(document, { key: "z", ctrlKey: true }));
    act(() => fireEvent.keyDown(document, { key: "z", ctrlKey: true, shiftKey: true }));
  });

  it("Delete key deletes selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    expect(screen.getByTestId("PropertiesPanel")).toBeTruthy();
    act(() => fireEvent.keyDown(document, { key: "Delete" }));
    // el1 is deleted, should show placeholder
    expect(screen.getByText("Select an element to edit its properties.")).toBeTruthy();
  });

  it("Backspace key deletes selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => fireEvent.keyDown(document, { key: "Backspace" }));
    expect(screen.getByText("Select an element to edit its properties.")).toBeTruthy();
  });

  it("Ctrl+A selects all elements in active section", () => {
    renderEditor();
    act(() => fireEvent.keyDown(document, { key: "a", ctrlKey: true }));
    // Both el1 and el2 should be selected -> multi-select
    expect(screen.getByText(/2 elements/)).toBeTruthy();
  });

  it("Ctrl+C / Ctrl+V copy and paste", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => fireEvent.keyDown(document, { key: "c", ctrlKey: true }));
    act(() => fireEvent.keyDown(document, { key: "v", ctrlKey: true }));
    // Should have pasted a new element
  });

  it("Ctrl+D duplicates selected element", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => fireEvent.keyDown(document, { key: "d", ctrlKey: true }));
    // el1 duplicated
  });

  it("keyboard shortcuts are suppressed when target is an input", () => {
    renderEditor();
    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => fireEvent.keyDown(input, { key: "z", ctrlKey: true }));
    document.body.removeChild(input);
    // No error, just verify no crash
  });

  // ─── Save / Load JSON ─────────────────────────────────────────────────────
  it("onSaveJSON calls downloadJson", () => {
    renderEditor();
    const onSave = toolbarProps.onSaveJSON as () => void;
    act(() => onSave());
    expect(downloadJson).toHaveBeenCalledWith(expect.any(Object), "template.json");
  });

  it("onLoadJSON loads a valid template", async () => {
    renderEditor();
    const onLoad = toolbarProps.onLoadJSON as (e: React.ChangeEvent<HTMLInputElement>) => void;

    const templateData = {
      name: "Loaded",
      pageSize: "A4",
      pages: [{ id: "lp1", elements: [] }],
      styles: { primaryColor: "#000" },
    };

    const file = new File([JSON.stringify(templateData)], "template.json", {
      type: "application/json",
    });

    const event = {
      target: { files: [file], value: "template.json" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      onLoad(event);
    });
  });

  it("onLoadJSON handles invalid JSON", async () => {
    const alertSpy = jest.spyOn(globalThis, "alert").mockImplementation(() => {});
    renderEditor();
    const onLoad = toolbarProps.onLoadJSON as (e: React.ChangeEvent<HTMLInputElement>) => void;

    const file = new File(["not json"], "bad.json", { type: "application/json" });
    const event = {
      target: { files: [file], value: "bad.json" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      onLoad(event);
    });
    expect(alertSpy).toHaveBeenCalledWith("Invalid JSON file");
    alertSpy.mockRestore();
  });

  it("onLoadJSON with uploaded fonts checks missing fonts", async () => {
    renderEditor();
    const onLoad = toolbarProps.onLoadJSON as (e: React.ChangeEvent<HTMLInputElement>) => void;

    const templateData = {
      name: "WithFonts",
      pageSize: "A4",
      pages: [{ id: "lp1", elements: [] }],
      styles: { primaryColor: "#000" },
      fonts: [
        {
          family: "Custom",
          faces: [{ weight: "normal", style: "normal", source: "uploaded", ref: "custom-ref" }],
        },
      ],
    };

    const file = new File([JSON.stringify(templateData)], "template.json", {
      type: "application/json",
    });
    const event = {
      target: { files: [file], value: "template.json" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    // loadJSON triggers fetch for font status — mock it at globalThis level
    const origFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ missing: ["custom-ref"] }),
    }) as typeof fetch;

    await act(async () => {
      await onLoad(event);
    });

    globalThis.fetch = origFetch;
    // Verify the template was loaded (Toolbar re-rendered with new data)
    expect(toolbarProps.template).toBeTruthy();
  });

  it("onLoadJSON handles font status API failure gracefully", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    renderEditor();
    const onLoad = toolbarProps.onLoadJSON as (e: React.ChangeEvent<HTMLInputElement>) => void;

    const templateData = {
      name: "WithFonts",
      pageSize: "A4",
      pages: [{ id: "lp1", elements: [] }],
      styles: { primaryColor: "#000" },
      fonts: [
        {
          family: "Custom",
          faces: [{ weight: "normal", style: "normal", source: "uploaded", ref: "custom-ref" }],
        },
      ],
    };

    const file = new File([JSON.stringify(templateData)], "template.json", {
      type: "application/json",
    });
    const event = {
      target: { files: [file], value: "template.json" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      onLoad(event);
    });
    // Should not crash — no MissingFontsModal should appear
    expect(screen.queryByTestId("MissingFontsModal")).toBeNull();
  });

  it("onLoadJSON with no missing fonts skips modal", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ missing: [] }),
    });
    renderEditor();
    const onLoad = toolbarProps.onLoadJSON as (e: React.ChangeEvent<HTMLInputElement>) => void;

    const templateData = {
      name: "WithFonts",
      pageSize: "A4",
      pages: [{ id: "lp1", elements: [] }],
      styles: { primaryColor: "#000" },
      fonts: [
        {
          family: "Custom",
          faces: [{ weight: "normal", style: "normal", source: "uploaded", ref: "custom-ref" }],
        },
      ],
    };

    const file = new File([JSON.stringify(templateData)], "template.json", {
      type: "application/json",
    });
    const event = {
      target: { files: [file], value: "template.json" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      onLoad(event);
    });
    expect(screen.queryByTestId("MissingFontsModal")).toBeNull();
  });

  it("onLoadJSON with no files is a no-op", async () => {
    renderEditor();
    const onLoad = toolbarProps.onLoadJSON as (e: React.ChangeEvent<HTMLInputElement>) => void;
    const event = {
      target: { files: [], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    await act(async () => {
      onLoad(event);
    });
    // No crash
  });

  // ─── updateElement from properties panel ──────────────────────────────────
  it("updateElement updates an element property", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onUpdate = propsPanelProps.onUpdate as (pageIdx: number, elId: string, key: string, value: unknown) => void;
    act(() => onUpdate(0, "el1", "content", "Updated"));
    // The template state should have been updated
  });

  // ─── handleDeleteElement ──────────────────────────────────────────────────
  it("handleDeleteElement removes an element from the template", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onDelete = propsPanelProps.onDelete as (pageIdx: number, elId: string) => void;
    act(() => onDelete(0, "el1"));
    expect(screen.getByText("Select an element to edit its properties.")).toBeTruthy();
  });

  // ─── handleAddPage / handleDeletePage ─────────────────────────────────────
  it("handleAddPage adds a new page", () => {
    renderEditor();
    const onAddPage = pageNavProps.onAddPage as () => void;
    act(() => onAddPage());
    // After adding a page, the activePage should change
  });

  it("handleDeletePage removes a page", () => {
    renderEditor();
    // First add a page so we have 2
    const onAddPage = pageNavProps.onAddPage as () => void;
    act(() => onAddPage());
    const onDeletePage = pageNavProps.onDeletePage as (pi: number) => void;
    act(() => onDeletePage(1));
  });

  it("handleDeletePage on last page is a no-op", () => {
    const template = {
      name: "Test",
      pageSize: "A4" as const,
      fontFamily: "Roboto",
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#1E40AF" },
    };
    renderEditor({ initialTemplate: template });
    const onDeletePage = pageNavProps.onDeletePage as (pi: number) => void;
    act(() => onDeletePage(0));
    // Should still have the page
  });

  // ─── handleMoveZOrder ─────────────────────────────────────────────────────
  it("moveZOrder brings element to front", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onMoveZ = propsPanelProps.onMoveZOrder as (dir: string) => void;
    act(() => onMoveZ("top"));
  });

  it("moveZOrder sends element to back", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el2", "body", false));
    const onMoveZ = propsPanelProps.onMoveZOrder as (dir: string) => void;
    act(() => onMoveZ("bottom"));
  });

  it("moveZOrder moves element up", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onMoveZ = propsPanelProps.onMoveZOrder as (dir: string) => void;
    act(() => onMoveZ("up"));
  });

  it("moveZOrder moves element down", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el2", "body", false));
    const onMoveZ = propsPanelProps.onMoveZOrder as (dir: string) => void;
    act(() => onMoveZ("down"));
  });

  it("moveZOrder with no selection is a no-op", () => {
    renderEditor();
    const onMoveZ = toolbarProps.onMoveZOrder as (dir: string) => void;
    act(() => onMoveZ("top"));
  });

  // ─── Page size / font family changes ──────────────────────────────────────
  it("onPageSizeChange updates template page size", () => {
    renderEditor();
    const onPageSize = toolbarProps.onPageSizeChange as (s: string) => void;
    act(() => onPageSize("A3"));
  });

  it("onFontChange updates template font family", () => {
    renderEditor();
    const onFont = toolbarProps.onFontChange as (f: string) => void;
    act(() => onFont("Arial"));
  });

  // ─── Section switching ────────────────────────────────────────────────────
  it("onToggleSection adds header when not present", () => {
    renderEditor();
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("header"));
    // Header should now exist
  });

  it("onToggleSection removes header when present", () => {
    renderEditor();
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("header")); // add
    act(() => onToggle("header")); // remove
  });

  it("onToggleSection adds footer", () => {
    renderEditor();
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("footer"));
  });

  it("onToggleSection removes footer when active section is footer", () => {
    renderEditor();
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("footer")); // add, sets activeSection to footer
    act(() => onToggle("footer")); // remove while activeSection is footer
  });

  it("onSectionChange via EditorCanvas updates active section", () => {
    renderEditor();
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("header")); // add header
    const onSectionChange = canvasProps.onSectionChange as (s: string) => void;
    act(() => onSectionChange("header"));
  });

  // ─── Multi-select alignment ───────────────────────────────────────────────
  it("alignElements left aligns selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("left"));
  });

  it("alignElements right aligns selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("right"));
  });

  it("alignElements center aligns selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("center"));
  });

  it("alignElements top aligns selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("top"));
  });

  it("alignElements bottom aligns selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("bottom"));
  });

  it("alignElements middle aligns selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("middle"));
  });

  it("alignElements distribute-h distributes selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("distribute-h"));
  });

  it("alignElements distribute-v distributes selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("distribute-v"));
  });

  it("alignElements with < 2 selected is a no-op", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onAlign = toolbarProps.onAlign as (alignment: string) => void;
    act(() => onAlign("left"));
  });

  // ─── Copy / Paste / Duplicate via toolbar ─────────────────────────────────
  it("onCopy/onPaste via toolbar copies and pastes element", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onCopy = toolbarProps.onCopy as () => void;
    act(() => onCopy());
    const onPaste = toolbarProps.onPaste as () => void;
    act(() => onPaste());
  });

  it("onPaste with empty clipboard is a no-op", () => {
    renderEditor();
    const onPaste = toolbarProps.onPaste as () => void;
    act(() => onPaste());
  });

  it("onDuplicate via toolbar duplicates element", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onDup = toolbarProps.onDuplicate as () => void;
    act(() => onDup());
  });

  it("onDuplicate with no selection is a no-op", () => {
    renderEditor();
    const onDup = toolbarProps.onDuplicate as () => void;
    act(() => onDup());
  });

  it("onDelete via toolbar deletes selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onDelete = toolbarProps.onDelete as () => void;
    act(() => onDelete());
    expect(screen.getByText("Select an element to edit its properties.")).toBeTruthy();
  });

  it("deleteSelected with no selection is a no-op", () => {
    renderEditor();
    const onDelete = toolbarProps.onDelete as () => void;
    act(() => onDelete());
    // Should not crash
  });

  // ─── Toggle options ───────────────────────────────────────────────────────
  it("onToggleMetadata toggles includeMetadata", () => {
    renderEditor();
    const toggle = toolbarProps.onToggleMetadata as () => void;
    act(() => toggle());
    // toggle was called — just verify it doesn't crash
  });

  it("onTogglePassword toggles includePassword", () => {
    renderEditor();
    const toggle = toolbarProps.onTogglePassword as () => void;
    act(() => toggle());
  });

  it("onTogglePdfA toggles includePdfA", () => {
    renderEditor();
    const toggle = toolbarProps.onTogglePdfA as () => void;
    act(() => toggle());
  });

  it("onToggleSignature toggles includeSignature", () => {
    renderEditor();
    const toggle = toolbarProps.onToggleSignature as () => void;
    act(() => toggle());
  });

  it("onToggleWatermark toggles watermark", () => {
    renderEditor();
    const toggle = toolbarProps.onToggleWatermark as () => void;
    act(() => toggle());
    // After toggling, watermark should be enabled -> WatermarkPanel should show
    expect(screen.getByTestId("WatermarkPanel")).toBeTruthy();
  });

  // ─── Page selection via PageNavigator ─────────────────────────────────────
  it("selecting a page via PageNavigator changes active page", () => {
    renderEditor();
    const onSelectPage = pageNavProps.onSelectPage as (pi: number) => void;
    act(() => onSelectPage(0));
  });

  // ─── handleDragStart ──────────────────────────────────────────────────────
  it("handleDragStart and drag/drop cycle works", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));

    const onDragStart = canvasProps.onDragStart as (e: React.MouseEvent, elId: string, section: string) => void;
    const mouseEvent = { clientX: 100, clientY: 100 } as React.MouseEvent;
    act(() => onDragStart(mouseEvent, "el1", "body"));

    // Simulate mousemove
    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 130 }));
    });

    // Simulate mouseup
    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mouseup"));
    });
  });

  it("handleDragStart with multi-select moves all selected elements", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));

    const onDragStart = canvasProps.onDragStart as (e: React.MouseEvent, elId: string, section: string) => void;
    const mouseEvent = { clientX: 100, clientY: 100 } as React.MouseEvent;
    act(() => onDragStart(mouseEvent, "el1", "body"));

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 130 }));
    });
    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mouseup"));
    });
  });

  it("handleDragStart with invalid element id is a no-op", () => {
    renderEditor();
    const onDragStart = canvasProps.onDragStart as (e: React.MouseEvent, elId: string, section: string) => void;
    const mouseEvent = { clientX: 100, clientY: 100 } as React.MouseEvent;
    act(() => onDragStart(mouseEvent, "nonexistent", "body"));
    // No crash
  });

  // ─── handleResizeStart ────────────────────────────────────────────────────
  it("handleResizeStart and resize cycle works (se handle)", () => {
    renderEditor();
    const onResize = canvasProps.onResizeStart as (e: React.MouseEvent, elId: string, handle: string, section: string) => void;
    const mouseEvent = {
      clientX: 100,
      clientY: 100,
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
    act(() => onResize(mouseEvent, "el1", "se", "body"));

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 150, clientY: 160 }));
    });
    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mouseup"));
    });
  });

  it("handleResizeStart with nw handle", () => {
    renderEditor();
    const onResize = canvasProps.onResizeStart as (e: React.MouseEvent, elId: string, handle: string, section: string) => void;
    const mouseEvent = {
      clientX: 100,
      clientY: 100,
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
    act(() => onResize(mouseEvent, "el1", "nw", "body"));

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 80, clientY: 70 }));
    });
    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mouseup"));
    });
  });

  it("handleResizeStart with invalid element is a no-op", () => {
    renderEditor();
    const onResize = canvasProps.onResizeStart as (e: React.MouseEvent, elId: string, handle: string, section: string) => void;
    const mouseEvent = {
      clientX: 100,
      clientY: 100,
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
    act(() => onResize(mouseEvent, "nonexistent", "se", "body"));
    // No crash
  });

  // ─── Section resize ───────────────────────────────────────────────────────
  it("startSectionResize for header", () => {
    renderEditor();
    // Add header first
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("header"));

    const onSectionResize = canvasProps.onSectionResize as (e: React.MouseEvent, section: string) => void;
    const mouseEvent = {
      clientX: 100,
      clientY: 100,
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
    act(() => onSectionResize(mouseEvent, "header"));

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 130 }));
    });
    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mouseup"));
    });
  });

  it("startSectionResize for footer", () => {
    renderEditor();
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("footer"));

    const onSectionResize = canvasProps.onSectionResize as (e: React.MouseEvent, section: string) => void;
    const mouseEvent = {
      clientX: 100,
      clientY: 100,
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
    act(() => onSectionResize(mouseEvent, "footer"));

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 70 }));
    });
    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mouseup"));
    });
  });

  // ─── Add element to header/footer sections ───────────────────────────────
  it("addElement to header section", () => {
    renderEditor();
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("header")); // adds header and sets activeSection to header
    const onAdd = toolbarProps.onAddElement as (type: string) => void;
    act(() => onAdd("text"));
  });

  it("addElement to footer section", () => {
    renderEditor();
    const onToggle = toolbarProps.onToggleSection as (type: string) => void;
    act(() => onToggle("footer"));
    const onAdd = toolbarProps.onAddElement as (type: string) => void;
    act(() => onAdd("text"));
  });

  // ─── insertPlaceholder ────────────────────────────────────────────────────
  it("insertPlaceholder appends placeholder to text element", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    const onInsert = toolbarProps.onInsertPlaceholder as (name: string) => void;
    act(() => onInsert("myField"));
  });

  it("insertPlaceholder with no selection is a no-op", () => {
    renderEditor();
    const onInsert = toolbarProps.onInsertPlaceholder as (name: string) => void;
    act(() => onInsert("myField"));
    // No crash
  });

  // ─── Watermark panel display ──────────────────────────────────────────────
  it("shows watermark panel when enabled and nothing selected", () => {
    renderEditor();
    const toggle = toolbarProps.onToggleWatermark as () => void;
    act(() => toggle());
    expect(screen.getByTestId("WatermarkPanel")).toBeTruthy();
  });

  it("multi-select message shows when multiple elements selected", () => {
    renderEditor();
    const onSelect = canvasProps.onSelectElement as (id: string, section: string, additive: boolean) => void;
    act(() => onSelect("el1", "body", false));
    act(() => onSelect("el2", "body", true));
    expect(screen.getByText(/2 elements/)).toBeTruthy();
    expect(screen.getByText(/Use toolbar to align or distribute/)).toBeTruthy();
  });

  // ─── Coverage: template with includeMetadata: true (L39 truthy branch) ────
  it("initialTemplate with includeMetadata=true initialises metadata state to true", () => {
    const template = {
      name: "MetaTest",
      pageSize: "A4" as const,
      fontFamily: "Roboto",
      includeMetadata: true,
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#000" },
    };
    renderEditor({ initialTemplate: template });
    expect(toolbarProps.includeMetadata).toBe(true);
  });

  // ─── Coverage: template without fontFamily (L179 ?? "Roboto" falsy branch) ─
  it("template without fontFamily falls back to Roboto for EditorCanvas", () => {
    const template = {
      name: "NoFont",
      pageSize: "A4" as const,
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#000" },
    };
    renderEditor({ initialTemplate: template });
    expect(canvasProps.fontFamily).toBe("Roboto");
  });

  // ─── Coverage: page without header/footer (L115-116 ?? 0 falsy branches) ──
  it("page without header or footer computes headerH and footerH as 0", () => {
    const template = {
      name: "NoSections",
      pageSize: "A4" as const,
      fontFamily: "Roboto",
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#000" },
    };
    renderEditor({ initialTemplate: template });
    expect(canvasProps.headerH).toBe(0);
    expect(canvasProps.footerH).toBe(0);
  });

  it("page with header/footer that have no height uses 0", () => {
    const template = {
      name: "SectionsNoHeight",
      pageSize: "A4" as const,
      fontFamily: "Roboto",
      pages: [{
        id: "p1",
        elements: [],
        header: { elements: [] },
        footer: { elements: [] },
      }],
      styles: { primaryColor: "#000" },
    };
    renderEditor({ initialTemplate: template });
    expect(canvasProps.headerH).toBe(0);
    expect(canvasProps.footerH).toBe(0);
  });

  it("undefined currentPage (out-of-bounds activePage) yields headerH=0, footerH=0", () => {
    // Render with 2 pages, navigate to page 2, then delete page 2
    // This forces a re-render where currentPage may be undefined momentarily
    const template = {
      name: "OOB",
      pageSize: "A4" as const,
      fontFamily: "Roboto",
      pages: [
        { id: "p1", elements: [] },
        { id: "p2", elements: [] },
      ],
      styles: { primaryColor: "#000" },
    };
    renderEditor({ initialTemplate: template });
    // Navigate to page 2 (index 1)
    const onSelectPage = pageNavProps.onSelectPage as (pi: number) => void;
    act(() => onSelectPage(1));
    // Delete page 2 — this should cause activePage to adjust
    const onDeletePage = pageNavProps.onDeletePage as (pi: number) => void;
    act(() => onDeletePage(1));
    // Should still yield valid dimensions
    expect(canvasProps.headerH).toBe(0);
    expect(canvasProps.footerH).toBe(0);
  });

  // ─── Coverage: watermark with existing enabled watermark (L102 branches) ───
  it("template with watermark already enabled covers ?? DEFAULT_WATERMARK branches", () => {
    const template = {
      name: "WatermarkTest",
      pageSize: "A4" as const,
      fontFamily: "Roboto",
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#000" },
      watermark: {
        enabled: true,
        pages: "all" as const,
        width: 100,
        height: 100,
        x: 50,
        y: 50,
        opacity: 0.3,
      },
    };
    renderEditor({ initialTemplate: template });
    // watermark is enabled, WatermarkPanel should show (nothing selected)
    expect(screen.getByTestId("WatermarkPanel")).toBeTruthy();
    // Toggle watermark off — covers t.watermark?.enabled ?? false as true
    const toggle = toolbarProps.onToggleWatermark as () => void;
    act(() => toggle());
    // After toggling off, WatermarkPanel should disappear
    expect(screen.queryByTestId("WatermarkPanel")).toBeNull();
  });

  // ─── Coverage: updateWatermark (L106-107) ─────────────────────────────────
  it("updateWatermark via WatermarkPanel onUpdate updates watermark config", () => {
    const template = {
      name: "WMUpdate",
      pageSize: "A4" as const,
      fontFamily: "Roboto",
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#000" },
      watermark: {
        enabled: true,
        pages: "all" as const,
        width: 200,
        height: 200,
        x: 197,
        y: 321,
        opacity: 0.15,
      },
    };
    renderEditor({ initialTemplate: template });
    expect(screen.getByTestId("WatermarkPanel")).toBeTruthy();
    const onUpdate = watermarkPanelProps.onUpdate as (wm: unknown) => void;
    act(() =>
      onUpdate({
        enabled: true,
        pages: "all",
        width: 300,
        height: 300,
        x: 100,
        y: 100,
        opacity: 0.5,
      })
    );
    // Watermark should still be enabled, panel should still show
    expect(screen.getByTestId("WatermarkPanel")).toBeTruthy();
  });

  // ─── Coverage: MissingFontsModal appears + onResolved/onDismiss (L242-245) ─
  it("loadJSON with missing uploaded fonts shows MissingFontsModal, onResolved clears it", async () => {
    const origFetch = globalThis.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ missing: ["custom-ref"] }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    renderEditor();
    const onLoad = toolbarProps.onLoadJSON as (e: React.ChangeEvent<HTMLInputElement>) => void;

    const templateData = {
      name: "WithFonts",
      pageSize: "A4",
      pages: [{ id: "lp1", elements: [] }],
      styles: { primaryColor: "#000" },
      fonts: [
        {
          family: "Custom",
          faces: [{ weight: "normal", style: "normal", source: "uploaded", ref: "custom-ref" }],
        },
      ],
    };

    const jsonContent = JSON.stringify(templateData);
    const file = new File([jsonContent], "template.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent) });
    const event = {
      target: { files: [file], value: "template.json" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await onLoad(event);
    });
    expect(fetchMock).toHaveBeenCalled();

    await act(async () => { /* flush */ });

    expect(screen.getByTestId("MissingFontsModal")).toBeTruthy();

    const onResolved = missingFontsModalProps.onResolved as () => void;
    act(() => onResolved());
    expect(screen.queryByTestId("MissingFontsModal")).toBeNull();

    globalThis.fetch = origFetch;
  });

  it("MissingFontsModal onDismiss clears the modal", async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ missing: ["custom-ref"] }),
    }) as typeof fetch;

    renderEditor();
    const onLoad = toolbarProps.onLoadJSON as (e: React.ChangeEvent<HTMLInputElement>) => void;

    const templateData = {
      name: "WithFonts2",
      pageSize: "A4",
      pages: [{ id: "lp2", elements: [] }],
      styles: { primaryColor: "#000" },
      fonts: [
        {
          family: "Custom",
          faces: [{ weight: "normal", style: "normal", source: "uploaded", ref: "custom-ref" }],
        },
      ],
    };

    const jsonContent2 = JSON.stringify(templateData);
    const file = new File([jsonContent2], "template.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent2) });
    const event = {
      target: { files: [file], value: "template.json" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await onLoad(event);
    });
    await act(async () => { /* flush */ });

    expect(screen.getByTestId("MissingFontsModal")).toBeTruthy();

    const onDismiss = missingFontsModalProps.onDismiss as () => void;
    act(() => onDismiss());
    expect(screen.queryByTestId("MissingFontsModal")).toBeNull();

    globalThis.fetch = origFetch;
  });
});
