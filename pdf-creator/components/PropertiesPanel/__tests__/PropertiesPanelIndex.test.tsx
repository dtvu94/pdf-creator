/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock lucide-react
jest.mock("lucide-react", () => ({
  ArrowUpToLine: (props: Record<string, unknown>) => <span {...props}>ArrowUpToLine</span>,
  ArrowDownToLine: (props: Record<string, unknown>) => <span {...props}>ArrowDownToLine</span>,
  MoveUp: (props: Record<string, unknown>) => <span {...props}>MoveUp</span>,
  MoveDown: (props: Record<string, unknown>) => <span {...props}>MoveDown</span>,
}));

// Mock child components
jest.mock("../ImageSection", () => {
  return function MockImageSection(props: { set: (k: string, v: unknown) => void }) {
    return (
      <div data-testid="ImageSection">
        <button onClick={() => props.set("label", "test-img")}>SetImageLabel</button>
      </div>
    );
  };
});

jest.mock("../TableSection", () => {
  return function MockTableSection() {
    return <div data-testid="TableSection" />;
  };
});

jest.mock("../ChartSection", () => {
  return function MockChartSection() {
    return <div data-testid="ChartSection" />;
  };
});

import PropertiesPanel from "../index";

describe("PropertiesPanel – comprehensive", () => {
  const baseProps = {
    pageIdx: 0,
    allElements: [] as never[],
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    onMoveZOrder: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  // ── Null element ──────────────────────────────────────────────────────────
  it("renders empty state when el is null", () => {
    render(<PropertiesPanel {...baseProps} el={null} />);
    expect(screen.getByText("Select an element to edit its properties")).toBeTruthy();
  });

  // ── Text element - full interaction coverage ─────────────────────────────
  describe("text element", () => {
    const textEl = {
      id: "t1", x: 10, y: 20, type: "text" as const, content: "Hello",
      fontSize: 12, bold: false, italic: false, underline: false,
      color: "#000", width: 100, textAlign: "left" as const, lineHeight: 1.5,
    };

    it("renders content textarea and fires onUpdate on change", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      const textarea = screen.getByDisplayValue("Hello");
      fireEvent.change(textarea, { target: { value: "Updated" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "content", "Updated");
    });

    it("fires text alignment update when clicking center button", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      fireEvent.click(screen.getByText("center"));
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "textAlign", "center");
    });

    it("fires text alignment update when clicking right button", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      fireEvent.click(screen.getByText("right"));
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "textAlign", "right");
    });

    it("fires text alignment update when clicking justify button", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      fireEvent.click(screen.getByText("justify"));
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "textAlign", "justify");
    });

    it("fires bold toggle", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]); // bold
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "bold", true);
    });

    it("fires italic toggle", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // italic
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "italic", true);
    });

    it("fires underline toggle", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[2]); // underline
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "underline", true);
    });

    it("fires list style change to bullet", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      fireEvent.click(screen.getByText("bullet"));
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "listStyle", "bullet");
    });

    it("fires list style change to numbered", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      fireEvent.click(screen.getByText("numbered"));
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "listStyle", "numbered");
    });

    it("fires opacity change", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      const sliders = screen.getAllByRole("slider");
      const opacitySlider = sliders.find((s) => s.getAttribute("max") === "1")!;
      fireEvent.change(opacitySlider, { target: { value: "0.5" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "opacity", 0.5);
    });
  });

  // ── Heading element ──────────────────────────────────────────────────────
  it("renders heading with typography section", () => {
    const el = {
      id: "h1", x: 10, y: 20, type: "heading" as const, content: "Title",
      fontSize: 24, bold: true, italic: false, underline: false,
      color: "#000", width: 100,
    };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("heading")).toBeTruthy();
    expect(screen.getByText("Typography")).toBeTruthy();
  });

  // ── Link element ─────────────────────────────────────────────────────────
  describe("link element", () => {
    const linkEl = {
      id: "l1", x: 10, y: 20, type: "link" as const, content: "Click",
      href: "https://example.com", fontSize: 12, color: "#2563EB", width: 200,
    };

    it("renders link fields", () => {
      render(<PropertiesPanel {...baseProps} el={linkEl} allElements={[linkEl]} />);
      expect(screen.getByText("Display Text")).toBeTruthy();
      expect(screen.getByText("URL / Email")).toBeTruthy();
    });

    it("fires onUpdate for content change", () => {
      render(<PropertiesPanel {...baseProps} el={linkEl} allElements={[linkEl]} />);
      const input = screen.getByDisplayValue("Click");
      fireEvent.change(input, { target: { value: "Visit" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "l1", "content", "Visit");
    });

    it("fires onUpdate for href change", () => {
      render(<PropertiesPanel {...baseProps} el={linkEl} allElements={[linkEl]} />);
      const input = screen.getByDisplayValue("https://example.com");
      fireEvent.change(input, { target: { value: "https://other.com" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "l1", "href", "https://other.com");
    });
  });

  // ── Divider element ──────────────────────────────────────────────────────
  it("renders divider section with color and thickness", () => {
    const el = { id: "d1", x: 10, y: 20, type: "divider" as const, color: "#CBD5E1", width: 515, thickness: 1 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("Divider")).toBeTruthy();
    expect(screen.getByText("Thickness (pt)")).toBeTruthy();
  });

  // ── Card element ─────────────────────────────────────────────────────────
  describe("card element", () => {
    const cardEl = {
      id: "c1", x: 10, y: 20, type: "card" as const, title: "Test", value: "42",
      unit: "C", subtitle: "Normal", accentColor: "#3B82F6", bgColor: "#FFF",
      borderColor: "#DBEAFE", width: 250, height: 105,
    };

    it("renders card fields", () => {
      render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      expect(screen.getByText("Card")).toBeTruthy();
      expect(screen.getByText("Title")).toBeTruthy();
      expect(screen.getByText("Value")).toBeTruthy();
      expect(screen.getByText("Unit")).toBeTruthy();
      expect(screen.getByText("Subtitle")).toBeTruthy();
      expect(screen.getByText("Accent Color")).toBeTruthy();
      expect(screen.getByText("Background")).toBeTruthy();
      expect(screen.getByText("Border Color")).toBeTruthy();
    });

    it("fires onUpdate for title change", () => {
      render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      fireEvent.change(screen.getByDisplayValue("Test"), { target: { value: "New Title" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "title", "New Title");
    });

    it("fires onUpdate for value change", () => {
      render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      fireEvent.change(screen.getByDisplayValue("42"), { target: { value: "99" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "value", "99");
    });

    it("fires onUpdate for unit change", () => {
      render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      fireEvent.change(screen.getByDisplayValue("C"), { target: { value: "F" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "unit", "F");
    });

    it("fires onUpdate for subtitle change", () => {
      render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      fireEvent.change(screen.getByDisplayValue("Normal"), { target: { value: "Warning" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "subtitle", "Warning");
    });
  });

  // ── Shape element ────────────────────────────────────────────────────────
  describe("shape element", () => {
    const shapeEl = {
      id: "s1", x: 10, y: 20, type: "shape" as const, shapeType: "rectangle" as const,
      width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6",
      strokeWidth: 2, borderRadius: 8,
    };

    it("renders shape type buttons and fires onUpdate", () => {
      render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      fireEvent.click(screen.getByText("circle"));
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "s1", "shapeType", "circle");
    });

    it("displays shape type in header", () => {
      render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      expect(screen.getAllByText(/rectangle/).length).toBeGreaterThan(0);
    });

    it("renders border radius for rectangle", () => {
      render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      expect(screen.getByText("Border Radius")).toBeTruthy();
    });

    it("hides border radius for circle", () => {
      const circleEl = { ...shapeEl, shapeType: "circle" as const };
      render(<PropertiesPanel {...baseProps} el={circleEl} allElements={[circleEl]} />);
      expect(screen.queryByText("Border Radius")).toBeNull();
    });

    it("renders all shape type buttons", () => {
      render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      for (const t of ["rectangle", "circle", "line", "triangle", "diamond", "arrow", "heart"]) {
        expect(screen.getByText(t)).toBeTruthy();
      }
    });
  });

  // ── Repeater element ─────────────────────────────────────────────────────
  describe("repeater element", () => {
    const repeaterEl = {
      id: "r1", x: 10, y: 20, type: "repeater" as const, label: "Group",
      dataKey: "sensor_group", width: 515, cardWidth: 515, cardHeight: 360,
      itemsPerRow: 1, gap: 12, cardElements: [],
    };

    it("renders repeater settings", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      expect(screen.getByText("Repeater Settings")).toBeTruthy();
      expect(screen.getByText("Label")).toBeTruthy();
      expect(screen.getByText("Data Key")).toBeTruthy();
      expect(screen.getByText("Card Width")).toBeTruthy();
      expect(screen.getByText("Card Height")).toBeTruthy();
      expect(screen.getByText("Items / Row")).toBeTruthy();
      expect(screen.getByText("Gap (pt)")).toBeTruthy();
    });

    it("fires onUpdate for label change", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      fireEvent.change(screen.getByDisplayValue("Group"), { target: { value: "New Label" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "r1", "label", "New Label");
    });

    it("fires onUpdate for dataKey change", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      fireEvent.change(screen.getByDisplayValue("sensor_group"), { target: { value: "new_key" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "r1", "dataKey", "new_key");
    });

    it("shows empty card elements message", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      expect(screen.getByText(/No card elements yet/)).toBeTruthy();
    });

    it("adds card element via select dropdown", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      const select = screen.getByDisplayValue("+ Add\u2026");
      fireEvent.change(select, { target: { value: "text" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        expect.arrayContaining([expect.objectContaining({ type: "text" })])
      );
    });

    it("adds heading card element", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      const select = screen.getByDisplayValue("+ Add\u2026");
      fireEvent.change(select, { target: { value: "heading" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        expect.arrayContaining([expect.objectContaining({ type: "heading" })])
      );
    });

    it("adds chart card element", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      const select = screen.getByDisplayValue("+ Add\u2026");
      fireEvent.change(select, { target: { value: "chart" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        expect.arrayContaining([expect.objectContaining({ type: "chart" })])
      );
    });

    it("adds divider card element", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      const select = screen.getByDisplayValue("+ Add\u2026");
      fireEvent.change(select, { target: { value: "divider" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        expect.arrayContaining([expect.objectContaining({ type: "divider" })])
      );
    });

    it("adds card card element", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      const select = screen.getByDisplayValue("+ Add\u2026");
      fireEvent.change(select, { target: { value: "card" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        expect.arrayContaining([expect.objectContaining({ type: "card" })])
      );
    });

    it("adds table card element", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      const select = screen.getByDisplayValue("+ Add\u2026");
      fireEvent.change(select, { target: { value: "table" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        expect.arrayContaining([expect.objectContaining({ type: "table" })])
      );
    });

    it("adds image card element", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      const select = screen.getByDisplayValue("+ Add\u2026");
      fireEvent.change(select, { target: { value: "image" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        expect.arrayContaining([expect.objectContaining({ type: "image" })])
      );
    });

    it("does nothing when selecting empty value from add dropdown", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      const select = screen.getByDisplayValue("+ Add\u2026");
      fireEvent.change(select, { target: { value: "" } });
      expect(baseProps.onUpdate).not.toHaveBeenCalled();
    });

    it("renders card element controls: move up/down and remove", () => {
      const cardEl1 = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "A", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const cardEl2 = { id: "ce2", x: 10, y: 30, type: "text" as const, content: "B", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const el = { ...repeaterEl, cardElements: [cardEl1, cardEl2] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);

      // Move down button on first element
      const moveDownBtns = screen.getAllByTitle("Move down");
      fireEvent.click(moveDownBtns[0]);
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        expect.any(Array)
      );
    });

    it("fires remove card element", () => {
      const cardEl1 = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "A", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const el = { ...repeaterEl, cardElements: [cardEl1] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.click(screen.getByTitle("Remove"));
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "r1", "cardElements", []);
    });

    it("renders chart card element fields", () => {
      const chartCard = { id: "cc1", x: 10, y: 10, type: "chart" as const, width: 200, height: 120, option: {}, seriesDataField: "data" };
      const el = { ...repeaterEl, cardElements: [chartCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      expect(screen.getByText("Series Data Field")).toBeTruthy();
      expect(screen.getByDisplayValue("data")).toBeTruthy();
    });

    it("renders divider card element fields", () => {
      const divCard = { id: "dc1", x: 10, y: 10, type: "divider" as const, color: "#E2E8F0", width: 200, thickness: 1 };
      const el = { ...repeaterEl, cardElements: [divCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      expect(screen.getByText("divider #1")).toBeTruthy();
    });

    it("renders card card element fields with title and value", () => {
      const cardCard = { id: "cc1", x: 10, y: 10, type: "card" as const, title: "T", value: "V", unit: "U", subtitle: "S", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 200, height: 90 };
      const el = { ...repeaterEl, cardElements: [cardCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      expect(screen.getByText("card #1")).toBeTruthy();
    });

    it("renders table card element fields with headers and rows data field", () => {
      const tableCard = { id: "tc1", x: 10, y: 10, type: "table" as const, headers: ["A", "B"], rows: [] as string[][], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200 };
      const el = { ...repeaterEl, cardElements: [tableCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      expect(screen.getByText("table #1")).toBeTruthy();
      expect(screen.getByText("Headers (comma-separated)")).toBeTruthy();
      expect(screen.getByText("Rows Data Field")).toBeTruthy();
    });

    it("renders image card element fields", () => {
      const imageCard = { id: "ic1", x: 10, y: 10, type: "image" as const, label: "Img", width: 200, height: 80, bgColor: "#E2E8F0", srcField: "imageUrl" };
      const el = { ...repeaterEl, cardElements: [imageCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      expect(screen.getByText("image #1")).toBeTruthy();
      expect(screen.getByText("Image Source Field")).toBeTruthy();
      expect(screen.getByDisplayValue("imageUrl")).toBeTruthy();
    });

    it("updates card element content via textarea", () => {
      const cardEl1 = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "Hello", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const el = { ...repeaterEl, cardElements: [cardEl1] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("Hello"), { target: { value: "Updated" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ content: "Updated" })]
      );
    });
  });

  // ── Z-order buttons ──────────────────────────────────────────────────────
  describe("z-order buttons", () => {
    const el1 = { id: "e1", x: 10, y: 20, type: "text" as const, content: "A", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    const el2 = { id: "e2", x: 10, y: 40, type: "text" as const, content: "B", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };

    it("disables send-to-back and move-backward for first element", () => {
      render(<PropertiesPanel {...baseProps} el={el1} allElements={[el1, el2]} />);
      expect(screen.getByTitle("Send to back").closest("button")?.disabled).toBe(true);
      expect(screen.getByTitle("Move backward").closest("button")?.disabled).toBe(true);
    });

    it("disables bring-to-front and move-forward for last element", () => {
      render(<PropertiesPanel {...baseProps} el={el2} allElements={[el1, el2]} />);
      expect(screen.getByTitle("Bring to front").closest("button")?.disabled).toBe(true);
      expect(screen.getByTitle("Move forward").closest("button")?.disabled).toBe(true);
    });

    it("all z-order buttons enabled for middle element", () => {
      const el3 = { id: "e3", x: 10, y: 60, type: "text" as const, content: "C", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
      render(<PropertiesPanel {...baseProps} el={el2} allElements={[el1, el2, el3]} />);
      expect(screen.getByTitle("Send to back").closest("button")?.disabled).toBe(false);
      expect(screen.getByTitle("Move backward").closest("button")?.disabled).toBe(false);
      expect(screen.getByTitle("Bring to front").closest("button")?.disabled).toBe(false);
      expect(screen.getByTitle("Move forward").closest("button")?.disabled).toBe(false);
    });

    it("fires all z-order directions", () => {
      const el3 = { id: "e3", x: 10, y: 60, type: "text" as const, content: "C", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
      render(<PropertiesPanel {...baseProps} el={el2} allElements={[el1, el2, el3]} />);
      fireEvent.click(screen.getByTitle("Send to back"));
      expect(baseProps.onMoveZOrder).toHaveBeenCalledWith("bottom");
      fireEvent.click(screen.getByTitle("Move backward"));
      expect(baseProps.onMoveZOrder).toHaveBeenCalledWith("down");
      fireEvent.click(screen.getByTitle("Move forward"));
      expect(baseProps.onMoveZOrder).toHaveBeenCalledWith("up");
      fireEvent.click(screen.getByTitle("Bring to front"));
      expect(baseProps.onMoveZOrder).toHaveBeenCalledWith("top");
    });

    it("displays correct position indicator", () => {
      render(<PropertiesPanel {...baseProps} el={el2} allElements={[el1, el2]} />);
      expect(screen.getByText("2 / 2")).toBeTruthy();
    });
  });

  // ── Delete button ────────────────────────────────────────────────────────
  it("fires onDelete when Delete button clicked", () => {
    const el = { id: "del1", x: 10, y: 20, type: "text" as const, content: "X", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(baseProps.onDelete).toHaveBeenCalledWith(0, "del1");
  });

  // ── Custom events from toolbar ────────────────────────────────────────────
  it("handles toolbar-text-align custom event", () => {
    const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    globalThis.dispatchEvent(new CustomEvent("toolbar-text-align", { detail: "center" }));
    expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "textAlign", "center");
  });

  it("handles toolbar-shape-type custom event", () => {
    const el = { id: "s1", x: 10, y: 20, type: "shape" as const, shapeType: "rectangle" as const, width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 8 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    globalThis.dispatchEvent(new CustomEvent("toolbar-shape-type", { detail: "circle" }));
    expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "s1", "shapeType", "circle");
  });

  it("handles toolbar-list-style custom event", () => {
    const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    globalThis.dispatchEvent(new CustomEvent("toolbar-list-style", { detail: "bullet" }));
    expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "listStyle", "bullet");
  });

  // ── Position & size fields rendering ──────────────────────────────────────
  it("renders height field for image elements", () => {
    const el = { id: "i1", x: 10, y: 20, type: "image" as const, label: "Img", width: 200, height: 120, bgColor: "#E2E8F0" };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("HEIGHT")).toBeTruthy();
  });

  it("renders height field for chart elements", () => {
    const el = { id: "ch1", x: 10, y: 20, type: "chart" as const, width: 400, height: 250, option: {} };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("HEIGHT")).toBeTruthy();
  });

  it("renders height field for shape elements", () => {
    const el = { id: "s1", x: 10, y: 20, type: "shape" as const, shapeType: "rectangle" as const, width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 8 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("HEIGHT")).toBeTruthy();
  });

  it("does not render height field for text elements", () => {
    const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.queryByText("HEIGHT")).toBeNull();
  });

  // ── Opacity with undefined opacity (default 100%) ────────────────────────
  it("displays default 100% when element has no opacity property", () => {
    const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("displays correct opacity percentage when opacity is set", () => {
    const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100, opacity: 0.5 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("50%")).toBeTruthy();
  });

  // ── Link element full interactions ────────────────────────────────────────
  describe("link element interactions", () => {
    const linkEl = {
      id: "l1", x: 10, y: 20, type: "link" as const, content: "Click me",
      href: "https://example.com", fontSize: 14, color: "#2563EB", width: 200,
    };

    it("fires onUpdate for fontSize change via NumInput", () => {
      render(<PropertiesPanel {...baseProps} el={linkEl} allElements={[linkEl]} />);
      // NumInput renders a number input; find by display value
      const fontSizeInput = screen.getByDisplayValue("14");
      fireEvent.change(fontSizeInput, { target: { value: "18" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "l1", "fontSize", 18);
    });
  });

  // ── Shape element full interactions ───────────────────────────────────────
  describe("shape element interactions", () => {
    const shapeEl = {
      id: "s1", x: 10, y: 20, type: "shape" as const, shapeType: "rectangle" as const,
      width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6",
      strokeWidth: 2, borderRadius: 8,
    };

    it("fires onUpdate for all shape types", () => {
      render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      for (const t of ["line", "triangle", "diamond", "arrow", "heart"]) {
        fireEvent.click(screen.getByText(t));
        expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "s1", "shapeType", t);
      }
    });

    it("fires onUpdate for strokeWidth change", () => {
      render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      const strokeInput = screen.getByDisplayValue("2");
      fireEvent.change(strokeInput, { target: { value: "5" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "s1", "strokeWidth", 5);
    });

    it("fires onUpdate for borderRadius change", () => {
      render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      const brInput = screen.getByDisplayValue("8");
      fireEvent.change(brInput, { target: { value: "12" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "s1", "borderRadius", 12);
    });
  });

  // ── Card element full interactions ────────────────────────────────────────
  describe("card element interactions", () => {
    const cardEl = {
      id: "c1", x: 10, y: 20, type: "card" as const, title: "Temp", value: "42",
      unit: "C", subtitle: "Normal", accentColor: "#3B82F6", bgColor: "#FFFFFF",
      borderColor: "#DBEAFE", width: 250, height: 105,
    };

    it("fires onUpdate for title, value, unit, subtitle changes", () => {
      render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      fireEvent.change(screen.getByDisplayValue("Temp"), { target: { value: "Humidity" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "title", "Humidity");
      fireEvent.change(screen.getByDisplayValue("42"), { target: { value: "85" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "value", "85");
      fireEvent.change(screen.getByDisplayValue("C"), { target: { value: "%" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "unit", "%");
      fireEvent.change(screen.getByDisplayValue("Normal"), { target: { value: "High" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "subtitle", "High");
    });
  });

  // ── Repeater card element editing ─────────────────────────────────────────
  describe("repeater card element editing", () => {
    const baseRepeaterEl = {
      id: "r1", x: 10, y: 20, type: "repeater" as const, label: "Group",
      dataKey: "sensor_group", width: 515, cardWidth: 515, cardHeight: 360,
      itemsPerRow: 1, gap: 12,
    };

    it("edits text card element content", () => {
      const textCard = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "{{field}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 495 };
      const el = { ...baseRepeaterEl, cardElements: [textCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("{{field}}"), { target: { value: "{{newField}}" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ content: "{{newField}}" })]
      );
    });

    it("edits heading card element content", () => {
      const headingCard = { id: "ce2", x: 10, y: 10, type: "heading" as const, content: "{{title}}", fontSize: 13, bold: true, italic: false, underline: false, color: "#1E40AF", width: 495 };
      const el = { ...baseRepeaterEl, cardElements: [headingCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("{{title}}"), { target: { value: "{{name}}" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ content: "{{name}}" })]
      );
    });

    it("edits chart card element seriesDataField", () => {
      const chartCard = { id: "cc1", x: 10, y: 10, type: "chart" as const, width: 200, height: 120, option: {}, seriesDataField: "chartData" };
      const el = { ...baseRepeaterEl, cardElements: [chartCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("chartData"), { target: { value: "newData" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ seriesDataField: "newData" })]
      );
    });

    it("edits divider card element thickness", () => {
      const divCard = { id: "dc1", x: 10, y: 10, type: "divider" as const, color: "#E2E8F0", width: 200, thickness: 3 };
      const el = { ...baseRepeaterEl, cardElements: [divCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      // thickness=3 is unique
      fireEvent.change(screen.getByDisplayValue("3"), { target: { value: "5" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ thickness: 5 })]
      );
    });

    it("edits card card element title and value", () => {
      const cardCard = { id: "cc1", x: 10, y: 10, type: "card" as const, title: "Temp", value: "42", unit: "C", subtitle: "OK", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 200, height: 90 };
      const el = { ...baseRepeaterEl, cardElements: [cardCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("Temp"), { target: { value: "Humidity" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ title: "Humidity" })]
      );
      baseProps.onUpdate.mockClear();
      fireEvent.change(screen.getByDisplayValue("42"), { target: { value: "85" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ value: "85" })]
      );
    });

    it("edits card card element unit and subtitle", () => {
      const cardCard = { id: "cc1", x: 10, y: 10, type: "card" as const, title: "T", value: "V", unit: "U", subtitle: "S", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 200, height: 90 };
      const el = { ...baseRepeaterEl, cardElements: [cardCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("U"), { target: { value: "%" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ unit: "%" })]
      );
      baseProps.onUpdate.mockClear();
      fireEvent.change(screen.getByDisplayValue("S"), { target: { value: "Sub" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ subtitle: "Sub" })]
      );
    });

    it("edits table card element headers and rowsDataField", () => {
      const tableCard = { id: "tc1", x: 10, y: 10, type: "table" as const, headers: ["A", "B"], rows: [] as string[][], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200, rowsDataField: "tableData" };
      const el = { ...baseRepeaterEl, cardElements: [tableCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("A, B"), { target: { value: "X, Y, Z" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ headers: ["X", "Y", "Z"] })]
      );
      baseProps.onUpdate.mockClear();
      fireEvent.change(screen.getByDisplayValue("tableData"), { target: { value: "newRows" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ rowsDataField: "newRows" })]
      );
    });

    it("edits table card element fontSize", () => {
      const tableCard = { id: "tc1", x: 10, y: 10, type: "table" as const, headers: ["A"], rows: [] as string[][], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200 };
      const el = { ...baseRepeaterEl, cardElements: [tableCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      const fontInput = screen.getByDisplayValue("9");
      fireEvent.change(fontInput, { target: { value: "11" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ fontSize: 11 })]
      );
    });

    it("edits image card element label and srcField", () => {
      const imageCard = { id: "ic1", x: 10, y: 10, type: "image" as const, label: "Img", width: 200, height: 80, bgColor: "#E2E8F0", srcField: "imageUrl" };
      const el = { ...baseRepeaterEl, cardElements: [imageCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("Img"), { target: { value: "Photo" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ label: "Photo" })]
      );
      baseProps.onUpdate.mockClear();
      fireEvent.change(screen.getByDisplayValue("imageUrl"), { target: { value: "photoSrc" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ srcField: "photoSrc" })]
      );
    });

    it("moves card element up", () => {
      const cardEl1 = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "A", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const cardEl2 = { id: "ce2", x: 10, y: 30, type: "text" as const, content: "B", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const el = { ...baseRepeaterEl, cardElements: [cardEl1, cardEl2] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      const moveUpBtns = screen.getAllByTitle("Move up");
      // Click move up on the second element (first has disabled move up)
      fireEvent.click(moveUpBtns[1]);
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ id: "ce2" }), expect.objectContaining({ id: "ce1" })]
      );
    });

    it("does not move first element up (boundary check)", () => {
      const cardEl1 = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "A", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const cardEl2 = { id: "ce2", x: 10, y: 30, type: "text" as const, content: "B", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const el = { ...baseRepeaterEl, cardElements: [cardEl1, cardEl2] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      const moveUpBtns = screen.getAllByTitle("Move up");
      // First element's move up is disabled
      fireEvent.click(moveUpBtns[0]);
      expect(baseProps.onUpdate).not.toHaveBeenCalled();
    });

    it("does not move last element down (boundary check)", () => {
      const cardEl1 = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "A", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const cardEl2 = { id: "ce2", x: 10, y: 30, type: "text" as const, content: "B", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const el = { ...baseRepeaterEl, cardElements: [cardEl1, cardEl2] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      const moveDownBtns = screen.getAllByTitle("Move down");
      // Last element's move down is disabled
      fireEvent.click(moveDownBtns[1]);
      expect(baseProps.onUpdate).not.toHaveBeenCalled();
    });

    it("edits card element X and Y positions", () => {
      const textCard = { id: "ce1", x: 55, y: 65, type: "text" as const, content: "A", fontSize: 14, bold: false, italic: false, underline: false, color: "#000", width: 200 };
      const el = { ...baseRepeaterEl, cardElements: [textCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      // Card element X=55 is unique
      fireEvent.change(screen.getByDisplayValue("55"), { target: { value: "50" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ x: 50 })]
      );
      baseProps.onUpdate.mockClear();
      fireEvent.change(screen.getByDisplayValue("65"), { target: { value: "70" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ y: 70 })]
      );
    });

    it("edits image card element width and height", () => {
      const imageCard = { id: "ic1", x: 10, y: 10, type: "image" as const, label: "Img", width: 200, height: 80, bgColor: "#E2E8F0", srcField: "imageUrl" };
      const el = { ...baseRepeaterEl, cardElements: [imageCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("200"), { target: { value: "300" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ width: 300 })]
      );
      baseProps.onUpdate.mockClear();
      fireEvent.change(screen.getByDisplayValue("80"), { target: { value: "100" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ height: 100 })]
      );
    });

    it("edits chart card element width and height", () => {
      const chartCard = { id: "cc1", x: 10, y: 10, type: "chart" as const, width: 200, height: 120, option: {}, seriesDataField: "chartData" };
      const el = { ...baseRepeaterEl, cardElements: [chartCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("200"), { target: { value: "400" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ width: 400 })]
      );
      baseProps.onUpdate.mockClear();
      fireEvent.change(screen.getByDisplayValue("120"), { target: { value: "200" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ height: 200 })]
      );
    });

    it("edits divider card element width and color", () => {
      const divCard = { id: "dc1", x: 10, y: 10, type: "divider" as const, color: "#E2E8F0", width: 200, thickness: 1 };
      const el = { ...baseRepeaterEl, cardElements: [divCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("200"), { target: { value: "300" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ width: 300 })]
      );
    });

    it("edits table card element width", () => {
      const tableCard = { id: "tc1", x: 10, y: 10, type: "table" as const, headers: ["A"], rows: [] as string[][], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200 };
      const el = { ...baseRepeaterEl, cardElements: [tableCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("200"), { target: { value: "350" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ width: 350 })]
      );
    });

    it("edits card card element width and height", () => {
      const cardCard = { id: "cc1", x: 10, y: 10, type: "card" as const, title: "T", value: "V", unit: "U", subtitle: "S", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 200, height: 90 };
      const el = { ...baseRepeaterEl, cardElements: [cardCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("200"), { target: { value: "250" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ width: 250 })]
      );
      baseProps.onUpdate.mockClear();
      fireEvent.change(screen.getByDisplayValue("90"), { target: { value: "110" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ height: 110 })]
      );
    });

    it("edits text card element fontSize", () => {
      const textCard = { id: "ce1", x: 5, y: 7, type: "text" as const, content: "test", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 495 };
      const el = { ...baseRepeaterEl, cardElements: [textCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      // fontSize=11 is unique
      fireEvent.change(screen.getByDisplayValue("11"), { target: { value: "14" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ fontSize: 14 })]
      );
    });

    it("edits text card element width", () => {
      const textCard = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "test", fontSize: 14, bold: false, italic: false, underline: false, color: "#374151", width: 495 };
      const el = { ...baseRepeaterEl, cardElements: [textCard] };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("495"), { target: { value: "400" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ width: 400 })]
      );
    });
  });

  // ── CustomEvent cleanup on unmount ────────────────────────────────────────
  it("cleans up custom event listeners on unmount", () => {
    const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    const { unmount } = render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    unmount();
    // After unmount, dispatching events should not call onUpdate
    globalThis.dispatchEvent(new CustomEvent("toolbar-text-align", { detail: "center" }));
    expect(baseProps.onUpdate).not.toHaveBeenCalled();
  });

  // ── Position & Size NumInput onChange (line 186) ──────────────────────────
  describe("position and size NumInput onChange", () => {
    it("fires onUpdate for x position change", () => {
      const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hi", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("10"), { target: { value: "30" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "x", 30);
    });

    it("fires onUpdate for y position change", () => {
      const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hi", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("20"), { target: { value: "40" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "y", 40);
    });

    it("fires onUpdate for width change", () => {
      const el = { id: "t1", x: 10, y: 20, type: "text" as const, content: "Hi", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("100"), { target: { value: "200" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "width", 200);
    });

    it("fires onUpdate for height change on image element", () => {
      const el = { id: "i1", x: 10, y: 20, type: "image" as const, label: "Img", width: 200, height: 150, bgColor: "#E2E8F0" };
      render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      fireEvent.change(screen.getByDisplayValue("150"), { target: { value: "180" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "i1", "height", 180);
    });
  });

  // ── Text element typography onChange (lines 247-255, 285) ─────────────────
  describe("text typography onChange handlers", () => {
    const textEl = {
      id: "t1", x: 10, y: 20, type: "text" as const, content: "Hello",
      fontSize: 16, bold: false, italic: false, underline: false,
      color: "#333333", width: 100, lineHeight: 1.8,
    };

    it("fires onUpdate for fontSize change via NumInput", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      fireEvent.change(screen.getByDisplayValue("16"), { target: { value: "24" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "fontSize", 24);
    });

    it("fires onUpdate for color change via ColorInput", () => {
      const { container } = render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      // ColorInput renders a text input with the color value
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      // Find the one with value "#333333"
      let colorInput: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#333333") colorInput = inp as HTMLInputElement;
      });
      expect(colorInput).toBeTruthy();
      fireEvent.change(colorInput!, { target: { value: "#FF0000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "color", "#FF0000");
    });

    it("fires onUpdate for lineHeight change via NumInput", () => {
      render(<PropertiesPanel {...baseProps} el={textEl} allElements={[textEl]} />);
      fireEvent.change(screen.getByDisplayValue("1.8"), { target: { value: "2.0" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "t1", "lineHeight", 2);
    });
  });

  // ── Link element ColorInput onChange (line 379) ───────────────────────────
  describe("link element color onChange", () => {
    it("fires onUpdate for color change via ColorInput", () => {
      const linkEl = {
        id: "l1", x: 10, y: 20, type: "link" as const, content: "Click",
        href: "https://example.com", fontSize: 14, color: "#2563EB", width: 200,
      };
      const { container } = render(<PropertiesPanel {...baseProps} el={linkEl} allElements={[linkEl]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let colorInput: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#2563EB") colorInput = inp as HTMLInputElement;
      });
      expect(colorInput).toBeTruthy();
      fireEvent.change(colorInput!, { target: { value: "#FF0000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "l1", "color", "#FF0000");
    });
  });

  // ── Divider element onChange (lines 391-397) ──────────────────────────────
  describe("divider element onChange handlers", () => {
    const divEl = { id: "d1", x: 10, y: 20, type: "divider" as const, color: "#CBD5E1", width: 515, thickness: 2 };

    it("fires onUpdate for color change via ColorInput", () => {
      const { container } = render(<PropertiesPanel {...baseProps} el={divEl} allElements={[divEl]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let colorInput: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#CBD5E1") colorInput = inp as HTMLInputElement;
      });
      expect(colorInput).toBeTruthy();
      fireEvent.change(colorInput!, { target: { value: "#000000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "d1", "color", "#000000");
    });

    it("fires onUpdate for thickness change via NumInput", () => {
      render(<PropertiesPanel {...baseProps} el={divEl} allElements={[divEl]} />);
      fireEvent.change(screen.getByDisplayValue("2"), { target: { value: "5" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "d1", "thickness", 5);
    });
  });

  // ── Card element ColorInput onChange (lines 430-436) ──────────────────────
  describe("card element color onChange handlers", () => {
    const cardEl = {
      id: "c1", x: 10, y: 20, type: "card" as const, title: "T", value: "V",
      unit: "U", subtitle: "S", accentColor: "#3B82F6", bgColor: "#FFFFFF",
      borderColor: "#DBEAFE", width: 250, height: 105,
    };

    it("fires onUpdate for accentColor change", () => {
      const { container } = render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#3B82F6") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#FF0000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "accentColor", "#FF0000");
    });

    it("fires onUpdate for bgColor change", () => {
      const { container } = render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#FFFFFF") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#EEEEEE" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "bgColor", "#EEEEEE");
    });

    it("fires onUpdate for borderColor change", () => {
      const { container } = render(<PropertiesPanel {...baseProps} el={cardEl} allElements={[cardEl]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#DBEAFE") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#000000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "c1", "borderColor", "#000000");
    });
  });

  // ── Shape element ColorInput onChange (lines 475-478) ─────────────────────
  describe("shape element color onChange handlers", () => {
    const shapeEl = {
      id: "s1", x: 10, y: 20, type: "shape" as const, shapeType: "rectangle" as const,
      width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6",
      strokeWidth: 2, borderRadius: 8,
    };

    it("fires onUpdate for fillColor change", () => {
      const { container } = render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#DBEAFE") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#FF0000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "s1", "fillColor", "#FF0000");
    });

    it("fires onUpdate for strokeColor change", () => {
      const { container } = render(<PropertiesPanel {...baseProps} el={shapeEl} allElements={[shapeEl]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#3B82F6") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#00FF00" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "s1", "strokeColor", "#00FF00");
    });
  });

  // ── Repeater settings NumInput onChange (lines 515-524) ───────────────────
  describe("repeater settings NumInput onChange", () => {
    const repeaterEl = {
      id: "r1", x: 10, y: 20, type: "repeater" as const, label: "Group",
      dataKey: "sensor_group", width: 515, cardWidth: 400, cardHeight: 300,
      itemsPerRow: 2, gap: 8, cardElements: [],
    };

    it("fires onUpdate for cardWidth change", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      fireEvent.change(screen.getByDisplayValue("400"), { target: { value: "450" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "r1", "cardWidth", 450);
    });

    it("fires onUpdate for cardHeight change", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      fireEvent.change(screen.getByDisplayValue("300"), { target: { value: "350" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "r1", "cardHeight", 350);
    });

    it("fires onUpdate for itemsPerRow change", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      fireEvent.change(screen.getByDisplayValue("2"), { target: { value: "3" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "r1", "itemsPerRow", 3);
    });

    it("fires onUpdate for gap change", () => {
      render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
      fireEvent.change(screen.getByDisplayValue("8"), { target: { value: "16" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(0, "r1", "gap", 16);
    });
  });

  // ── Repeater card element ColorInput onChange (lines 639, 666, 679-680, 707) ─
  describe("repeater card element ColorInput onChange", () => {
    const baseRepeaterEl = {
      id: "r1", x: 10, y: 20, type: "repeater" as const, label: "Group",
      dataKey: "sensor_group", width: 515, cardWidth: 515, cardHeight: 360,
      itemsPerRow: 1, gap: 12,
    };

    it("fires updateCardEl for text card element color change", () => {
      const textCard = { id: "ce1", x: 10, y: 10, type: "text" as const, content: "test", fontSize: 14, bold: false, italic: false, underline: false, color: "#374151", width: 495 };
      const el = { ...baseRepeaterEl, cardElements: [textCard] };
      const { container } = render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#374151") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#FF0000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ color: "#FF0000" })]
      );
    });

    it("fires updateCardEl for divider card element color change", () => {
      const divCard = { id: "dc1", x: 10, y: 10, type: "divider" as const, color: "#E2E8F0", width: 200, thickness: 3 };
      const el = { ...baseRepeaterEl, cardElements: [divCard] };
      const { container } = render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#E2E8F0") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#000000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ color: "#000000" })]
      );
    });

    it("fires updateCardEl for card card element accentColor change", () => {
      const cardCard = { id: "cc1", x: 10, y: 10, type: "card" as const, title: "T", value: "V", unit: "U", subtitle: "S", accentColor: "#3B82F6", bgColor: "#FFFFFF", borderColor: "#DBEAFE", width: 200, height: 90 };
      const el = { ...baseRepeaterEl, cardElements: [cardCard] };
      const { container } = render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      // Find the accentColor text input (#3B82F6)
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#3B82F6") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#FF0000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ accentColor: "#FF0000" })]
      );
    });

    it("fires updateCardEl for card card element bgColor change", () => {
      const cardCard = { id: "cc1", x: 10, y: 10, type: "card" as const, title: "T", value: "V", unit: "U", subtitle: "S", accentColor: "#3B82F6", bgColor: "#FFFFFF", borderColor: "#DBEAFE", width: 200, height: 90 };
      const el = { ...baseRepeaterEl, cardElements: [cardCard] };
      const { container } = render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#FFFFFF") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#EEEEEE" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ bgColor: "#EEEEEE" })]
      );
    });

    it("fires updateCardEl for table card element headerColor change", () => {
      const tableCard = { id: "tc1", x: 10, y: 10, type: "table" as const, headers: ["A"], rows: [] as string[][], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200, rowsDataField: "data" };
      const el = { ...baseRepeaterEl, cardElements: [tableCard] };
      const { container } = render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
      const colorTextInputs = container.querySelectorAll('input[type="text"]');
      let input: HTMLInputElement | null = null;
      colorTextInputs.forEach((inp) => {
        if ((inp as HTMLInputElement).value === "#1E40AF") input = inp as HTMLInputElement;
      });
      expect(input).toBeTruthy();
      fireEvent.change(input!, { target: { value: "#000000" } });
      expect(baseProps.onUpdate).toHaveBeenCalledWith(
        0, "r1", "cardElements",
        [expect.objectContaining({ headerColor: "#000000" })]
      );
    });
  });

  // ── Repeater add with existing elements (lastY calculation, line 540) ─────
  it("adds card element when cardElements already exist (lastY calculation)", () => {
    const existingCard = { id: "ce1", x: 10, y: 50, type: "text" as const, content: "A", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
    const repeaterEl = {
      id: "r1", x: 10, y: 20, type: "repeater" as const, label: "Group",
      dataKey: "sensor_group", width: 515, cardWidth: 515, cardHeight: 360,
      itemsPerRow: 1, gap: 12, cardElements: [existingCard],
    };
    render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
    const select = screen.getByDisplayValue("+ Add\u2026");
    fireEvent.change(select, { target: { value: "text" } });
    expect(baseProps.onUpdate).toHaveBeenCalledWith(
      0, "r1", "cardElements",
      expect.arrayContaining([
        expect.objectContaining({ id: "ce1" }),
        expect.objectContaining({ type: "text", y: 70 }),
      ])
    );
  });

  // ── Default case in add card element switch (line 566) ────────────────────
  it("does not add card element for unknown type", () => {
    const repeaterEl = {
      id: "r1", x: 10, y: 20, type: "repeater" as const, label: "Group",
      dataKey: "sensor_group", width: 515, cardWidth: 515, cardHeight: 360,
      itemsPerRow: 1, gap: 12, cardElements: [],
    };
    render(<PropertiesPanel {...baseProps} el={repeaterEl} allElements={[repeaterEl]} />);
    const select = screen.getByDisplayValue("+ Add\u2026");
    fireEvent.change(select, { target: { value: "unknown_type" } });
    expect(baseProps.onUpdate).not.toHaveBeenCalled();
  });
});
