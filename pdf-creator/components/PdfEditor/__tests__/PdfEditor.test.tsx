/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mock lucide-react with Proxy (used by all sub-components) ───────────────
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

// ── Mock all external dependencies ──────────────────────────────────────────

const mockSet = jest.fn();
const mockUndo = jest.fn();
const mockRedo = jest.fn();

jest.mock("@/lib/useHistory", () => ({
  useHistory: jest.fn((initial: unknown) => ({
    state: initial,
    set: mockSet,
    undo: mockUndo,
    redo: mockRedo,
    canUndo: false,
    canRedo: false,
  })),
}));

jest.mock("@/lib/useEditorFonts", () => ({
  useEditorFonts: jest.fn(),
}));

jest.mock("@/lib/templates", () => ({
  DEFAULT_TEMPLATE: {
    name: "Test",
    pageSize: "A4",
    fontFamily: "Roboto",
    pages: [{ id: "p1", elements: [] }],
    styles: { primaryColor: "#1E40AF" },
  },
  createElement: jest.fn(() => ({
    id: "new-el",
    x: 40,
    y: 50,
    type: "text",
    content: "New text",
    fontSize: 12,
    bold: false,
    italic: false,
    underline: false,
    color: "#374151",
    width: 420,
  })),
  makeId: jest.fn(() => "new-id"),
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

// Mock next/dynamic
jest.mock("next/dynamic", () => {
  return function mockDynamic() {
    return function MockDynamic() {
      return React.createElement(
        "span",
        { "data-testid": "ExportPdfButton" },
        "Export"
      );
    };
  };
});

// Mock child components
jest.mock("../Toolbar", () => {
  return function MockToolbar(props: Record<string, unknown>) {
    return React.createElement(
      "div",
      { "data-testid": "Toolbar" },
      JSON.stringify(Object.keys(props))
    );
  };
});

jest.mock("../PageNavigator", () => {
  return function MockPageNavigator(props: {
    onSelectPage: (n: number) => void;
    onAddPage: () => void;
    onDeletePage: (n: number) => void;
  }) {
    return React.createElement(
      "div",
      { "data-testid": "PageNavigator" },
      React.createElement(
        "button",
        {
          "data-testid": "select-page-0",
          onClick: () => props.onSelectPage(0),
        },
        "P1"
      ),
      React.createElement(
        "button",
        { "data-testid": "add-page", onClick: props.onAddPage },
        "Add"
      ),
      React.createElement(
        "button",
        {
          "data-testid": "delete-page-0",
          onClick: () => props.onDeletePage(0),
        },
        "Del"
      )
    );
  };
});

jest.mock("../EditorCanvas", () => {
  return function MockEditorCanvas() {
    return React.createElement("div", { "data-testid": "EditorCanvas" });
  };
});

jest.mock("../../PropertiesPanel", () => {
  return function MockPropertiesPanel() {
    return React.createElement("div", { "data-testid": "PropertiesPanel" });
  };
});

jest.mock("../../PropertiesPanel/WatermarkPanel", () => {
  return function MockWatermarkPanel() {
    return React.createElement("div", { "data-testid": "WatermarkPanel" });
  };
});

jest.mock("../../modals/MissingFontsModal", () => {
  return function MockMissingFontsModal() {
    return React.createElement("div", { "data-testid": "MissingFontsModal" });
  };
});

jest.mock("../../PageSizeSelector", () => {
  return function MockPageSizeSelector() {
    return React.createElement("div", { "data-testid": "PageSizeSelector" });
  };
});

jest.mock("../../FontSelector", () => {
  return function MockFontSelector() {
    return React.createElement("div", { "data-testid": "FontSelector" });
  };
});

jest.mock("../../PlaceholderPicker", () => {
  return function MockPlaceholderPicker() {
    return React.createElement("div", { "data-testid": "PlaceholderPicker" });
  };
});

jest.mock("../../ElementView", () => {
  return function MockElementView(props: { el: { id: string } }) {
    return React.createElement("div", {
      "data-testid": `element-${props.el.id}`,
    });
  };
});

// ── PdfEditor Tests ─────────────────────────────────────────────────────────

describe("PdfEditor", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PdfEditor = require("../index").default;

  const minimalTemplate = {
    name: "Test",
    pageSize: "A4" as const,
    fontFamily: "Roboto",
    pages: [{ id: "p1", elements: [] }],
    styles: { primaryColor: "#1E40AF" },
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing with no props", () => {
    render(React.createElement(PdfEditor));
    expect(screen.getByTestId("Toolbar")).toBeTruthy();
    expect(screen.getByTestId("PageNavigator")).toBeTruthy();
    expect(screen.getByTestId("EditorCanvas")).toBeTruthy();
  });

  it("renders with initialTemplate", () => {
    render(React.createElement(PdfEditor, { initialTemplate: minimalTemplate }));
    expect(screen.getByTestId("Toolbar")).toBeTruthy();
  });

  it("renders with onBack callback", () => {
    const onBack = jest.fn();
    render(
      React.createElement(PdfEditor, {
        initialTemplate: minimalTemplate,
        onBack,
      })
    );
    expect(screen.getByTestId("Toolbar")).toBeTruthy();
  });

  it("shows select message when nothing is selected", () => {
    render(React.createElement(PdfEditor, { initialTemplate: minimalTemplate }));
    expect(
      screen.getByText("Select an element to edit its properties.")
    ).toBeTruthy();
  });

  it("renders Properties header", () => {
    render(React.createElement(PdfEditor, { initialTemplate: minimalTemplate }));
    expect(screen.getByText("Properties")).toBeTruthy();
  });
});

// ── EditorCanvas Tests ──────────────────────────────────────────────────────

describe("EditorCanvas", () => {
  jest.unmock("../EditorCanvas");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const EditorCanvas = require("../EditorCanvas").default;

  const basePage = {
    id: "p1",
    elements: [
      {
        id: "el1",
        x: 10,
        y: 20,
        type: "text",
        content: "Hello",
        fontSize: 12,
        bold: false,
        italic: false,
        underline: false,
        color: "#000",
        width: 100,
      },
    ],
  };

  const baseProps = {
    currentPage: basePage,
    canvasW: 446,
    canvasH: 631,
    headerH: 0,
    footerH: 0,
    fontFamily: "Roboto",
    activeSection: "body" as const,
    selectedIds: new Set<string>(),
    selectedSection: "body" as const,
    activePage: 0,
    viewMode: "select" as const,
    zoom: 1,
    editorScale: 0.75,
    onDeselectAll: jest.fn(),
    onSectionChange: jest.fn(),
    onSelectElement: jest.fn(),
    onDragStart: jest.fn(),
    onResizeStart: jest.fn(),
    onSectionResize: jest.fn(),
    onViewModeChange: jest.fn(),
    onZoomChange: jest.fn(),
  };

  it("renders without crashing", () => {
    render(React.createElement(EditorCanvas, baseProps));
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("renders body elements", () => {
    render(React.createElement(EditorCanvas, baseProps));
    expect(screen.getByTestId("element-el1")).toBeTruthy();
  });

  it("renders empty state", () => {
    const page = { id: "p1", elements: [] as never[] };
    render(React.createElement(EditorCanvas, { ...baseProps, currentPage: page }));
    expect(screen.getByText("Use the toolbar to add elements")).toBeTruthy();
  });

  it("renders header section when present", () => {
    const page = {
      id: "p1",
      elements: [] as never[],
      header: {
        height: 60,
        elements: [
          {
            id: "hel1",
            x: 0,
            y: 0,
            type: "text" as const,
            content: "H",
            fontSize: 10,
            bold: false,
            italic: false,
            underline: false,
            color: "#000",
            width: 100,
          },
        ],
      },
    };
    render(
      React.createElement(EditorCanvas, {
        ...baseProps,
        currentPage: page,
        headerH: 45,
      })
    );
    expect(screen.getByText("Header", { selector: "span" })).toBeTruthy();
  });

  it("renders footer section when present", () => {
    const page = {
      id: "p1",
      elements: [] as never[],
      footer: { height: 50, elements: [] as never[] },
    };
    render(
      React.createElement(EditorCanvas, {
        ...baseProps,
        currentPage: page,
        footerH: 37.5,
      })
    );
    expect(screen.getByText("Footer", { selector: "span" })).toBeTruthy();
  });

  it("renders watermark when enabled", () => {
    const wm = {
      enabled: true,
      src: "data:image/png;base64,abc",
      pages: "all" as const,
      width: 200,
      height: 200,
      x: 100,
      y: 100,
      opacity: 0.15,
    };
    render(React.createElement(EditorCanvas, { ...baseProps, watermark: wm }));
    expect(screen.getByAltText("watermark")).toBeTruthy();
  });

  it("hides watermark when pages don't match", () => {
    const wm = {
      enabled: true,
      src: "data:image/png;base64,abc",
      pages: [3],
      width: 200,
      height: 200,
      x: 100,
      y: 100,
      opacity: 0.15,
    };
    render(
      React.createElement(EditorCanvas, {
        ...baseProps,
        watermark: wm,
        activePage: 0,
      })
    );
    expect(screen.queryByAltText("watermark")).toBeNull();
  });

  it("handles view mode buttons", () => {
    const onViewModeChange = jest.fn();
    render(
      React.createElement(EditorCanvas, {
        ...baseProps,
        viewMode: "pan" as const,
        onViewModeChange,
      })
    );
    fireEvent.click(screen.getByTitle("Select & move elements"));
    expect(onViewModeChange).toHaveBeenCalledWith("select");
  });

  it("handles zoom buttons", () => {
    const onZoomChange = jest.fn();
    render(
      React.createElement(EditorCanvas, { ...baseProps, zoom: 2, onZoomChange })
    );
    fireEvent.click(screen.getByTitle("Reset zoom to 100%"));
    expect(onZoomChange).toHaveBeenCalledWith(1);
  });
});

// ── Toolbar Tests ───────────────────────────────────────────────────────────

describe("Toolbar", () => {
  jest.unmock("../Toolbar");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Toolbar = require("../Toolbar").default;

  const currentPage = { id: "p1", elements: [] as never[] };

  const baseProps = {
    template: {
      name: "T",
      pageSize: "A4",
      fontFamily: "Roboto",
      pages: [currentPage],
      styles: { primaryColor: "#1E40AF" },
    },
    currentPage,
    selectedEl: null,
    selectedEls: [] as never[],
    selectedIds: new Set<string>(),
    activeSection: "body" as const,
    canUndo: false,
    canRedo: false,
    clipboard: [] as never[],
    onBack: jest.fn(),
    onUndo: jest.fn(),
    onRedo: jest.fn(),
    onSaveJSON: jest.fn(),
    onLoadJSON: jest.fn(),
    onAddElement: jest.fn(),
    onInsertPlaceholder: jest.fn(),
    onToggleSection: jest.fn(),
    onSectionChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    onFontChange: jest.fn(),
    onCopy: jest.fn(),
    onPaste: jest.fn(),
    onDuplicate: jest.fn(),
    onDelete: jest.fn(),
    onMoveZOrder: jest.fn(),
    onAlign: jest.fn(),
    includeMetadata: false,
    onToggleMetadata: jest.fn(),
    includePassword: false,
    onTogglePassword: jest.fn(),
    includePdfA: false,
    onTogglePdfA: jest.fn(),
    includeSignature: false,
    onToggleSignature: jest.fn(),
    watermarkEnabled: false,
    onToggleWatermark: jest.fn(),
  };

  it("renders without crashing", () => {
    render(React.createElement(Toolbar, baseProps));
    expect(screen.getByText("PDF Creator")).toBeTruthy();
  });

  it("hides back button when onBack is undefined", () => {
    render(React.createElement(Toolbar, { ...baseProps, onBack: undefined }));
    expect(screen.queryByText("Templates")).toBeNull();
  });

  it("fires onSaveJSON", () => {
    const fn = jest.fn();
    render(React.createElement(Toolbar, { ...baseProps, onSaveJSON: fn }));
    fireEvent.click(screen.getByText("Save JSON"));
    expect(fn).toHaveBeenCalled();
  });

  it("fires onUndo/onRedo", () => {
    const onUndo = jest.fn();
    const onRedo = jest.fn();
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        canUndo: true,
        canRedo: true,
        onUndo,
        onRedo,
      })
    );
    fireEvent.click(screen.getByTitle("Undo (Ctrl+Z)"));
    fireEvent.click(screen.getByTitle("Redo (Ctrl+Y)"));
    expect(onUndo).toHaveBeenCalled();
    expect(onRedo).toHaveBeenCalled();
  });

  it("shows edit actions when selected", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        selectedIds: new Set(["el1"]),
      })
    );
    expect(screen.getByTitle("Copy (Ctrl+C)")).toBeTruthy();
    expect(screen.getByTitle("Delete (Del)")).toBeTruthy();
  });

  it("shows z-order for single selection", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        selectedIds: new Set(["el1"]),
      })
    );
    expect(screen.getByTitle("Bring to front")).toBeTruthy();
    expect(screen.getByTitle("Send to back")).toBeTruthy();
  });

  it("shows alignment for multi-select", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        selectedIds: new Set(["el1", "el2"]),
        selectedEls: [
          { id: "el1", x: 0, y: 0, type: "text" },
          { id: "el2", x: 100, y: 100, type: "text" },
        ],
      })
    );
    expect(screen.getByTitle("Align left")).toBeTruthy();
  });

  it("shows distribute for 3+ selection", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        selectedIds: new Set(["a", "b", "c"]),
        selectedEls: [
          { id: "a", x: 0, y: 0 },
          { id: "b", x: 50, y: 50 },
          { id: "c", x: 100, y: 100 },
        ],
      })
    );
    expect(screen.getByTitle("Distribute horizontally")).toBeTruthy();
  });

  it("shows text alignment for text element", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        selectedIds: new Set(["el1"]),
        selectedEl: {
          id: "el1",
          x: 0,
          y: 0,
          type: "text",
          content: "t",
          fontSize: 12,
          bold: false,
          italic: false,
          underline: false,
          color: "#000",
          width: 100,
        },
      })
    );
    expect(screen.getByTitle("Align left")).toBeTruthy();
    expect(screen.getByTitle("Align center")).toBeTruthy();
  });

  it("shows shape shortcuts for shape element", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        selectedIds: new Set(["el1"]),
        selectedEl: {
          id: "el1",
          x: 0,
          y: 0,
          type: "shape",
          shapeType: "rectangle",
          width: 100,
          height: 100,
          fillColor: "#000",
          strokeColor: "#000",
          strokeWidth: 1,
          borderRadius: 0,
        },
      })
    );
    expect(screen.getByTitle("rectangle")).toBeTruthy();
    expect(screen.getByTitle("heart")).toBeTruthy();
  });

  it("shows header/footer section toggles", () => {
    render(React.createElement(Toolbar, baseProps));
    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
  });

  it("fires onToggleSection for header", () => {
    const fn = jest.fn();
    render(React.createElement(Toolbar, { ...baseProps, onToggleSection: fn }));
    fireEvent.click(screen.getAllByText("Header")[0]);
    expect(fn).toHaveBeenCalledWith("header");
  });

  it("shows target section buttons when header exists", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        currentPage: { id: "p1", elements: [], header: { height: 60, elements: [] } },
      })
    );
    expect(screen.getByText("Target:")).toBeTruthy();
  });

  it("fires toggle callbacks", () => {
    const meta = jest.fn();
    const wm = jest.fn();
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        onToggleMetadata: meta,
        onToggleWatermark: wm,
      })
    );
    fireEvent.click(screen.getByText("Metadata"));
    fireEvent.click(screen.getByText("Watermark"));
    expect(meta).toHaveBeenCalled();
    expect(wm).toHaveBeenCalled();
  });

  it("renders element add buttons and fires onAddElement", () => {
    const fn = jest.fn();
    render(React.createElement(Toolbar, { ...baseProps, onAddElement: fn }));
    expect(screen.getByText("Text")).toBeTruthy();
    expect(screen.getByText("Repeater")).toBeTruthy();
    fireEvent.click(screen.getByTitle("Add Text"));
    expect(fn).toHaveBeenCalledWith("text");
  });

  it("renders with enabled feature flags", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        includeMetadata: true,
        includePassword: true,
        includePdfA: true,
        includeSignature: true,
        watermarkEnabled: true,
      })
    );
    expect(screen.getByText("Metadata")).toBeTruthy();
    expect(screen.getByText("Password")).toBeTruthy();
    expect(screen.getByText("PDF/A")).toBeTruthy();
    expect(screen.getByText("Sign")).toBeTruthy();
    expect(screen.getByText("Watermark")).toBeTruthy();
  });

  it("renders list style buttons for text element", () => {
    render(
      React.createElement(Toolbar, {
        ...baseProps,
        selectedIds: new Set(["el1"]),
        selectedEl: {
          id: "el1",
          x: 0,
          y: 0,
          type: "text",
          content: "t",
          fontSize: 12,
          bold: false,
          italic: false,
          underline: false,
          color: "#000",
          width: 100,
          listStyle: "bullet",
        },
      })
    );
    expect(screen.getByTitle("Plain text")).toBeTruthy();
    expect(screen.getByTitle("bullet list")).toBeTruthy();
    expect(screen.getByTitle("numbered list")).toBeTruthy();
  });
});

// ── PageNavigator Tests ─────────────────────────────────────────────────────

describe("PageNavigator", () => {
  jest.unmock("../PageNavigator");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PageNavigator = require("../PageNavigator").default;

  const pages = [
    { id: "p1", elements: [] },
    { id: "p2", elements: [] },
  ];

  it("renders pages", () => {
    render(
      React.createElement(PageNavigator, {
        pages,
        activePage: 0,
        onSelectPage: jest.fn(),
        onAddPage: jest.fn(),
        onDeletePage: jest.fn(),
      })
    );
    expect(screen.getByText("Pages")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("fires onSelectPage", () => {
    const fn = jest.fn();
    render(
      React.createElement(PageNavigator, {
        pages,
        activePage: 0,
        onSelectPage: fn,
        onAddPage: jest.fn(),
        onDeletePage: jest.fn(),
      })
    );
    fireEvent.click(screen.getByLabelText("Go to page 2"));
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("fires onAddPage", () => {
    const fn = jest.fn();
    render(
      React.createElement(PageNavigator, {
        pages,
        activePage: 0,
        onSelectPage: jest.fn(),
        onAddPage: fn,
        onDeletePage: jest.fn(),
      })
    );
    fireEvent.click(screen.getByText("+ Add"));
    expect(fn).toHaveBeenCalled();
  });

  it("fires onDeletePage", () => {
    const fn = jest.fn();
    render(
      React.createElement(PageNavigator, {
        pages,
        activePage: 0,
        onSelectPage: jest.fn(),
        onAddPage: jest.fn(),
        onDeletePage: fn,
      })
    );
    fireEvent.click(screen.getAllByText("\u00d7")[0]);
    expect(fn).toHaveBeenCalledWith(0);
  });

  it("hides delete for single page", () => {
    render(
      React.createElement(PageNavigator, {
        pages: [{ id: "p1", elements: [] }],
        activePage: 0,
        onSelectPage: jest.fn(),
        onAddPage: jest.fn(),
        onDeletePage: jest.fn(),
      })
    );
    expect(screen.queryByText("\u00d7")).toBeNull();
  });
});
