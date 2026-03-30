/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import type { TemplatePage } from "@/types/template";

// Mock ElementView to avoid full rendering
jest.mock("../../ElementView", () => {
  return function MockElementView({ el }: { el: { id: string; type: string } }) {
    return <div data-testid={`thumb-el-${el.id}`} data-type={el.type} />;
  };
});

jest.mock("echarts", () => ({
  init: jest.fn(() => ({ setOption: jest.fn(), dispose: jest.fn() })),
}));

jest.mock("@/lib/utils", () => ({
  renderWithPlaceholders: (t: string) => t,
}));

import PageThumbnail from "../PageThumbnail";

const textEl = (id: string, x: number, y: number) => ({
  id, x, y, type: "text" as const, content: "Test", fontSize: 12,
  bold: false, italic: false, underline: false, color: "#000", width: 100,
});

describe("PageThumbnail", () => {
  it("renders body elements", () => {
    const page: TemplatePage = {
      id: "p1",
      elements: [textEl("b1", 10, 20), textEl("b2", 10, 50)],
    };
    render(<PageThumbnail page={page} fontFamily="Roboto" />);
    expect(screen.getByTestId("thumb-el-b1")).toBeTruthy();
    expect(screen.getByTestId("thumb-el-b2")).toBeTruthy();
  });

  it("renders header elements when header exists", () => {
    const page: TemplatePage = {
      id: "p1",
      elements: [],
      header: { height: 60, elements: [textEl("h1", 5, 5)] },
    };
    render(<PageThumbnail page={page} fontFamily="Roboto" />);
    expect(screen.getByTestId("thumb-el-h1")).toBeTruthy();
  });

  it("renders footer elements when footer exists", () => {
    const page: TemplatePage = {
      id: "p1",
      elements: [],
      footer: { height: 50, elements: [textEl("f1", 5, 5)] },
    };
    render(<PageThumbnail page={page} fontFamily="Roboto" />);
    expect(screen.getByTestId("thumb-el-f1")).toBeTruthy();
  });

  it("renders all sections together", () => {
    const page: TemplatePage = {
      id: "p1",
      elements: [textEl("body1", 0, 0)],
      header: { height: 60, elements: [textEl("head1", 0, 0)] },
      footer: { height: 50, elements: [textEl("foot1", 0, 0)] },
    };
    render(<PageThumbnail page={page} fontFamily="Roboto" />);
    expect(screen.getByTestId("thumb-el-body1")).toBeTruthy();
    expect(screen.getByTestId("thumb-el-head1")).toBeTruthy();
    expect(screen.getByTestId("thumb-el-foot1")).toBeTruthy();
  });

  it("renders empty page without crashing", () => {
    const page: TemplatePage = { id: "p1", elements: [] };
    const { container } = render(<PageThumbnail page={page} fontFamily="Roboto" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("uses correct aspect ratio for A4", () => {
    const page: TemplatePage = { id: "p1", elements: [] };
    const { container } = render(<PageThumbnail page={page} pageSize="A4" fontFamily="Roboto" />);
    const thumb = container.firstChild as HTMLElement;
    // A4: 595 x 842, scale = 100/595 ≈ 0.168, height ≈ 141.5
    expect(thumb.style.width).toBe("100px");
    const h = parseFloat(thumb.style.height);
    expect(h).toBeGreaterThan(135);
    expect(h).toBeLessThan(150);
  });

  it("uses correct aspect ratio for A3", () => {
    const page: TemplatePage = { id: "p1", elements: [] };
    const { container } = render(<PageThumbnail page={page} pageSize="A3" fontFamily="Roboto" />);
    const thumb = container.firstChild as HTMLElement;
    // A3: 842 x 1191, scale = 100/842 ≈ 0.1188, height ≈ 141.5
    const h = parseFloat(thumb.style.height);
    expect(h).toBeGreaterThan(135);
    expect(h).toBeLessThan(150);
  });

  it("does not render header section when header height is 0", () => {
    const page: TemplatePage = {
      id: "p1",
      elements: [],
      header: { height: 0, elements: [textEl("h0", 0, 0)] },
    };
    render(<PageThumbnail page={page} fontFamily="Roboto" />);
    expect(screen.queryByTestId("thumb-el-h0")).toBeNull();
  });

  it("does not render footer section when footer height is 0", () => {
    const page: TemplatePage = {
      id: "p1",
      elements: [],
      footer: { height: 0, elements: [textEl("f0", 0, 0)] },
    };
    render(<PageThumbnail page={page} fontFamily="Roboto" />);
    expect(screen.queryByTestId("thumb-el-f0")).toBeNull();
  });

  it("passes default pageSize when none provided", () => {
    const page: TemplatePage = { id: "p1", elements: [textEl("def1", 0, 0)] };
    const { container } = render(<PageThumbnail page={page} fontFamily="Roboto" />);
    // Should render with A4 default dimensions
    const thumb = container.firstChild as HTMLElement;
    expect(thumb.style.width).toBe("100px");
  });
});
