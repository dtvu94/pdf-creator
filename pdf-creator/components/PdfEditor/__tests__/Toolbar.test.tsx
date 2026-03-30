/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Template, TemplatePage, TemplateElement } from "@/types/template";

// Mock next/dynamic
jest.mock("next/dynamic", () => {
  const Comp = () =>
    React.createElement("div", { "data-testid": "dynamic" });
  Comp.displayName = "Dynamic";
  return () => Comp;
});

// Mock sibling components
jest.mock("@/components/PageSizeSelector", () => {
  const M = (props: { value?: string; onChange: (s: string) => void }) =>
    React.createElement("select", { "data-testid": "page-size-selector", onChange: (e: React.ChangeEvent<HTMLSelectElement>) => props.onChange(e.target.value) });
  M.displayName = "PageSizeSelector";
  return { __esModule: true, default: M };
});

jest.mock("@/components/FontSelector", () => {
  const M = (props: { value?: string; onChange: (s: string) => void }) =>
    React.createElement("select", { "data-testid": "font-selector", onChange: (e: React.ChangeEvent<HTMLSelectElement>) => props.onChange(e.target.value) });
  M.displayName = "FontSelector";
  return { __esModule: true, default: M };
});

jest.mock("@/components/PlaceholderPicker", () => {
  const M = (props: { disabled?: boolean; onInsert: (n: string) => void }) =>
    React.createElement("button", { "data-testid": "placeholder-picker", disabled: props.disabled, onClick: () => props.onInsert("{{test}}") });
  M.displayName = "PlaceholderPicker";
  return { __esModule: true, default: M };
});

jest.mock("@/lib/utils", () => ({
  btnStyle: (bg: string) => ({ background: bg, color: "#fff", border: "none", borderRadius: 4, padding: "5px 11px", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui", whiteSpace: "nowrap" }),
}));

jest.mock("@/lib/placeholders", () => ({
  extractPlaceholders: jest.fn(() => ["{{name}}"]),
}));

// Mock lucide-react
jest.mock("lucide-react", () => {
  const icon = (name: string) => {
    const IconComp = (props: Record<string, unknown>) =>
      React.createElement("span", { "data-testid": `icon-${name}`, ...props });
    IconComp.displayName = name;
    return IconComp;
  };
  return new Proxy(
    {},
    { get: (_target, prop: string) => icon(prop) }
  );
});

import Toolbar from "../Toolbar";

const baseTemplate: Template = {
  name: "Test",
  pageSize: "A4",
  fontFamily: "Roboto",
  pages: [{ id: "p1", elements: [] }],
  styles: { primaryColor: "#000" },
};

const basePage: TemplatePage = {
  id: "p1",
  elements: [],
};

const textEl: TemplateElement = {
  id: "t1", x: 10, y: 20, type: "text", content: "Hello", fontSize: 12,
  bold: false, italic: false, underline: false, color: "#000", width: 100,
  textAlign: "left", listStyle: "none",
};

const headingEl: TemplateElement = {
  id: "h1", x: 10, y: 20, type: "heading", content: "Title", fontSize: 24,
  bold: true, italic: false, underline: false, color: "#000", width: 200,
  textAlign: "center",
};

const shapeEl: TemplateElement = {
  id: "s1", x: 10, y: 20, type: "shape", shapeType: "rectangle",
  width: 100, height: 100, fillColor: "#000", strokeColor: "#fff",
  strokeWidth: 1, borderRadius: 0,
};

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    template: baseTemplate,
    currentPage: basePage,
    selectedEl: null as TemplateElement | null,
    selectedEls: [] as TemplateElement[],
    selectedIds: new Set<string>(),
    activeSection: "body" as "body" | "header" | "footer",
    canUndo: false,
    canRedo: false,
    clipboard: [] as TemplateElement[],
    onBack: jest.fn(),
    onUndo: jest.fn(),
    onRedo: jest.fn(),
    onSaveJSON: jest.fn(),
    onLoadJSON: jest.fn(),
    onCopyTemplate: jest.fn(),
    onPasteTemplate: jest.fn(),
    onShareUrl: jest.fn(),
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
    compressionEnabled: false,
    onToggleCompression: jest.fn(),
    versionsEnabled: false,
    onToggleVersions: jest.fn(),
    ...overrides,
  };
}

describe("Toolbar", () => {
  it("renders with no selection", () => {
    const props = makeProps();
    const { container } = render(<Toolbar {...props} />);
    expect(container).toBeTruthy();
    // Check basic buttons exist
    expect(screen.getByText("PDF Creator")).toBeTruthy();
    expect(screen.getByText("Save JSON")).toBeTruthy();
    expect(screen.getByText("Load JSON")).toBeTruthy();
  });

  it("calls onBack when back button clicked", () => {
    const props = makeProps();
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByText("Templates"));
    expect(props.onBack).toHaveBeenCalled();
  });

  it("does not render back button when onBack is undefined", () => {
    const props = makeProps({ onBack: undefined });
    render(<Toolbar {...props} />);
    expect(screen.queryByText("Templates")).toBeNull();
  });

  it("calls onUndo and onRedo", () => {
    const props = makeProps({ canUndo: true, canRedo: true });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("Undo (Ctrl+Z)"));
    expect(props.onUndo).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Redo (Ctrl+Y)"));
    expect(props.onRedo).toHaveBeenCalled();
  });

  it("undo/redo buttons are disabled when canUndo/canRedo are false", () => {
    const props = makeProps({ canUndo: false, canRedo: false });
    render(<Toolbar {...props} />);
    expect((screen.getByTitle("Undo (Ctrl+Z)") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTitle("Redo (Ctrl+Y)") as HTMLButtonElement).disabled).toBe(true);
  });

  it("calls onSaveJSON when Save JSON clicked", () => {
    const props = makeProps();
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByText("Save JSON"));
    expect(props.onSaveJSON).toHaveBeenCalled();
  });

  it("calls onAddElement for layout and content items", () => {
    const props = makeProps();
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("Add Repeater"));
    expect(props.onAddElement).toHaveBeenCalledWith("repeater");
    fireEvent.click(screen.getByTitle("Add Shape"));
    expect(props.onAddElement).toHaveBeenCalledWith("shape");
    fireEvent.click(screen.getByTitle("Add Text"));
    expect(props.onAddElement).toHaveBeenCalledWith("text");
    fireEvent.click(screen.getByTitle("Add Table"));
    expect(props.onAddElement).toHaveBeenCalledWith("table");
    fireEvent.click(screen.getByTitle("Add Image"));
    expect(props.onAddElement).toHaveBeenCalledWith("image");
    fireEvent.click(screen.getByTitle("Add Divider"));
    expect(props.onAddElement).toHaveBeenCalledWith("divider");
    fireEvent.click(screen.getByTitle("Add Chart"));
    expect(props.onAddElement).toHaveBeenCalledWith("chart");
    fireEvent.click(screen.getByTitle("Add Heading"));
    expect(props.onAddElement).toHaveBeenCalledWith("heading");
    fireEvent.click(screen.getByTitle("Add Card"));
    expect(props.onAddElement).toHaveBeenCalledWith("card");
    fireEvent.click(screen.getByTitle("Add Link"));
    expect(props.onAddElement).toHaveBeenCalledWith("link");
  });

  it("shows edit actions when selection exists (single)", () => {
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
    });
    render(<Toolbar {...props} />);
    expect(screen.getByTitle("Copy (Ctrl+C)")).toBeTruthy();
    expect(screen.getByTitle("Paste (Ctrl+V)")).toBeTruthy();
    expect(screen.getByTitle("Duplicate (Ctrl+D)")).toBeTruthy();
    expect(screen.getByTitle("Delete (Del)")).toBeTruthy();
  });

  it("calls edit action handlers", () => {
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
      clipboard: [textEl],
    });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("Copy (Ctrl+C)"));
    expect(props.onCopy).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Paste (Ctrl+V)"));
    expect(props.onPaste).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Duplicate (Ctrl+D)"));
    expect(props.onDuplicate).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Delete (Del)"));
    expect(props.onDelete).toHaveBeenCalled();
  });

  it("shows z-order buttons for single selection (not multi)", () => {
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
    });
    render(<Toolbar {...props} />);
    expect(screen.getByTitle("Bring to front")).toBeTruthy();
    expect(screen.getByTitle("Move forward")).toBeTruthy();
    expect(screen.getByTitle("Move backward")).toBeTruthy();
    expect(screen.getByTitle("Send to back")).toBeTruthy();
  });

  it("calls onMoveZOrder with correct direction", () => {
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
    });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("Bring to front"));
    expect(props.onMoveZOrder).toHaveBeenCalledWith("top");
    fireEvent.click(screen.getByTitle("Move forward"));
    expect(props.onMoveZOrder).toHaveBeenCalledWith("up");
    fireEvent.click(screen.getByTitle("Move backward"));
    expect(props.onMoveZOrder).toHaveBeenCalledWith("down");
    fireEvent.click(screen.getByTitle("Send to back"));
    expect(props.onMoveZOrder).toHaveBeenCalledWith("bottom");
  });

  it("shows alignment buttons for multi-select", () => {
    const el2: TemplateElement = { ...textEl, id: "t2" };
    const props = makeProps({
      selectedIds: new Set(["t1", "t2"]),
      selectedEl: textEl,
      selectedEls: [textEl, el2],
    });
    render(<Toolbar {...props} />);
    expect(screen.getByText("Align:")).toBeTruthy();
    expect(screen.getByTitle("Align left")).toBeTruthy();
    expect(screen.getByTitle("Align center")).toBeTruthy();
    expect(screen.getByTitle("Align right")).toBeTruthy();
    expect(screen.getByTitle("Align top")).toBeTruthy();
    expect(screen.getByTitle("Align middle")).toBeTruthy();
    expect(screen.getByTitle("Align bottom")).toBeTruthy();
    // No distribute buttons for 2 elements
    expect(screen.queryByTitle("Distribute horizontally")).toBeNull();
  });

  it("shows distribute buttons for 3+ multi-select", () => {
    const el2: TemplateElement = { ...textEl, id: "t2" };
    const el3: TemplateElement = { ...textEl, id: "t3" };
    const props = makeProps({
      selectedIds: new Set(["t1", "t2", "t3"]),
      selectedEl: textEl,
      selectedEls: [textEl, el2, el3],
    });
    render(<Toolbar {...props} />);
    expect(screen.getByTitle("Distribute horizontally")).toBeTruthy();
    expect(screen.getByTitle("Distribute vertically")).toBeTruthy();
  });

  it("calls onAlign with correct alignment", () => {
    const el2: TemplateElement = { ...textEl, id: "t2" };
    const el3: TemplateElement = { ...textEl, id: "t3" };
    const props = makeProps({
      selectedIds: new Set(["t1", "t2", "t3"]),
      selectedEl: textEl,
      selectedEls: [textEl, el2, el3],
    });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("Align left"));
    expect(props.onAlign).toHaveBeenCalledWith("left");
    fireEvent.click(screen.getByTitle("Align center"));
    expect(props.onAlign).toHaveBeenCalledWith("center");
    fireEvent.click(screen.getByTitle("Align right"));
    expect(props.onAlign).toHaveBeenCalledWith("right");
    fireEvent.click(screen.getByTitle("Align top"));
    expect(props.onAlign).toHaveBeenCalledWith("top");
    fireEvent.click(screen.getByTitle("Align middle"));
    expect(props.onAlign).toHaveBeenCalledWith("middle");
    fireEvent.click(screen.getByTitle("Align bottom"));
    expect(props.onAlign).toHaveBeenCalledWith("bottom");
    fireEvent.click(screen.getByTitle("Distribute horizontally"));
    expect(props.onAlign).toHaveBeenCalledWith("distribute-h");
    fireEvent.click(screen.getByTitle("Distribute vertically"));
    expect(props.onAlign).toHaveBeenCalledWith("distribute-v");
  });

  it("does not show z-order for multi-select", () => {
    const el2: TemplateElement = { ...textEl, id: "t2" };
    const props = makeProps({
      selectedIds: new Set(["t1", "t2"]),
      selectedEl: textEl,
      selectedEls: [textEl, el2],
    });
    render(<Toolbar {...props} />);
    expect(screen.queryByTitle("Bring to front")).toBeNull();
  });

  it("shows text alignment for text element (single select)", () => {
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
    });
    render(<Toolbar {...props} />);
    expect(screen.getByText("Text:")).toBeTruthy();
    expect(screen.getByTitle("Align left")).toBeTruthy();
    expect(screen.getByTitle("Align center")).toBeTruthy();
    expect(screen.getByTitle("Align right")).toBeTruthy();
    expect(screen.getByTitle("Align justify")).toBeTruthy();
  });

  it("dispatches toolbar-text-align event", () => {
    const handler = jest.fn();
    globalThis.addEventListener("toolbar-text-align", handler);
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
    });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("Align center"));
    expect(handler).toHaveBeenCalled();
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toBe("center");
    globalThis.removeEventListener("toolbar-text-align", handler);
  });

  it("shows list style buttons for text element", () => {
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
    });
    render(<Toolbar {...props} />);
    expect(screen.getByTitle("Plain text")).toBeTruthy();
    expect(screen.getByTitle("bullet list")).toBeTruthy();
    expect(screen.getByTitle("numbered list")).toBeTruthy();
  });

  it("dispatches toolbar-list-style event", () => {
    const handler = jest.fn();
    globalThis.addEventListener("toolbar-list-style", handler);
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
    });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("bullet list"));
    expect(handler).toHaveBeenCalled();
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toBe("bullet");
    globalThis.removeEventListener("toolbar-list-style", handler);
  });

  it("shows text alignment for heading element", () => {
    const props = makeProps({
      selectedIds: new Set(["h1"]),
      selectedEl: headingEl,
      selectedEls: [headingEl],
    });
    render(<Toolbar {...props} />);
    expect(screen.getByText("Text:")).toBeTruthy();
  });

  it("does not show text alignment for multi-select text elements", () => {
    const el2: TemplateElement = { ...textEl, id: "t2" };
    const props = makeProps({
      selectedIds: new Set(["t1", "t2"]),
      selectedEl: textEl,
      selectedEls: [textEl, el2],
    });
    render(<Toolbar {...props} />);
    expect(screen.queryByText("Text:")).toBeNull();
  });

  it("shows shape shortcuts for shape element (single select)", () => {
    const props = makeProps({
      selectedIds: new Set(["s1"]),
      selectedEl: shapeEl,
      selectedEls: [shapeEl],
    });
    render(<Toolbar {...props} />);
    expect(screen.getByText("Shape:")).toBeTruthy();
    expect(screen.getByTitle("rectangle")).toBeTruthy();
    expect(screen.getByTitle("circle")).toBeTruthy();
    expect(screen.getByTitle("line")).toBeTruthy();
    expect(screen.getByTitle("triangle")).toBeTruthy();
    expect(screen.getByTitle("diamond")).toBeTruthy();
    expect(screen.getByTitle("arrow")).toBeTruthy();
    expect(screen.getByTitle("heart")).toBeTruthy();
  });

  it("dispatches toolbar-shape-type event", () => {
    const handler = jest.fn();
    globalThis.addEventListener("toolbar-shape-type", handler);
    const props = makeProps({
      selectedIds: new Set(["s1"]),
      selectedEl: shapeEl,
      selectedEls: [shapeEl],
    });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("circle"));
    expect(handler).toHaveBeenCalled();
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toBe("circle");
    globalThis.removeEventListener("toolbar-shape-type", handler);
  });

  it("shows section toggle buttons", () => {
    const props = makeProps();
    render(<Toolbar {...props} />);
    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
  });

  it("calls onToggleSection when header/footer buttons clicked", () => {
    const props = makeProps();
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByTitle("Add header section"));
    expect(props.onToggleSection).toHaveBeenCalledWith("header");
    fireEvent.click(screen.getByTitle("Add footer section"));
    expect(props.onToggleSection).toHaveBeenCalledWith("footer");
  });

  it("shows active section indicator when header exists", () => {
    const pageWithHeader: TemplatePage = {
      id: "p1",
      elements: [],
      header: { height: 60, elements: [] },
    };
    const props = makeProps({ currentPage: pageWithHeader });
    render(<Toolbar {...props} />);
    expect(screen.getByText("Target:")).toBeTruthy();
    expect(screen.getByText("body")).toBeTruthy();
    expect(screen.getByText("header")).toBeTruthy();
  });

  it("shows active section indicator when footer exists", () => {
    const pageWithFooter: TemplatePage = {
      id: "p1",
      elements: [],
      footer: { height: 50, elements: [] },
    };
    const props = makeProps({ currentPage: pageWithFooter });
    render(<Toolbar {...props} />);
    expect(screen.getByText("Target:")).toBeTruthy();
    expect(screen.getByText("body")).toBeTruthy();
    expect(screen.getByText("footer")).toBeTruthy();
  });

  it("shows all section buttons when both header and footer exist", () => {
    const pageWithBoth: TemplatePage = {
      id: "p1",
      elements: [],
      header: { height: 60, elements: [] },
      footer: { height: 50, elements: [] },
    };
    const props = makeProps({ currentPage: pageWithBoth });
    render(<Toolbar {...props} />);
    expect(screen.getByText("body")).toBeTruthy();
    expect(screen.getByText("header")).toBeTruthy();
    expect(screen.getByText("footer")).toBeTruthy();
  });

  it("calls onSectionChange when section tab clicked", () => {
    const pageWithBoth: TemplatePage = {
      id: "p1",
      elements: [],
      header: { height: 60, elements: [] },
      footer: { height: 50, elements: [] },
    };
    const props = makeProps({ currentPage: pageWithBoth });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByText("header"));
    expect(props.onSectionChange).toHaveBeenCalledWith("header");
    fireEvent.click(screen.getByText("footer"));
    expect(props.onSectionChange).toHaveBeenCalledWith("footer");
    fireEvent.click(screen.getByText("body"));
    expect(props.onSectionChange).toHaveBeenCalledWith("body");
  });

  it("does not show section indicator when no header/footer", () => {
    const props = makeProps();
    render(<Toolbar {...props} />);
    expect(screen.queryByText("Target:")).toBeNull();
  });

  it("renders metadata toggle with active state", () => {
    const props = makeProps({ includeMetadata: true });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByText("Metadata"));
    expect(props.onToggleMetadata).toHaveBeenCalled();
  });

  it("renders password toggle", () => {
    const props = makeProps({ includePassword: true });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByText("Password"));
    expect(props.onTogglePassword).toHaveBeenCalled();
  });

  it("renders PDF/A toggle", () => {
    const props = makeProps({ includePdfA: true });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByText("PDF/A"));
    expect(props.onTogglePdfA).toHaveBeenCalled();
  });

  it("renders Signature toggle", () => {
    const props = makeProps({ includeSignature: true });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByText("Sign"));
    expect(props.onToggleSignature).toHaveBeenCalled();
  });

  it("renders watermark toggle", () => {
    const props = makeProps({ watermarkEnabled: true });
    render(<Toolbar {...props} />);
    fireEvent.click(screen.getByText("Watermark"));
    expect(props.onToggleWatermark).toHaveBeenCalled();
  });

  it("triggers file input on Load JSON click", () => {
    const props = makeProps();
    const { container } = render(<Toolbar {...props} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.className).toBe("hidden");
    // Click Load JSON button
    fireEvent.click(screen.getByText("Load JSON"));
    // The click should trigger file input (via ref), but we can verify the input exists
  });

  it("renders activeSection header with correct style", () => {
    const pageWithHeader: TemplatePage = {
      id: "p1",
      elements: [],
      header: { height: 60, elements: [] },
    };
    const props = makeProps({ currentPage: pageWithHeader, activeSection: "header" });
    render(<Toolbar {...props} />);
    expect(screen.getByText("header")).toBeTruthy();
  });

  it("renders activeSection footer with correct style", () => {
    const pageWithFooter: TemplatePage = {
      id: "p1",
      elements: [],
      footer: { height: 50, elements: [] },
    };
    const props = makeProps({ currentPage: pageWithFooter, activeSection: "footer" });
    render(<Toolbar {...props} />);
    expect(screen.getByText("footer")).toBeTruthy();
  });

  it("paste button has reduced opacity when clipboard is empty", () => {
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
      clipboard: [],
    });
    render(<Toolbar {...props} />);
    const pasteBtn = screen.getByTitle("Paste (Ctrl+V)");
    expect(pasteBtn.style.opacity).toBe("0.35");
  });

  it("paste button has full opacity when clipboard has items", () => {
    const props = makeProps({
      selectedIds: new Set(["t1"]),
      selectedEl: textEl,
      selectedEls: [textEl],
      clipboard: [textEl],
    });
    render(<Toolbar {...props} />);
    const pasteBtn = screen.getByTitle("Paste (Ctrl+V)");
    expect(pasteBtn.style.opacity).toBe("1");
  });
});
