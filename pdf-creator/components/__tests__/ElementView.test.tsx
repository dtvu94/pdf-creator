/** @jest-environment jsdom */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import type {
  TextElement,
  LinkElement,
  DividerElement,
  TableElement,
  ImageElement,
  CardElement,
  ChartElement,
  ShapeElement,
  RepeaterElement,
} from "@/types/template";

jest.mock("echarts", () => ({
  init: jest.fn(() => ({
    setOption: jest.fn(),
    dispose: jest.fn(),
    getDataURL: jest.fn(() => "data:image/png;base64,abc"),
  })),
}));

jest.mock("@/lib/utils", () => ({
  renderWithPlaceholders: (text: string) => text,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ElementView = require("../ElementView").default;

const baseProps = {
  selected: false,
  scale: 1,
  fontFamily: "Roboto",
  viewMode: "select" as const,
  onSelect: jest.fn(),
  onDragStart: jest.fn(),
  onResizeStart: jest.fn(),
};

describe("ElementView", () => {
  describe("text element", () => {
    const textEl: TextElement = {
      id: "t1", x: 10, y: 20, type: "text",
      content: "Hello World", fontSize: 14, bold: false, italic: false,
      underline: false, color: "#000", width: 200,
    };

    it("renders text content", () => {
      const { container } = render(<ElementView el={textEl} {...baseProps} />);
      expect(container.textContent).toContain("Hello World");
    });

    it("renders with bold, italic, underline", () => {
      const el = { ...textEl, bold: true, italic: true, underline: true };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Hello World");
    });

    it("renders with bullet list style", () => {
      const el = { ...textEl, content: "Line1\nLine2", listStyle: "bullet" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("\u2022");
    });

    it("renders with numbered list style", () => {
      const el = { ...textEl, content: "Line1\nLine2", listStyle: "numbered" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("1.");
      expect(container.textContent).toContain("2.");
    });

    it("renders with text alignment and line height", () => {
      const el = { ...textEl, textAlign: "center" as const, lineHeight: 2.0 };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Hello World");
    });
  });

  describe("heading element", () => {
    it("renders heading content", () => {
      const el: TextElement = {
        id: "h1", x: 0, y: 0, type: "heading",
        content: "Title", fontSize: 24, bold: true, italic: false,
        underline: false, color: "#000", width: 300,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Title");
    });
  });

  describe("link element", () => {
    it("renders link content", () => {
      const el: LinkElement = {
        id: "l1", x: 0, y: 0, type: "link",
        content: "Click here", href: "https://example.com",
        fontSize: 12, color: "#0000FF", width: 100,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Click here");
    });

    it("renders link with underline false", () => {
      const el: LinkElement = {
        id: "l1", x: 0, y: 0, type: "link",
        content: "No underline", href: "https://example.com",
        fontSize: 12, color: "#0000FF", width: 100, underline: false,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("No underline");
    });
  });

  describe("divider element", () => {
    it("renders divider", () => {
      const el: DividerElement = {
        id: "d1", x: 0, y: 0, type: "divider",
        color: "#ccc", width: 400, thickness: 2,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("hr")).toBeTruthy();
    });
  });

  describe("image element", () => {
    it("renders image with src", () => {
      const el: ImageElement = {
        id: "i1", x: 0, y: 0, type: "image",
        label: "Logo", width: 100, height: 50, bgColor: "#eee",
        src: "data:image/png;base64,abc",
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("img")).toBeTruthy();
    });

    it("renders placeholder when no src", () => {
      const el: ImageElement = {
        id: "i1", x: 0, y: 0, type: "image",
        label: "My Image", width: 100, height: 50, bgColor: "#eee",
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("My Image");
    });
  });

  describe("card element", () => {
    it("renders card", () => {
      const el: CardElement = {
        id: "c1", x: 0, y: 0, type: "card",
        title: "Temperature", value: "23.5", unit: "C",
        subtitle: "Current", accentColor: "#3B82F6",
        bgColor: "#fff", borderColor: "#ddd",
        width: 200, height: 120,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Temperature");
      expect(container.textContent).toContain("23.5");
      expect(container.textContent).toContain("C");
    });
  });

  describe("chart element", () => {
    it("renders chart with no option (placeholder)", () => {
      const el: ChartElement = {
        id: "ch1", x: 0, y: 0, type: "chart",
        width: 200, height: 100, option: {},
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Chart");
    });

    it("renders chart with option", () => {
      const el: ChartElement = {
        id: "ch1", x: 0, y: 0, type: "chart",
        width: 200, height: 100, option: { series: [{ type: "bar" }] },
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("shape element", () => {
    const baseShape: ShapeElement = {
      id: "sh1", x: 0, y: 0, type: "shape",
      shapeType: "rectangle", width: 100, height: 60,
      fillColor: "#3B82F6", strokeColor: "#000",
      strokeWidth: 2, borderRadius: 5,
    };

    it("renders rectangle", () => {
      const { container } = render(<ElementView el={baseShape} {...baseProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    it("renders circle", () => {
      const el = { ...baseShape, shapeType: "circle" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    it("renders line", () => {
      const el = { ...baseShape, shapeType: "line" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("svg")).toBeTruthy();
    });

    it("renders triangle", () => {
      const el = { ...baseShape, shapeType: "triangle" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("svg")).toBeTruthy();
    });

    it("renders diamond", () => {
      const el = { ...baseShape, shapeType: "diamond" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("svg")).toBeTruthy();
    });

    it("renders arrow", () => {
      const el = { ...baseShape, shapeType: "arrow" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("svg")).toBeTruthy();
    });

    it("renders heart", () => {
      const el = { ...baseShape, shapeType: "heart" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("svg")).toBeTruthy();
    });

    it("renders with no stroke", () => {
      const el = { ...baseShape, strokeWidth: 0 };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("table element", () => {
    it("renders table", () => {
      const el: TableElement = {
        id: "tbl1", x: 0, y: 0, type: "table",
        headers: ["Name", "Value"],
        rows: [["Alice", "100"], ["Bob", "200"]],
        headerColor: "#1E40AF", headerTextColor: "#fff",
        fontSize: 11, width: 400,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Name");
      expect(container.textContent).toContain("Alice");
      expect(container.textContent).toContain("Bob");
    });
  });

  describe("repeater element", () => {
    it("renders repeater preview", () => {
      const el: RepeaterElement = {
        id: "rep1", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 200, cardHeight: 100,
        itemsPerRow: 2, gap: 10,
        cardElements: [
          {
            id: "t1", x: 5, y: 5, type: "text" as const,
            content: "{{name}}", fontSize: 12, bold: false, italic: false,
            underline: false, color: "#000", width: 180,
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Repeater");
      expect(container.textContent).toContain("items");
    });

    it("renders repeater with chart card element", () => {
      const el: RepeaterElement = {
        id: "rep1", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 200, cardHeight: 100,
        itemsPerRow: 2, gap: 10,
        cardElements: [
          {
            id: "ch1", x: 5, y: 5, type: "chart" as const,
            width: 180, height: 80, option: {},
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("chart");
    });

    it("renders repeater with card, divider, table, image card elements", () => {
      const el: RepeaterElement = {
        id: "rep1", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 300, cardHeight: 300,
        itemsPerRow: 1, gap: 10,
        cardElements: [
          {
            id: "div1", x: 5, y: 5, type: "divider" as const,
            color: "#ccc", width: 200, thickness: 1,
          },
          {
            id: "c1", x: 5, y: 20, type: "card" as const,
            title: "{{title}}", value: "{{val}}", unit: "C",
            subtitle: "{{sub}}", accentColor: "#000", bgColor: "#fff",
            borderColor: "#ddd", width: 200, height: 80,
          },
          {
            id: "tbl1", x: 5, y: 110, type: "table" as const,
            headers: ["A"], rows: [["1"]], headerColor: "#000",
            headerTextColor: "#fff", fontSize: 9, width: 200,
            rowsDataField: "tableData",
          },
          {
            id: "img1", x: 5, y: 180, type: "image" as const,
            label: "Image", width: 80, height: 40, bgColor: "#eee",
            srcField: "imgUrl",
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    it("renders repeater image with src", () => {
      const el: RepeaterElement = {
        id: "rep1", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 200, cardHeight: 100,
        itemsPerRow: 1, gap: 10,
        cardElements: [
          {
            id: "img1", x: 5, y: 5, type: "image" as const,
            label: "Image", width: 80, height: 40, bgColor: "#eee",
            src: "data:image/png;base64,abc",
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("img")).toBeTruthy();
    });
  });

  describe("selection and interaction", () => {
    it("shows type label and resize handles when selected", () => {
      const el: TextElement = {
        id: "t1", x: 10, y: 20, type: "text",
        content: "Hello", fontSize: 14, bold: false, italic: false,
        underline: false, color: "#000", width: 200,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} />
      );
      expect(container.textContent).toContain("text");
    });

    it("shows AUTO label for auto mode table when selected", () => {
      const el: TableElement = {
        id: "tbl1", x: 0, y: 0, type: "table", mode: "auto",
        headers: ["A"], rows: [], headerColor: "#000",
        headerTextColor: "#fff", fontSize: 11, width: 200,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} />
      );
      expect(container.textContent).toContain("AUTO");
    });

    it("shows shape type when shape is selected", () => {
      const el: ShapeElement = {
        id: "sh1", x: 0, y: 0, type: "shape",
        shapeType: "circle", width: 100, height: 100,
        fillColor: "#000", strokeColor: "#000",
        strokeWidth: 0, borderRadius: 0,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} />
      );
      expect(container.textContent).toContain("circle");
    });

    it("does not fire drag in pan mode", () => {
      const onDragStart = jest.fn();
      const el: TextElement = {
        id: "t1", x: 0, y: 0, type: "text",
        content: "Test", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} viewMode="pan" onDragStart={onDragStart} />
      );
      const button = container.querySelector('[role="button"]')!;
      fireEvent.mouseDown(button);
      expect(onDragStart).not.toHaveBeenCalled();
    });
  });

  describe("opacity", () => {
    it("applies custom opacity", () => {
      const el: TextElement = {
        id: "t1", x: 0, y: 0, type: "text",
        content: "Faded", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100, opacity: 0.5,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Faded");
    });
  });

  describe("handleContextMenu", () => {
    it("calls onSelect with additive=false and prevents default on right-click", () => {
      const onSelect = jest.fn();
      const el: TextElement = {
        id: "ctx1", x: 0, y: 0, type: "text",
        content: "Right click me", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} onSelect={onSelect} />
      );
      const button = container.querySelector('[role="button"]')!;
      fireEvent.contextMenu(button);
      expect(onSelect).toHaveBeenCalledWith("ctx1", false);
    });
  });

  describe("handleKeyDown", () => {
    it("calls onSelect with shiftKey=false when Enter is pressed", () => {
      const onSelect = jest.fn();
      const el: TextElement = {
        id: "key1", x: 0, y: 0, type: "text",
        content: "Key test", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} onSelect={onSelect} />
      );
      const button = container.querySelector('[role="button"]')!;
      fireEvent.keyDown(button, { key: "Enter" });
      expect(onSelect).toHaveBeenCalledWith("key1", false);
    });

    it("calls onSelect with shiftKey=false when Space is pressed", () => {
      const onSelect = jest.fn();
      const el: TextElement = {
        id: "key2", x: 0, y: 0, type: "text",
        content: "Space test", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} onSelect={onSelect} />
      );
      const button = container.querySelector('[role="button"]')!;
      fireEvent.keyDown(button, { key: " " });
      expect(onSelect).toHaveBeenCalledWith("key2", false);
    });

    it("calls onSelect with shiftKey=true when Shift+Enter is pressed", () => {
      const onSelect = jest.fn();
      const el: TextElement = {
        id: "key3", x: 0, y: 0, type: "text",
        content: "Shift test", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} onSelect={onSelect} />
      );
      const button = container.querySelector('[role="button"]')!;
      fireEvent.keyDown(button, { key: "Enter", shiftKey: true });
      expect(onSelect).toHaveBeenCalledWith("key3", true);
    });

    it("does not call onSelect for other keys", () => {
      const onSelect = jest.fn();
      const el: TextElement = {
        id: "key4", x: 0, y: 0, type: "text",
        content: "No action", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} onSelect={onSelect} />
      );
      const button = container.querySelector('[role="button"]')!;
      fireEvent.keyDown(button, { key: "Tab" });
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("shift+click (additive selection)", () => {
    it("calls onSelect with additive=true and onDragStart on shift+mouseDown", () => {
      const onSelect = jest.fn();
      const onDragStart = jest.fn();
      const el: TextElement = {
        id: "shift1", x: 0, y: 0, type: "text",
        content: "Shift click", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} onSelect={onSelect} onDragStart={onDragStart} />
      );
      const button = container.querySelector('[role="button"]')!;
      fireEvent.mouseDown(button, { shiftKey: true });
      expect(onSelect).toHaveBeenCalledWith("shift1", true);
      expect(onDragStart).toHaveBeenCalledWith(expect.anything(), "shift1");
    });
  });

  describe("resize handles for height-supporting elements", () => {
    it("renders all 8 resize handles for a selected image element", () => {
      const el: ImageElement = {
        id: "img-sel", x: 0, y: 0, type: "image",
        label: "Test", width: 100, height: 80, bgColor: "#eee",
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} />
      );
      const handles = container.querySelectorAll('[role="presentation"]');
      expect(handles.length).toBe(8);
    });

    it("renders all 8 resize handles for a selected card element", () => {
      const el: CardElement = {
        id: "card-sel", x: 0, y: 0, type: "card",
        title: "T", value: "V", unit: "U",
        subtitle: "S", accentColor: "#000",
        bgColor: "#fff", borderColor: "#ddd",
        width: 200, height: 120,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} />
      );
      const handles = container.querySelectorAll('[role="presentation"]');
      expect(handles.length).toBe(8);
    });

    it("renders all 8 resize handles for a selected chart element", () => {
      const el: ChartElement = {
        id: "chart-sel", x: 0, y: 0, type: "chart",
        width: 200, height: 100, option: {},
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} />
      );
      const handles = container.querySelectorAll('[role="presentation"]');
      expect(handles.length).toBe(8);
    });

    it("renders only 2 resize handles (e, w) for a selected text element", () => {
      const el: TextElement = {
        id: "txt-sel", x: 0, y: 0, type: "text",
        content: "Test", fontSize: 12, bold: false, italic: false,
        underline: false, color: "#000", width: 100,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} />
      );
      const handles = container.querySelectorAll('[role="presentation"]');
      expect(handles.length).toBe(2);
    });

    it("calls onResizeStart when a handle is mouseDown-ed", () => {
      const onResizeStart = jest.fn();
      const el: ImageElement = {
        id: "img-resize", x: 0, y: 0, type: "image",
        label: "Test", width: 100, height: 80, bgColor: "#eee",
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} onResizeStart={onResizeStart} />
      );
      const handles = container.querySelectorAll('[role="presentation"]');
      fireEvent.mouseDown(handles[0]);
      expect(onResizeStart).toHaveBeenCalled();
    });
  });

  describe("shapes with strokeWidth=0", () => {
    const baseShape: ShapeElement = {
      id: "sh-zero", x: 0, y: 0, type: "shape",
      shapeType: "rectangle", width: 100, height: 60,
      fillColor: "#3B82F6", strokeColor: "#000",
      strokeWidth: 0, borderRadius: 0,
    };

    it("renders triangle with strokeWidth=0", () => {
      const el = { ...baseShape, shapeType: "triangle" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      const polygon = container.querySelector("polygon");
      expect(polygon).toBeTruthy();
      expect(polygon!.getAttribute("stroke-width")).toBe("0");
    });

    it("renders diamond with strokeWidth=0", () => {
      const el = { ...baseShape, shapeType: "diamond" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      const polygon = container.querySelector("polygon");
      expect(polygon).toBeTruthy();
      expect(polygon!.getAttribute("stroke-width")).toBe("0");
    });

    it("renders arrow with strokeWidth=0", () => {
      const el = { ...baseShape, shapeType: "arrow" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      const polygon = container.querySelector("polygon");
      expect(polygon).toBeTruthy();
      expect(polygon!.getAttribute("stroke-width")).toBe("0");
    });

    it("renders heart with strokeWidth=0", () => {
      const el = { ...baseShape, shapeType: "heart" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      const path = container.querySelector("path");
      expect(path).toBeTruthy();
      expect(path!.getAttribute("stroke-width")).toBe("0");
    });

    it("renders circle with strokeWidth=0 (no border)", () => {
      const el = { ...baseShape, shapeType: "circle" as const };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("image element edge cases", () => {
    it("renders 'Image' as default text when no label and no src", () => {
      const el: ImageElement = {
        id: "img-nolabel", x: 0, y: 0, type: "image",
        label: "", width: 100, height: 50, bgColor: "#eee",
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Image");
    });
  });

  describe("link element with default underline", () => {
    it("renders with underline when underline prop is not set (defaults to true)", () => {
      const el: LinkElement = {
        id: "link-default", x: 0, y: 0, type: "link",
        content: "Default underline", href: "https://example.com",
        fontSize: 12, color: "#0000FF", width: 100,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Default underline");
    });
  });

  describe("repeater with table with empty rows", () => {
    it("renders placeholder dots when table rows array is empty", () => {
      const el: RepeaterElement = {
        id: "rep-empty-rows", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 300, cardHeight: 200,
        itemsPerRow: 1, gap: 10,
        cardElements: [
          {
            id: "tbl-empty", x: 5, y: 5, type: "table" as const,
            headers: ["Col1", "Col2"],
            rows: [],
            headerColor: "#000",
            headerTextColor: "#fff",
            fontSize: 9,
            width: 200,
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      // When rows is empty, it should show "…" placeholders
      const cells = container.querySelectorAll("td");
      expect(cells.length).toBe(2);
      expect(cells[0].textContent).toBe("…");
      expect(cells[1].textContent).toBe("…");
    });
  });

  describe("repeater with heading card element", () => {
    it("renders heading inside repeater card", () => {
      const el: RepeaterElement = {
        id: "rep-heading", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 200, cardHeight: 100,
        itemsPerRow: 1, gap: 10,
        cardElements: [
          {
            id: "h-card", x: 5, y: 5, type: "heading" as const,
            content: "{{heading}}", fontSize: 14, bold: true, italic: false,
            underline: false, color: "#000", width: 180,
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("{{heading}}");
    });
  });

  describe("repeater with unknown card element type", () => {
    it("returns null for unknown card element type", () => {
      const el: RepeaterElement = {
        id: "rep-unknown", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 200, cardHeight: 100,
        itemsPerRow: 1, gap: 10,
        cardElements: [
          {
            id: "unknown1", x: 5, y: 5, type: "link" as const,
            content: "link", href: "https://x.com", fontSize: 12, color: "#000", width: 100,
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("Repeater");
    });
  });

  describe("table element fallback values", () => {
    it("renders table without explicit headerColor or fontSize", () => {
      const el: TableElement = {
        id: "tbl-defaults", x: 0, y: 0, type: "table",
        headers: ["H1"], rows: [["V1"]],
        headerColor: "", headerTextColor: "",
        fontSize: 0, width: 200,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("table")).toBeTruthy();
    });
  });

  describe("repeater table fallback values", () => {
    it("renders repeater table without explicit fontSize/headerTextColor/rowsDataField", () => {
      const el: RepeaterElement = {
        id: "rep-tbl-def", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 300, cardHeight: 200,
        itemsPerRow: 1, gap: 10,
        cardElements: [
          {
            id: "tbl-def", x: 5, y: 5, type: "table" as const,
            headers: ["A"],
            rows: [["1"], ["2"], ["3"]],
            headerColor: "",
            headerTextColor: "",
            fontSize: 0,
            width: 200,
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("table")).toBeTruthy();
      // Only first 2 rows should be shown
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(2);
    });
  });

  describe("repeater image with src (no srcField)", () => {
    it("renders image with bg color and label when no src and no srcField", () => {
      const el: RepeaterElement = {
        id: "rep-img-nosrc", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 200, cardHeight: 100,
        itemsPerRow: 1, gap: 10,
        cardElements: [
          {
            id: "img-nosrc", x: 5, y: 5, type: "image" as const,
            label: "NoSrc", width: 80, height: 40, bgColor: "",
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("NoSrc");
    });
  });

  describe("shape with explicit opacity", () => {
    it("renders circle with explicit opacity", () => {
      const el: ShapeElement = {
        id: "sh-op", x: 0, y: 0, type: "shape",
        shapeType: "circle", width: 100, height: 100,
        fillColor: "#3B82F6", strokeColor: "#000",
        strokeWidth: 2, borderRadius: 0, opacity: 0.5,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    it("renders triangle with explicit opacity", () => {
      const el: ShapeElement = {
        id: "sh-tri-op", x: 0, y: 0, type: "shape",
        shapeType: "triangle", width: 100, height: 60,
        fillColor: "#3B82F6", strokeColor: "#000",
        strokeWidth: 2, borderRadius: 0, opacity: 0.7,
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.querySelector("svg")).toBeTruthy();
    });
  });

  describe("resize handle edge case - element without width/height", () => {
    it("uses default width and height for resize handles", () => {
      // A divider element doesn't have height property
      const el: DividerElement = {
        id: "div-sel", x: 0, y: 0, type: "divider",
        color: "#ccc", width: 400, thickness: 2,
      };
      const { container } = render(
        <ElementView el={el} {...baseProps} selected={true} />
      );
      // Dividers only get e/w handles
      const handles = container.querySelectorAll('[role="presentation"]');
      expect(handles.length).toBe(2);
    });
  });

  describe("repeater image with srcField but no src", () => {
    it("renders 'img: <srcField>' when image has srcField but no src", () => {
      const el: RepeaterElement = {
        id: "rep-img-field", x: 0, y: 0, type: "repeater",
        label: "Items", dataKey: "items",
        width: 500, cardWidth: 200, cardHeight: 100,
        itemsPerRow: 1, gap: 10,
        cardElements: [
          {
            id: "img-field", x: 5, y: 5, type: "image" as const,
            label: "Photo", width: 80, height: 40, bgColor: "#eee",
            srcField: "photoUrl",
          },
        ],
      };
      const { container } = render(<ElementView el={el} {...baseProps} />);
      expect(container.textContent).toContain("img: photoUrl");
    });
  });
});
