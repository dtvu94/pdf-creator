/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { TemplatePage } from "@/types/template";

// Mock ElementView to avoid rendering the full element tree in thumbnails
jest.mock("../../ElementView", () => {
  return function MockElementView({ el }: { el: { id: string } }) {
    return <div data-testid={`el-${el.id}`} />;
  };
});

// Mock echarts (ElementView may import it indirectly)
jest.mock("echarts", () => ({
  init: jest.fn(() => ({ setOption: jest.fn(), dispose: jest.fn() })),
}));

jest.mock("@/lib/utils", () => ({
  renderWithPlaceholders: (t: string) => t,
}));

import PageNavigator from "../PageNavigator";

const singlePage: TemplatePage[] = [
  { id: "p1", elements: [{ id: "e1", x: 10, y: 10, type: "text" as const, content: "Hi", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 }] },
];

const multiplePages: TemplatePage[] = [
  { id: "p1", elements: [] },
  { id: "p2", elements: [{ id: "e2", x: 0, y: 0, type: "text" as const, content: "B", fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100 }] },
  { id: "p3", elements: [] },
];

const baseProps = {
  fontFamily: "Roboto",
  pageSize: "A4" as const,
  onSelectPage: jest.fn(),
  onAddPage: jest.fn(),
  onDeletePage: jest.fn(),
  onDuplicatePage: jest.fn(),
  onMovePage: jest.fn(),
  onUpdateBookmark: jest.fn(),
};

describe("PageNavigator", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders pages heading", () => {
    render(<PageNavigator pages={singlePage} activePage={0} {...baseProps} />);
    expect(screen.getByText("Pages")).toBeTruthy();
  });

  it("renders page number badges", () => {
    render(<PageNavigator pages={multiplePages} activePage={0} {...baseProps} />);
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("renders thumbnails with page elements", () => {
    render(<PageNavigator pages={singlePage} activePage={0} {...baseProps} />);
    // The mock ElementView renders data-testid="el-e1"
    expect(screen.getByTestId("el-e1")).toBeTruthy();
  });

  it("marks active page with aria-pressed", () => {
    render(<PageNavigator pages={multiplePages} activePage={1} {...baseProps} />);
    expect(screen.getByLabelText("Go to page 2").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Go to page 1").getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onSelectPage when page button clicked", () => {
    const onSelectPage = jest.fn();
    render(<PageNavigator pages={multiplePages} activePage={0} {...baseProps} onSelectPage={onSelectPage} />);
    fireEvent.click(screen.getByLabelText("Go to page 2"));
    expect(onSelectPage).toHaveBeenCalledWith(1);
  });

  it("calls onAddPage when add button clicked", () => {
    const onAddPage = jest.fn();
    render(<PageNavigator pages={singlePage} activePage={0} {...baseProps} onAddPage={onAddPage} />);
    fireEvent.click(screen.getByText("+ Add"));
    expect(onAddPage).toHaveBeenCalled();
  });

  it("does not show delete button for single page", () => {
    render(<PageNavigator pages={singlePage} activePage={0} {...baseProps} />);
    expect(screen.queryByTitle("Delete page")).toBeNull();
  });

  it("shows delete button on active page when multiple pages", () => {
    render(<PageNavigator pages={multiplePages} activePage={0} {...baseProps} />);
    expect(screen.getByTitle("Delete page")).toBeTruthy();
  });

  it("calls onDeletePage when delete button clicked", () => {
    const onDeletePage = jest.fn();
    render(<PageNavigator pages={multiplePages} activePage={1} {...baseProps} onDeletePage={onDeletePage} />);
    fireEvent.click(screen.getByTitle("Delete page"));
    expect(onDeletePage).toHaveBeenCalledWith(1);
  });

  // ── Duplicate button ──────────────────────────────────────────────────────

  it("calls onDuplicatePage when duplicate button clicked", () => {
    const onDuplicatePage = jest.fn();
    render(<PageNavigator pages={multiplePages} activePage={1} {...baseProps} onDuplicatePage={onDuplicatePage} />);
    fireEvent.click(screen.getByTitle("Duplicate page"));
    expect(onDuplicatePage).toHaveBeenCalledWith(1);
  });

  // ── Move buttons ──────────────────────────────────────────────────────────

  it("calls onMovePage up when move up button clicked", () => {
    const onMovePage = jest.fn();
    render(<PageNavigator pages={multiplePages} activePage={1} {...baseProps} onMovePage={onMovePage} />);
    fireEvent.click(screen.getByTitle("Move page up"));
    expect(onMovePage).toHaveBeenCalledWith(1, "up");
  });

  it("calls onMovePage down when move down button clicked", () => {
    const onMovePage = jest.fn();
    render(<PageNavigator pages={multiplePages} activePage={1} {...baseProps} onMovePage={onMovePage} />);
    fireEvent.click(screen.getByTitle("Move page down"));
    expect(onMovePage).toHaveBeenCalledWith(1, "down");
  });

  it("disables move up on first page", () => {
    render(<PageNavigator pages={multiplePages} activePage={0} {...baseProps} />);
    const moveUp = screen.getByLabelText("Move page 1 up");
    expect((moveUp as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables move down on last page", () => {
    render(<PageNavigator pages={multiplePages} activePage={2} {...baseProps} />);
    const moveDown = screen.getByLabelText("Move page 3 down");
    expect((moveDown as HTMLButtonElement).disabled).toBe(true);
  });

  it("action buttons only shown for active page", () => {
    render(<PageNavigator pages={multiplePages} activePage={1} {...baseProps} />);
    // Only 1 duplicate button (for active page)
    expect(screen.getAllByTitle("Duplicate page").length).toBe(1);
  });

  // ── Bookmark input ──────────────────────────────────────────────────────

  it("shows bookmark input for active page", () => {
    render(<PageNavigator pages={singlePage} activePage={0} {...baseProps} />);
    expect(screen.getByPlaceholderText("Bookmark...")).toBeTruthy();
  });

  it("does not show bookmark input for inactive pages", () => {
    render(<PageNavigator pages={multiplePages} activePage={1} {...baseProps} />);
    const inputs = screen.getAllByPlaceholderText("Bookmark...");
    expect(inputs.length).toBe(1);
  });

  it("calls onUpdateBookmark when bookmark input changes", () => {
    const onUpdateBookmark = jest.fn();
    render(<PageNavigator pages={singlePage} activePage={0} {...baseProps} onUpdateBookmark={onUpdateBookmark} />);
    fireEvent.change(screen.getByPlaceholderText("Bookmark..."), { target: { value: "Chapter 1" } });
    expect(onUpdateBookmark).toHaveBeenCalledWith(0, "Chapter 1");
  });

  it("displays existing bookmark value", () => {
    const pagesWithBookmark: TemplatePage[] = [
      { id: "p1", elements: [], bookmark: "Introduction" },
    ];
    render(<PageNavigator pages={pagesWithBookmark} activePage={0} {...baseProps} />);
    expect((screen.getByPlaceholderText("Bookmark...") as HTMLInputElement).value).toBe("Introduction");
  });
});
