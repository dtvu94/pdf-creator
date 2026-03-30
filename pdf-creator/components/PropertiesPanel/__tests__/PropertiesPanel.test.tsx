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
  return function MockImageSection() {
    return <div data-testid="ImageSection" />;
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
import Field from "../Field";
import ColorInput from "../ColorInput";
import NumInput from "../NumInput";
import WatermarkPanel from "../WatermarkPanel";

// ── PropertiesPanel Tests ───────────────────────────────────────────────────

describe("PropertiesPanel", () => {
  const baseProps = {
    pageIdx: 0,
    allElements: [] as never[],
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    onMoveZOrder: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders empty state when no element selected", () => {
    render(<PropertiesPanel {...baseProps} el={null} />);
    expect(screen.getByText("Select an element to edit its properties")).toBeTruthy();
  });

  it("renders text element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("text")).toBeTruthy();
    expect(screen.getByText("Typography")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("renders heading element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "heading" as const, content: "Title", fontSize: 24, bold: true, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("heading")).toBeTruthy();
    expect(screen.getByText("Typography")).toBeTruthy();
  });

  it("renders link element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "link" as const, content: "Click", href: "https://example.com", fontSize: 12, color: "#2563EB", width: 200 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("link")).toBeTruthy();
    expect(screen.getByText("Display Text")).toBeTruthy();
    expect(screen.getByText("URL / Email")).toBeTruthy();
  });

  it("renders divider element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "divider" as const, color: "#CBD5E1", width: 515, thickness: 1 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("divider")).toBeTruthy();
    expect(screen.getByText("Divider")).toBeTruthy();
    expect(screen.getByText("Thickness (pt)")).toBeTruthy();
  });

  it("renders image element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "image" as const, label: "Image", width: 200, height: 120, bgColor: "#DBEAFE" };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("image")).toBeTruthy();
    expect(screen.getByTestId("ImageSection")).toBeTruthy();
  });

  it("renders table element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "table" as const, headers: ["A", "B"], rows: [["1", "2"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 515 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("table")).toBeTruthy();
    expect(screen.getByTestId("TableSection")).toBeTruthy();
  });

  it("renders card element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "card" as const, title: "Test", value: "42", unit: "C", subtitle: "Normal", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 250, height: 105 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("card")).toBeTruthy();
    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Value")).toBeTruthy();
  });

  it("renders chart element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "chart" as const, width: 400, height: 250, option: {} };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("chart")).toBeTruthy();
    expect(screen.getByTestId("ChartSection")).toBeTruthy();
  });

  it("renders shape element properties", () => {
    const el = { id: "el1", x: 10, y: 20, type: "shape" as const, shapeType: "rectangle" as const, width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 8 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("Shape")).toBeTruthy();
    expect(screen.getByText("Fill Color")).toBeTruthy();
    expect(screen.getByText("Stroke Color")).toBeTruthy();
    expect(screen.getByText("Border Radius")).toBeTruthy();
  });

  it("renders shape without border radius for non-rectangle", () => {
    const el = { id: "el1", x: 10, y: 20, type: "shape" as const, shapeType: "circle" as const, width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 0 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.queryByText("Border Radius")).toBeNull();
  });

  it("renders repeater element properties", () => {
    const el = {
      id: "el1", x: 10, y: 20, type: "repeater" as const, label: "Group", dataKey: "sensor_group",
      width: 515, cardWidth: 515, cardHeight: 360, itemsPerRow: 1, gap: 12, cardElements: [],
    };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("Repeater Settings")).toBeTruthy();
    expect(screen.getByText("Label")).toBeTruthy();
    expect(screen.getByText("Data Key")).toBeTruthy();
    expect(screen.getByText("Card Template Elements")).toBeTruthy();
  });

  it("renders repeater with card elements", () => {
    const cardEl = { id: "cel1", x: 10, y: 10, type: "text" as const, content: "test", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 };
    const el = {
      id: "el1", x: 10, y: 20, type: "repeater" as const, label: "Group", dataKey: "sensor_group",
      width: 515, cardWidth: 515, cardHeight: 360, itemsPerRow: 1, gap: 12, cardElements: [cardEl],
    };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("text #1")).toBeTruthy();
  });

  it("fires onDelete when delete button is clicked", () => {
    const onDelete = jest.fn();
    const el = { id: "el1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(0, "el1");
  });

  it("fires onMoveZOrder when z-order buttons clicked", () => {
    const onMoveZOrder = jest.fn();
    const el = { id: "el1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    const el2 = { id: "el2", x: 10, y: 40, type: "text" as const, content: "World", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el, el2]} onMoveZOrder={onMoveZOrder} />);
    fireEvent.click(screen.getByTitle("Bring to front"));
    expect(onMoveZOrder).toHaveBeenCalledWith("top");
  });

  it("renders text alignment buttons", () => {
    const el = { id: "el1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("Text Align")).toBeTruthy();
    expect(screen.getByText("left")).toBeTruthy();
    expect(screen.getByText("center")).toBeTruthy();
    expect(screen.getByText("right")).toBeTruthy();
    expect(screen.getByText("justify")).toBeTruthy();
  });

  it("renders list style buttons", () => {
    const el = { id: "el1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("List Style")).toBeTruthy();
    expect(screen.getByText("none")).toBeTruthy();
    expect(screen.getByText("bullet")).toBeTruthy();
    expect(screen.getByText("numbered")).toBeTruthy();
  });

  it("handles text formatting checkboxes", () => {
    const onUpdate = jest.fn();
    const el = { id: "el1", x: 10, y: 20, type: "text" as const, content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} onUpdate={onUpdate} />);
    // Find bold checkbox
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // bold
    expect(onUpdate).toHaveBeenCalledWith(0, "el1", "bold", true);
  });

  it("renders repeater card element types: chart, divider, card, table, image", () => {
    const cardElements = [
      { id: "c1", x: 10, y: 10, type: "chart" as const, width: 200, height: 120, option: {} },
      { id: "c2", x: 10, y: 140, type: "divider" as const, color: "#E2E8F0", width: 200, thickness: 1 },
      { id: "c3", x: 10, y: 160, type: "card" as const, title: "T", value: "V", unit: "U", subtitle: "S", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 200, height: 90 },
      { id: "c4", x: 10, y: 260, type: "table" as const, headers: ["A"], rows: [], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200 },
      { id: "c5", x: 10, y: 280, type: "image" as const, label: "Img", width: 200, height: 80, bgColor: "#E2E8F0" },
    ];
    const el = {
      id: "el1", x: 10, y: 20, type: "repeater" as const, label: "Group", dataKey: "sensor_group",
      width: 515, cardWidth: 515, cardHeight: 360, itemsPerRow: 1, gap: 12, cardElements,
    };
    render(<PropertiesPanel {...baseProps} el={el} allElements={[el]} />);
    expect(screen.getByText("chart #1")).toBeTruthy();
    expect(screen.getByText("divider #2")).toBeTruthy();
    expect(screen.getByText("card #3")).toBeTruthy();
    expect(screen.getByText("table #4")).toBeTruthy();
    expect(screen.getByText("image #5")).toBeTruthy();
  });
});

// ── Field Tests ─────────────────────────────────────────────────────────────

describe("Field", () => {
  it("renders label and children", () => {
    render(
      <Field label="Test Label">
        <input data-testid="child-input" />
      </Field>
    );
    expect(screen.getByText("Test Label")).toBeTruthy();
    expect(screen.getByTestId("child-input")).toBeTruthy();
  });
});

// ── ColorInput Tests ────────────────────────────────────────────────────────

describe("ColorInput", () => {
  it("renders color and text inputs", () => {
    const onChange = jest.fn();
    const { container } = render(<ColorInput value="#FF0000" onChange={onChange} />);
    const colorInput = container.querySelector('input[type="color"]');
    const textInput = container.querySelector('input[type="text"]');
    expect(colorInput).toBeTruthy();
    expect(textInput).toBeTruthy();
  });

  it("fires onChange when color picker changes", () => {
    const onChange = jest.fn();
    const { container } = render(<ColorInput value="#FF0000" onChange={onChange} />);
    const colorInput = container.querySelector('input[type="color"]')!;
    fireEvent.change(colorInput, { target: { value: "#00ff00" } });
    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("fires onChange when text input changes", () => {
    const onChange = jest.fn();
    const { container } = render(<ColorInput value="#FF0000" onChange={onChange} />);
    const textInput = container.querySelector('input[type="text"]')!;
    fireEvent.change(textInput, { target: { value: "#0000FF" } });
    expect(onChange).toHaveBeenCalledWith("#0000FF");
  });
});

// ── NumInput Tests ──────────────────────────────────────────────────────────

describe("NumInput", () => {
  it("renders number input with value", () => {
    const onChange = jest.fn();
    render(<NumInput value={42} onChange={onChange} />);
    expect(screen.getByDisplayValue("42")).toBeTruthy();
  });

  it("fires onChange when value changes", () => {
    const onChange = jest.fn();
    render(<NumInput value={42} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("42"), { target: { value: "100" } });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it("respects min/max/step props", () => {
    const onChange = jest.fn();
    const { container } = render(<NumInput value={5} onChange={onChange} min={0} max={10} step={0.5} />);
    const input = container.querySelector("input");
    expect(input?.getAttribute("min")).toBe("0");
    expect(input?.getAttribute("max")).toBe("10");
    expect(input?.getAttribute("step")).toBe("0.5");
  });
});

// ── WatermarkPanel Tests ────────────────────────────────────────────────────

describe("WatermarkPanel", () => {
  const baseWatermark = {
    enabled: true,
    pages: "all" as const,
    width: 200,
    height: 200,
    x: 100,
    y: 100,
    opacity: 0.15,
  };

  it("renders without image", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.getByText("Watermark")).toBeTruthy();
    expect(screen.getByText("No image set")).toBeTruthy();
    expect(screen.getByText("ON")).toBeTruthy();
  });

  it("renders with image", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, src: "data:image/png;base64,abc" };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.getByAltText("watermark preview")).toBeTruthy();
    expect(screen.getByText("Remove")).toBeTruthy();
  });

  it("fires onUpdate when toggle is clicked", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("ON"));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it("renders page selector when custom pages mode", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, pages: [1, 2] as number[] };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.getByText("Select pages:")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("toggles page selection", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, pages: [1] as number[] };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    // Click page 2 to add it
    fireEvent.click(screen.getByText("2"));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ pages: [1, 2] }));
  });

  it("handles pages mode change to all", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, pages: [1] as number[] };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    // Change select to "all"
    fireEvent.change(screen.getByDisplayValue("Specific pages"), { target: { value: "all" } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ pages: "all" }));
  });

  it("handles pages mode change to custom", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    fireEvent.change(screen.getByDisplayValue("All pages"), { target: { value: "custom" } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ pages: [1] }));
  });

  it("handles remove image", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, src: "data:image/png;base64,abc" };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("Remove"));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ src: undefined }));
  });

  it("renders opacity control", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.getByText("15%")).toBeTruthy();
  });
});

