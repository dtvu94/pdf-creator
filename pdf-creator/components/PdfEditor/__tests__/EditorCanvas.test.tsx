/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { TemplatePage, WatermarkConfig } from "@/types/template";

// Mock ElementView
jest.mock("@/components/ElementView", () => {
  const M = (props: { el: { id: string }; selected: boolean; onSelect: (id: string, add: boolean) => void }) =>
    React.createElement("div", {
      "data-testid": `element-${props.el.id}`,
      "data-selected": props.selected,
      onClick: () => props.onSelect(props.el.id, false),
    }, props.el.id);
  M.displayName = "ElementView";
  return { __esModule: true, default: M };
});

// Mock lucide-react
jest.mock("lucide-react", () => {
  const icon = (name: string) => {
    const IconComp = (props: Record<string, unknown>) =>
      React.createElement("span", { "data-testid": `icon-${name}`, ...props });
    IconComp.displayName = name;
    return IconComp;
  };
  return new Proxy({}, { get: (_t, p: string) => icon(p) });
});

import EditorCanvas from "../EditorCanvas";

const emptyPage: TemplatePage = { id: "p1", elements: [] };

const pageWithElements: TemplatePage = {
  id: "p1",
  elements: [
    { id: "t1", x: 10, y: 20, type: "text", content: "Hello", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
    { id: "d1", x: 10, y: 80, type: "divider", color: "#ccc", width: 200, thickness: 1 },
  ],
};

const pageWithHeaderFooter: TemplatePage = {
  id: "p1",
  elements: [
    { id: "b1", x: 10, y: 20, type: "text", content: "Body", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 },
  ],
  header: {
    height: 60,
    elements: [
      { id: "h1", x: 10, y: 10, type: "text", content: "Header", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
    ],
  },
  footer: {
    height: 50,
    elements: [
      { id: "f1", x: 10, y: 10, type: "text", content: "Footer", fontSize: 10, bold: false, italic: false, underline: false, color: "#000", width: 100 },
    ],
  },
};

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    currentPage: emptyPage,
    canvasW: 595,
    canvasH: 842,
    headerH: 0,
    footerH: 0,
    fontFamily: "Roboto",
    activeSection: "body" as "body" | "header" | "footer",
    selectedIds: new Set<string>(),
    selectedSection: "body" as "body" | "header" | "footer",
    activePage: 0,
    viewMode: "select" as "select" | "pan",
    zoom: 1,
    editorScale: 1,
    onDeselectAll: jest.fn(),
    onSectionChange: jest.fn(),
    onSelectElement: jest.fn(),
    onDragStart: jest.fn(),
    onResizeStart: jest.fn(),
    onSectionResize: jest.fn(),
    onViewModeChange: jest.fn(),
    onZoomChange: jest.fn(),
    ...overrides,
  };
}

describe("EditorCanvas", () => {
  it("renders empty page with placeholder text", () => {
    const props = makeProps();
    const { container } = render(<EditorCanvas {...props} />);
    expect(container.textContent).toContain("Use the toolbar to add elements");
  });

  it("renders elements on the page", () => {
    const props = makeProps({ currentPage: pageWithElements });
    render(<EditorCanvas {...props} />);
    expect(screen.getByTestId("element-t1")).toBeTruthy();
    expect(screen.getByTestId("element-d1")).toBeTruthy();
  });

  it("renders header and footer zones", () => {
    const props = makeProps({
      currentPage: pageWithHeaderFooter,
      headerH: 60,
      footerH: 50,
    });
    render(<EditorCanvas {...props} />);
    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
    expect(screen.getByLabelText("Activate header section")).toBeTruthy();
    expect(screen.getByLabelText("Activate footer section")).toBeTruthy();
  });

  it("calls onSectionChange when header zone clicked", () => {
    const props = makeProps({
      currentPage: pageWithHeaderFooter,
      headerH: 60,
      footerH: 50,
    });
    render(<EditorCanvas {...props} />);
    fireEvent.click(screen.getByLabelText("Activate header section"));
    expect(props.onSectionChange).toHaveBeenCalledWith("header");
  });

  it("calls onSectionChange when footer zone clicked", () => {
    const props = makeProps({
      currentPage: pageWithHeaderFooter,
      headerH: 60,
      footerH: 50,
    });
    render(<EditorCanvas {...props} />);
    fireEvent.click(screen.getByLabelText("Activate footer section"));
    expect(props.onSectionChange).toHaveBeenCalledWith("footer");
  });

  it("calls onSectionChange when body zone clicked", () => {
    const props = makeProps();
    render(<EditorCanvas {...props} />);
    fireEvent.click(screen.getByLabelText("Activate body section"));
    expect(props.onSectionChange).toHaveBeenCalledWith("body");
  });

  it("does not call onSectionChange in pan mode", () => {
    const props = makeProps({
      currentPage: pageWithHeaderFooter,
      headerH: 60,
      footerH: 50,
      viewMode: "pan",
    });
    render(<EditorCanvas {...props} />);
    fireEvent.click(screen.getByLabelText("Activate header section"));
    fireEvent.click(screen.getByLabelText("Activate footer section"));
    fireEvent.click(screen.getByLabelText("Activate body section"));
    expect(props.onSectionChange).not.toHaveBeenCalled();
  });

  it("renders header resize handle", () => {
    const props = makeProps({
      currentPage: pageWithHeaderFooter,
      headerH: 60,
      footerH: 50,
    });
    render(<EditorCanvas {...props} />);
    const headerResizeHandle = screen.getByLabelText("Drag to resize header section");
    expect(headerResizeHandle).toBeTruthy();
    fireEvent.mouseDown(headerResizeHandle);
    expect(props.onSectionResize).toHaveBeenCalled();
  });

  it("renders footer resize handle", () => {
    const props = makeProps({
      currentPage: pageWithHeaderFooter,
      headerH: 60,
      footerH: 50,
    });
    render(<EditorCanvas {...props} />);
    const footerResizeHandle = screen.getByLabelText("Drag to resize footer section");
    expect(footerResizeHandle).toBeTruthy();
    fireEvent.mouseDown(footerResizeHandle);
    expect(props.onSectionResize).toHaveBeenCalled();
  });

  it("renders view mode buttons and calls onViewModeChange", () => {
    const props = makeProps();
    render(<EditorCanvas {...props} />);
    fireEvent.click(screen.getByTitle("Select & move elements"));
    expect(props.onViewModeChange).toHaveBeenCalledWith("select");
    fireEvent.click(screen.getByTitle("Pan viewport"));
    expect(props.onViewModeChange).toHaveBeenCalledWith("pan");
  });

  it("renders zoom controls and calls onZoomChange", () => {
    const props = makeProps({ zoom: 1 });
    render(<EditorCanvas {...props} />);
    expect(screen.getByText("100%")).toBeTruthy();
    fireEvent.click(screen.getByTitle("Zoom in"));
    expect(props.onZoomChange).toHaveBeenCalledWith(1.25);
    fireEvent.click(screen.getByTitle("Zoom out"));
    expect(props.onZoomChange).toHaveBeenCalledWith(0.75);
    fireEvent.click(screen.getByTitle("Reset zoom to 100%"));
    expect(props.onZoomChange).toHaveBeenCalledWith(1);
  });

  it("disables zoom out at minimum and zoom in at maximum", () => {
    const propsMin = makeProps({ zoom: 0.25 });
    const { unmount } = render(<EditorCanvas {...propsMin} />);
    expect((screen.getByTitle("Zoom out") as HTMLButtonElement).disabled).toBe(true);
    unmount();

    const propsMax = makeProps({ zoom: 3 });
    render(<EditorCanvas {...propsMax} />);
    expect((screen.getByTitle("Zoom in") as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders watermark when enabled for all pages", () => {
    const wm: WatermarkConfig = {
      enabled: true, src: "data:image/png;base64,wm", pages: "all",
      width: 200, height: 200, x: 100, y: 100, opacity: 0.15,
    };
    const props = makeProps({ watermark: wm });
    const { container } = render(<EditorCanvas {...props} />);
    const img = container.querySelector('img[alt="watermark"]');
    expect(img).toBeTruthy();
  });

  it("renders watermark for specific pages", () => {
    const wm: WatermarkConfig = {
      enabled: true, src: "data:image/png;base64,wm", pages: [2],
      width: 200, height: 200, x: 100, y: 100, opacity: 0.15,
    };
    // activePage is 0-based, pages array is 1-based
    const props = makeProps({ watermark: wm, activePage: 1 });
    const { container } = render(<EditorCanvas {...props} />);
    const img = container.querySelector('img[alt="watermark"]');
    expect(img).toBeTruthy();
  });

  it("does not render watermark when page not in list", () => {
    const wm: WatermarkConfig = {
      enabled: true, src: "data:image/png;base64,wm", pages: [2],
      width: 200, height: 200, x: 100, y: 100, opacity: 0.15,
    };
    const props = makeProps({ watermark: wm, activePage: 0 });
    const { container } = render(<EditorCanvas {...props} />);
    const img = container.querySelector('img[alt="watermark"]');
    expect(img).toBeNull();
  });

  it("does not render watermark when disabled", () => {
    const wm: WatermarkConfig = {
      enabled: false, src: "data:image/png;base64,wm", pages: "all",
      width: 200, height: 200, x: 100, y: 100, opacity: 0.15,
    };
    const props = makeProps({ watermark: wm });
    const { container } = render(<EditorCanvas {...props} />);
    const img = container.querySelector('img[alt="watermark"]');
    expect(img).toBeNull();
  });

  it("does not show placeholder text when elements exist", () => {
    const props = makeProps({ currentPage: pageWithElements });
    const { container } = render(<EditorCanvas {...props} />);
    expect(container.textContent).not.toContain("Use the toolbar to add elements");
  });

  it("does not show placeholder text when header or footer exist", () => {
    const pageOnlyHeader: TemplatePage = {
      id: "p1",
      elements: [],
      header: { height: 60, elements: [] },
    };
    const props = makeProps({ currentPage: pageOnlyHeader, headerH: 60 });
    const { container } = render(<EditorCanvas {...props} />);
    expect(container.textContent).not.toContain("Use the toolbar to add elements");
  });

  it("handles pan mode mouse down with scroll behavior", () => {
    const props = makeProps({ viewMode: "pan" });
    const { container } = render(<EditorCanvas {...props} />);
    const viewport = container.firstChild!.firstChild as HTMLElement;
    fireEvent.mouseDown(viewport, { clientX: 100, clientY: 100 });
    // Dispatch mousemove and mouseup to exercise pan handlers
    const moveEvent = new MouseEvent("mousemove", { clientX: 150, clientY: 150 });
    globalThis.dispatchEvent(moveEvent);
    const upEvent = new MouseEvent("mouseup");
    globalThis.dispatchEvent(upEvent);
  });

  it("does not start pan when not in pan mode", () => {
    const props = makeProps({ viewMode: "select" });
    const { container } = render(<EditorCanvas {...props} />);
    const viewport = container.firstChild!.firstChild as HTMLElement;
    fireEvent.mouseDown(viewport, { clientX: 100, clientY: 100 });
    // No pan listeners should be added
  });

  it("renders elements in header and footer", () => {
    const props = makeProps({
      currentPage: pageWithHeaderFooter,
      headerH: 60,
      footerH: 50,
    });
    render(<EditorCanvas {...props} />);
    expect(screen.getByTestId("element-h1")).toBeTruthy();
    expect(screen.getByTestId("element-f1")).toBeTruthy();
    expect(screen.getByTestId("element-b1")).toBeTruthy();
  });
});
