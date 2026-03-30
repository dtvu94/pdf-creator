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
      if (typeof props.render === "function") {
        const content = (props.render as (info: { pageNumber: number; totalPages: number }) => string)({ pageNumber: 2, totalPages: 10 });
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

jest.mock("@/lib/fontRegistry.server", () => ({
  registerFontsServer: jest.fn(),
  getDefaultFamily: jest.fn((f?: string) => f ?? "Roboto"),
}));

import { PdfDocument } from "../serverPdfRenderer";
import type { Template } from "@/types/template";

describe("PdfDocument (serverPdfRenderer.tsx)", () => {
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
  });

  it("renders with metadata", () => {
    const meta = { title: "PDF", author: "A", subject: "S", keywords: "K", creator: "C", producer: "P" };
    const { container } = render(<PdfDocument template={minimalTemplate} metadata={meta} />);
    expect(container.querySelector("[data-testid='Document']")).toBeTruthy();
  });

  it("renders text element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Server text", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Server text");
  });

  it("renders text with bullet list style", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "A\nB\nC", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100, listStyle: "bullet" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("\u2022");
  });

  it("renders text with numbered list style", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "X\nY", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100, listStyle: "numbered" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("1.");
    expect(container.textContent).toContain("2.");
  });

  it("renders text with special placeholders", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Page {{page_number}}/{{total_pages}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Page 2/10");
  });

  it("renders divider", () => {
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

  it("renders table (absolute)", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "tb1", x: 10, y: 20, type: "table", headers: ["H1", "H2"], rows: [["a", "b"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 515 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("H1");
    expect(container.textContent).toContain("a");
  });

  it("renders table (flow / auto)", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "tb1", x: 10, y: 20, type: "table", mode: "auto", headers: ["X", "Y"], rows: [["1", "2"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 515 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("X");
  });

  it("renders image with src", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "i1", x: 10, y: 20, type: "image", label: "L", width: 200, height: 120, bgColor: "#DBEAFE", src: "data:image/png;base64,abc" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeTruthy();
  });

  it("renders image placeholder", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "i1", x: 10, y: 20, type: "image", label: "ImgPH", width: 200, height: 120, bgColor: "#DBEAFE" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("ImgPH");
  });

  it("renders chart with renderedImage", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "ch1", x: 10, y: 20, type: "chart", width: 400, height: 250, option: {}, renderedImage: "data:image/png;base64,chart" },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Image']")).toBeTruthy();
  });

  it("renders chart placeholder", () => {
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

  it("renders link", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "l1", x: 10, y: 20, type: "link", content: "Go", href: "https://example.com", fontSize: 12, color: "#2563EB", width: 200 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Go");
  });

  it("renders card", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "c1", x: 10, y: 20, type: "card", title: "Humidity", value: "65", unit: "%", subtitle: "Normal", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 250, height: 105 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("HUMIDITY");
    expect(container.textContent).toContain("65");
  });

  // Shapes
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
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "circle", width: 100, height: 100, fillColor: "#DBEAFE", strokeColor: "#3B82F6", strokeWidth: 0, borderRadius: 0 },
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

  it("renders shape heart with no stroke", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "s1", x: 10, y: 20, type: "shape", shapeType: "heart", width: 100, height: 100, fillColor: "#FF0000", strokeColor: "#000", strokeWidth: 0, borderRadius: 0 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='Path']")).toBeTruthy();
  });

  // Repeater
  it("renders repeater with items", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 2, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "text", content: "{{name}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 200 },
            ],
            items: [
              { fields: { name: "Item1" } },
              { fields: { name: "Item2" } },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Item1");
    expect(container.textContent).toContain("Item2");
  });

  it("renders repeater with no items", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "myKey",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("no items provided");
  });

  it("renders repeater with card+chart+table+image substitution", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 400, cardHeight: 400, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "card", title: "{{t}}", value: "{{v}}", unit: "U", subtitle: "{{s}}", accentColor: "#3B82F6", bgColor: "#FFF", borderColor: "#DBEAFE", width: 200, height: 90 },
              { id: "ce2", x: 5, y: 100, type: "chart", width: 200, height: 120, option: {} },
              { id: "ce3", x: 5, y: 230, type: "table", headers: ["{{h1}}"], rows: [["{{r1}}"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200, rowsDataField: "td" },
              { id: "ce4", x: 5, y: 340, type: "image", label: "{{lbl}}", width: 200, height: 50, bgColor: "#E2E8F0", srcField: "imgUrl" },
            ],
            items: [
              {
                fields: { t: "Title", v: "99", s: "Sub", h1: "Header", r1: "Row", td: '[["x","y"]]', lbl: "Logo", imgUrl: "data:image/png;base64,ok" },
                chartImages: { ce2: "data:image/png;base64,ch" },
              },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("TITLE");
    expect(container.textContent).toContain("99");
    expect(container.querySelector("[data-testid='Image']")).toBeTruthy();
  });

  // Flow layout with header/footer
  it("renders header and footer in flow layout", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Body", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
        header: {
          height: 60,
          elements: [
            { id: "h1", x: 10, y: 10, type: "text", content: "HdrText", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
          ],
        },
        footer: {
          height: 50,
          elements: [
            { id: "f1", x: 10, y: 10, type: "text", content: "FtrText", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
          ],
        },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("HdrText");
    expect(container.textContent).toContain("FtrText");
    expect(container.textContent).toContain("Body");
  });

  it("renders flow table and repeater in flow layout", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "tb1", x: 10, y: 20, type: "table", mode: "auto", headers: ["C1"], rows: [["v1"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 515 },
          {
            id: "r1", x: 10, y: 200, type: "repeater", label: "R", dataKey: "d",
            width: 515, cardWidth: 200, cardHeight: 100, itemsPerRow: 1, gap: 5,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "text", content: "{{n}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 180 },
            ],
            items: [{ fields: { n: "RepItem" } }],
          },
        ],
        header: { height: 40, elements: [] },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("C1");
    expect(container.textContent).toContain("RepItem");
  });

  // Watermark
  it("renders watermark for all pages", () => {
    const t: Template = {
      ...minimalTemplate,
      watermark: {
        enabled: true,
        src: "data:image/png;base64,wm",
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

  it("does not render watermark without src", () => {
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
        src: "data:image/png;base64,wm",
        pages: [1],
        width: 200,
        height: 200,
        x: 100,
        y: 100,
        opacity: 0.15,
      },
    };
    const { container } = render(<PdfDocument template={t} />);
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

  it("renders heading", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "h1", x: 10, y: 20, type: "heading", content: "Heading", fontSize: 24, bold: true, italic: false, underline: false, color: "#000", width: 100 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Heading");
  });

  it("handles repeater table rowsDataField with invalid JSON", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 400, cardHeight: 400, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "table", headers: ["A"], rows: [["fallback"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 9, width: 200, rowsDataField: "td" },
            ],
            items: [
              { fields: { td: "not-json" } },
            ],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("fallback");
  });

  it("renders link with underline false", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "l1", x: 10, y: 20, type: "link", content: "NoUL", href: "https://example.com", fontSize: 12, color: "#2563EB", width: 200, underline: false },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("NoUL");
  });

  it("renders text with bold, underline, textAlign, lineHeight, opacity", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Styled", fontSize: 12, bold: true, italic: false, underline: true, color: "#000", width: 100, textAlign: "right", lineHeight: 2.0, opacity: 0.5 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Styled");
  });

  it("renders repeater with divider card element", () => {
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
            ],
            items: [{ fields: {} }],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.querySelector("[data-testid='View']")).toBeTruthy();
  });

  it("renders repeater with shape card element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
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

  it("renders repeater image without srcField", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "image", label: "{{lbl}}", width: 200, height: 80, bgColor: "#E2E8F0" },
            ],
            items: [{ fields: { lbl: "ImgLabel" } }],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("ImgLabel");
  });

  it("renders repeater chart without chartImages", () => {
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

  it("renders shape triangle with zero stroke", () => {
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

  it("renders shape diamond with zero stroke", () => {
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

  it("renders shape arrow with zero stroke", () => {
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

  it("renders shape rectangle with no stroke and border radius", () => {
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

  it("renders page with only header in flow layout", () => {
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
            { id: "h1", x: 10, y: 10, type: "text", content: "HdrOnly", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
          ],
        },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("HdrOnly");
  });

  it("renders page with only footer in flow layout", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Body", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
        ],
        footer: {
          height: 50,
          elements: [
            { id: "f1", x: 10, y: 10, type: "text", content: "FtrOnly", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
          ],
        },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("FtrOnly");
  });

  it("renders watermark disabled", () => {
    const t: Template = {
      ...minimalTemplate,
      watermark: {
        enabled: false,
        src: "data:image/png;base64,wm",
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

  it("renders text with opacity", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "t1", x: 10, y: 20, type: "text", content: "Faded", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100, opacity: 0.3 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Faded");
  });

  it("renders link with default underline (undefined)", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "l1", x: 10, y: 20, type: "link", content: "DefUL", href: "https://example.com", fontSize: 12, color: "#2563EB", width: 200 },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("DefUL");
  });

  it("renders repeater with link card element", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          {
            id: "r1", x: 10, y: 20, type: "repeater", label: "G", dataKey: "g",
            width: 515, cardWidth: 250, cardHeight: 200, itemsPerRow: 1, gap: 10,
            cardElements: [
              { id: "ce1", x: 5, y: 5, type: "link", content: "Click", href: "https://example.com", fontSize: 10, color: "#2563EB", width: 200 },
            ],
            items: [{ fields: {} }],
          },
        ],
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("Click");
  });

  it("renders flow table in flow layout with header", () => {
    const t: Template = {
      ...minimalTemplate,
      pages: [{
        id: "p1",
        elements: [
          { id: "tb1", x: 10, y: 20, type: "table", mode: "auto", headers: ["X"], rows: [["1"]], headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 515 },
        ],
        header: { height: 40, elements: [] },
      }],
    };
    const { container } = render(<PdfDocument template={t} />);
    expect(container.textContent).toContain("X");
  });
});
