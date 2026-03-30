/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";

jest.mock("@react-pdf/renderer", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactMock = require("react");
  const c = (name: string) => (props: Record<string, unknown>) =>
    ReactMock.createElement("div", { "data-testid": name, ...props }, props.children);
  return {
    Document: c("Document"),
    Page: c("Page"),
    View: (props: Record<string, unknown>) => ReactMock.createElement("div", { "data-testid": "View", ...props }, props.children),
    Text: (props: Record<string, unknown>) => {
      // Support render prop
      if (typeof props.render === "function") {
        const content = (props.render as (info: { pageNumber: number; totalPages: number }) => string)({ pageNumber: 1, totalPages: 5 });
        return ReactMock.createElement("span", { "data-testid": "Text" }, content);
      }
      return ReactMock.createElement("span", { "data-testid": "Text" }, props.children);
    },
    Image: (props: Record<string, unknown>) => ReactMock.createElement("img", { src: props.src as string, "data-testid": "Image" }),
    Link: c("Link"),
    Svg: c("Svg"),
    Path: c("Path"),
    Polygon: c("Polygon"),
    Font: { register: jest.fn() },
    StyleSheet: { create: (s: unknown) => s },
  };
});

jest.mock("@react-pdf/types", () => ({}));

jest.mock("@/lib/fontRegistry", () => ({
  registerFontsClient: jest.fn(),
  getDefaultFamily: jest.fn((f?: string) => f ?? "Roboto"),
}));

import { PdfDocument } from "../PdfTemplate";
import type { Template } from "@/types/template";

describe("PdfDocument (PdfTemplate.tsx)", () => {
  const minimalTemplate: Template = {
    name: "Test",
    pageSize: "A4",
    fontFamily: "Roboto",
    pages: [{ id: "p1", elements: [] }],
    styles: { primaryColor: "#1E40AF" },
  };

  it("renders without crashing with minimal template", () => {
    const { container } = render(<PdfDocument template={minimalTemplate} />);
    expect(container.querySelector("[data-testid='Document']")).toBeTruthy();
    expect(container.querySelector("[data-testid='Page']")).toBeTruthy();
  });

  it("renders with metadata", () => {
    const meta = { title: "My PDF", author: "Test Author", subject: "Sub", keywords: "kw", creator: "C", producer: "P" };
    const { container } = render(<PdfDocument template={minimalTemplate} metadata={meta} />);
    expect(container.querySelector("[data-testid='Document']")).toBeTruthy();
  });

  it("renders text element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Hello World", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Hello World");
  });

  it("renders heading element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "h1", x: 10, y: 20, type: "heading", content: "Big Title", fontSize: 24, bold: true, italic: false, underline: false, color: "#000", width: 100 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Big Title");
  });

  it("renders text element with list style bullet", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Line 1\nLine 2", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100, listStyle: "bullet" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    // Bullet character
    expect(container.textContent).toContain("\u2022");
    expect(container.textContent).toContain("Line 1");
    expect(container.textContent).toContain("Line 2");
  });

  it("renders text element with list style numbered", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "A\nB", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100, listStyle: "numbered" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("1.");
    expect(container.textContent).toContain("2.");
  });

  it("renders text element with page_number placeholder", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Page {{page_number}} of {{total_pages}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Page 1 of 5");
  });

  it("renders link element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "l1", x: 10, y: 20, type: "link", content: "Click me", href: "https://example.com", fontSize: 12, color: "#2563EB", width: 200 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Click me");
  });

  it("renders divider element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "d1", x: 10, y: 20, type: "divider", color: "#CBD5E1", width: 515, thickness: 1 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='View']")).toBeTruthy();
  });

  it("renders table element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "tb1", x: 10, y: 20, type: "table", headers: ["A", "B"], rows: [["1", "2"], ["3", "4"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 515 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("B");
    expect(container.textContent).toContain("1");
  });

  it("renders image element with src", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "i1", x: 10, y: 20, type: "image", label: "Img", width: 200, height: 120, bgColor: "#DBEAFE", src: "data:image/png;base64,abc" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeTruthy();
  });

  it("renders image element without src (placeholder)", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "i1", x: 10, y: 20, type: "image", label: "Placeholder", width: 200, height: 120, bgColor: "#DBEAFE" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Placeholder");
  });

  it("renders chart element with renderedImage", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "ch1", x: 10, y: 20, type: "chart", width: 400, height: 250, option: {}, renderedImage: "data:image/png;base64,abc" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeTruthy();
  });

  it("renders chart element without renderedImage (placeholder)", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "ch1", x: 10, y: 20, type: "chart", width: 400, height: 250, option: {} },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Chart (not rendered)");
  });

  it("renders card element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "c1", x: 10, y: 20, type: "card", title: "Temp", value: "42", unit: "C", subtitle: "Normal", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 250, height: 105 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("TEMP");
    expect(container.textContent).toContain("42");
  });

  it("renders shape rectangle", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "rectangle", width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 8 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='View']")).toBeTruthy();
  });

  it("renders shape circle", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "circle", width: 100, height: 100, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='View']")).toBeTruthy();
  });

  it("renders shape line", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "line", width: 200, height: 10, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='View']")).toBeTruthy();
  });

  it("renders shape triangle", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "triangle", width: 100, height: 100, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Polygon']")).toBeTruthy();
  });

  it("renders shape diamond", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "diamond", width: 100, height: 100, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Polygon']")).toBeTruthy();
  });

  it("renders shape arrow", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "arrow", width: 100, height: 60, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 2, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Polygon']")).toBeTruthy();
  });

  it("renders shape heart", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "heart", width: 100, height: 100, fillColor: "#FF0000", strokeColor: "#000", strokeWidth: 1, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Path']")).toBeTruthy();
  });

  it("renders shape with no stroke", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "rectangle", width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 0, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='View']")).toBeTruthy();
  });

  it("renders repeater element with items", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "Group", dataKey: "group",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 2, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "text", content: "{{name}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 },
            ],
            items: [
              { fields: { name: "Sensor A" } },
              { fields: { name: "Sensor B" } },
              { fields: { name: "Sensor C" } },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Sensor A");
    expect(container.textContent).toContain("Sensor B");
    expect(container.textContent).toContain("Sensor C");
  });

  it("renders repeater element with no items", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "Group", dataKey: "group",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 2, gap: 10,
            cardElements: [],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("no items provided");
  });

  it("renders with header and footer (flow layout)", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Body text", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
        header: {
          height: 60,
          elements: [
            { id: "h1", x: 10, y: 10, type: "text", content: "Header text", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
          ],
        },
        footer: {
          height: 50,
          elements: [
            { id: "f1", x: 10, y: 10, type: "text", content: "Footer text", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
          ],
        },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Header text");
    expect(container.textContent).toContain("Footer text");
    expect(container.textContent).toContain("Body text");
  });

  it("renders flow table in flow layout", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "tb1", x: 10, y: 20, type: "table", mode: "auto", headers: ["A", "B"], rows: [["1", "2"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 515 },
        ],
        header: { height: 60, elements: [] },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("A");
  });

  it("renders watermark when enabled for all pages", () => {
    const t: Template = {
      ...minimalTemplate,
      watermark: {
        enabled: true,
        src: "data:image/png;base64,abc",
        pages: "all",
        width: 200,
        height: 200,
        x: 100,
        y: 100,
        opacity: 0.15,
      },
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeTruthy();
  });

  it("does not render watermark when no src", () => {
    const t: Template = {
      ...minimalTemplate,
      watermark: {
        enabled: true,
        pages: "all",
        width: 200,
        height: 200,
        x: 100,
        y: 100,
        opacity: 0.15,
      },
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeNull();
  });

  it("renders watermark only for specified pages", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [
        { id: "p1", elements: [] },
        { id: "p2", elements: [] },
      ],
      watermark: {
        enabled: true,
        src: "data:image/png;base64,abc",
        pages: [2],
        width: 200,
        height: 200,
        x: 100,
        y: 100,
        opacity: 0.15,
      },
    };
    const { container } = render(<PdfDocument template={t} />);
    // Only page 2 should have the watermark image
    const images = container.querySelectorAll("[data-testid='Image']");
    expect(images.length).toBe(1);
  });

  it("renders default pageSize when not specified", () => {
    const t: Template = {
      name: "Test",
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#1E40AF" },
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Document']")).toBeTruthy();
  });

  it("renders repeater with card containing chart with chartImages", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "Group", dataKey: "group",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "chart", width: 200, height: 120, option: {} },
            ],
            items: [
              { fields: { name: "A" }, chartImages: { ce1: "data:image/png;base64,chart" } },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeTruthy();
  });

  it("renders repeater with card containing table with rowsDataField", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "Group", dataKey: "group",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "table", headers: ["A", "B"], rows: [], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200, rowsDataField: "tableData" },
            ],
            items: [
              { fields: { tableData: '[["r1c1","r1c2"]]' } },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("r1c1");
  });

  it("renders repeater with card containing image with srcField", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "Group", dataKey: "group",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "image", label: "{{name}}", width: 200, height: 80, bgColor: "#E2E8F0", srcField: "imageUrl" },
            ],
            items: [
              { fields: { name: "Logo", imageUrl: "data:image/png;base64,img" } },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeTruthy();
  });

  it("renders repeater with card element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "Group", dataKey: "group",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "card", title: "{{title}}", value: "{{value}}", unit: "C", subtitle: "{{sub}}", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 200, height: 90 },
            ],
            items: [
              { fields: { title: "Temp", value: "25", sub: "ok" } },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("TEMP");
    expect(container.textContent).toContain("25");
  });

  it("renders link element with underline false", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "l1", x: 10, y: 20, type: "link", content: "NoUnderline", href: "https://example.com", fontSize: 12, color: "#2563EB", width: 200, underline: false },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("NoUnderline");
  });

  it("renders text element with bold and underline", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "BoldUnderline", fontSize: 12, bold: true, italic: false, underline: true, color: "#000", width: 100, textAlign: "right", lineHeight: 2.0, opacity: 0.5 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("BoldUnderline");
  });

  it("handles repeater with table rowsDataField invalid JSON", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 400, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "table", headers: ["A"], rows: [["fallback"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200, rowsDataField: "td" },
            ],
            items: [
              { fields: { td: "NOT_JSON" } },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("fallback");
  });

  it("renders repeater with divider and shape card elements", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "divider", color: "#CBD5E1", width: 200, thickness: 1 },
              { id: "ce2", x: 5, y: 20, type: "shape", shapeType: "rectangle", width: 50, height: 50, fillColor: "#FF0000", strokeColor: "#000", strokeWidth: 0, borderRadius: 0 },
            ],
            items: [{ fields: {} }],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='View']")).toBeTruthy();
  });

  it("renders repeater with image card element without srcField", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "image", label: "{{name}}", width: 200, height: 80, bgColor: "#E2E8F0" },
            ],
            items: [{ fields: { name: "TestLabel" } }],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("TestLabel");
  });

  it("renders repeater with chart without chartImages", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "chart", width: 200, height: 120, option: {} },
            ],
            items: [{ fields: {} }],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Chart (not rendered)");
  });

  it("renders flow layout with repeater element in body", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "R", dataKey: "d",
            width: 515, cardWidth: 200, cardHeight: 100, itemsPerRow: 1, gap: 5,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "text", content: "{{n}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 180 },
            ],
            items: [{ fields: { n: "FlowItem" } }],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("FlowItem");
  });

  it("renders shape with zero strokeWidth and nonzero borderRadius", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "rectangle", width: 200, height: 120, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 0, borderRadius: 12 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='View']")).toBeTruthy();
  });

  it("renders with watermark disabled", () => {
    const t: Template = {
      ...minimalTemplate,
      watermark: {
        enabled: false,
        src: "data:image/png;base64,abc",
        pages: "all",
        width: 200,
        height: 200,
        x: 100,
        y: 100,
        opacity: 0.15,
      },
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeNull();
  });

  it("renders template with no fontFamily (defaults)", () => {
    const t: Template = {
      name: "NoFont",
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#000" },
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Document']")).toBeTruthy();
  });

  it("renders template name as document title when no metadata", () => {
    const t: Template = {
      name: "MyDoc",
      pages: [{ id: "p1", elements: [] }],
      styles: { primaryColor: "#000" },
    };
    const { container } = render(<PdfDocument template={t} />);
    const doc = container.querySelector("[data-testid='Document']");
    expect(doc).toBeTruthy();
  });

  it("renders triangle shape with zero stroke", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "triangle", width: 100, height: 100, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 0, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Polygon']")).toBeTruthy();
  });

  it("renders diamond shape with zero stroke", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "diamond", width: 100, height: 100, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 0, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Polygon']")).toBeTruthy();
  });

  it("renders arrow shape with zero stroke", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "arrow", width: 100, height: 60, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 0, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Polygon']")).toBeTruthy();
  });

  it("renders page with only header (no footer) in flow layout", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "BodyOnly", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
        header: {
          height: 60,
          elements: [
            { id: "h1", x: 10, y: 10, type: "text", content: "OnlyHeader", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
          ],
        },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("OnlyHeader");
    expect(container.textContent).toContain("BodyOnly");
  });

  it("renders page with only footer (no header) in flow layout", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "BodyText", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
        footer: {
          height: 50,
          elements: [
            { id: "f1", x: 10, y: 10, type: "text", content: "OnlyFooter", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
          ],
        },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("OnlyFooter");
    expect(container.textContent).toContain("BodyText");
  });

  it("renders text with opacity", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Faded", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100, opacity: 0.5 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Faded");
  });

  it("renders link element with default underline", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "l1", x: 10, y: 20, type: "link", content: "DefaultUnderline", href: "https://example.com", fontSize: 12, color: "#2563EB", width: 200 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("DefaultUnderline");
  });
});
