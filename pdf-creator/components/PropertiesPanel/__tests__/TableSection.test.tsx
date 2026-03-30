/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { TableElement } from "@/types/template";
import TableSection from "../TableSection";

const manualTable: TableElement = {
  id: "tb1", x: 10, y: 20, type: "table",
  mode: "manual",
  headers: ["Name", "Age"],
  rows: [["Alice", "30"], ["Bob", "25"]],
  headerColor: "#1E40AF",
  headerTextColor: "#fff",
  fontSize: 11,
  width: 515,
};

const autoTable: TableElement = {
  id: "tb2", x: 10, y: 20, type: "table",
  mode: "auto",
  headers: ["Col1", "Col2"],
  rows: [["preview1", "preview2"]],
  headerColor: "#1E40AF",
  headerTextColor: "#fff",
  fontSize: 11,
  width: 515,
};

const tableNoMode: TableElement = {
  id: "tb3", x: 10, y: 20, type: "table",
  headers: ["H1"],
  rows: [["r1"]],
  headerColor: "#1E40AF",
  headerTextColor: "#fff",
  fontSize: 11,
  width: 515,
};

const emptyTable: TableElement = {
  id: "tb4", x: 10, y: 20, type: "table",
  mode: "manual",
  headers: ["A", "B"],
  rows: [],
  headerColor: "#1E40AF",
  headerTextColor: "#fff",
  fontSize: 11,
  width: 515,
};

describe("TableSection", () => {
  it("renders table heading and styling fields", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    expect(screen.getByText("Table")).toBeTruthy();
    expect(screen.getByText("Font Size")).toBeTruthy();
    expect(screen.getByText("Header Background")).toBeTruthy();
    expect(screen.getByText("Header Text Color")).toBeTruthy();
  });

  it("renders mode toggle buttons", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    expect(screen.getByText("Manual")).toBeTruthy();
    expect(screen.getByText("Auto CSV")).toBeTruthy();
  });

  it("renders headers in manual mode", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    expect(screen.getByLabelText("Header 1")).toBeTruthy();
    expect(screen.getByLabelText("Header 2")).toBeTruthy();
    expect((screen.getByLabelText("Header 1") as HTMLInputElement).value).toBe("Name");
    expect((screen.getByLabelText("Header 2") as HTMLInputElement).value).toBe("Age");
  });

  it("renders rows in manual mode", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    expect(screen.getByText("ROWS")).toBeTruthy();
    expect(screen.getByLabelText("Row 1, Name")).toBeTruthy();
    expect(screen.getByLabelText("Row 1, Age")).toBeTruthy();
    expect(screen.getByLabelText("Row 2, Name")).toBeTruthy();
  });

  it("calls set when header changes", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    fireEvent.change(screen.getByLabelText("Header 1"), { target: { value: "Full Name" } });
    expect(set).toHaveBeenCalledWith("headers", ["Full Name", "Age"]);
  });

  it("calls set when cell changes", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    fireEvent.change(screen.getByLabelText("Row 1, Name"), { target: { value: "Charlie" } });
    expect(set).toHaveBeenCalledWith("rows", [["Charlie", "30"], ["Bob", "25"]]);
  });

  it("calls set when row is deleted", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    fireEvent.click(screen.getByLabelText("Delete row 1"));
    expect(set).toHaveBeenCalledWith("rows", [["Bob", "25"]]);
  });

  it("calls set when row is added", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    fireEvent.click(screen.getByText("+ Add Row"));
    expect(set).toHaveBeenCalledWith("rows", [["Alice", "30"], ["Bob", "25"], ["", ""]]);
  });

  it("switches to auto mode", () => {
    const set = jest.fn();
    render(<TableSection el={manualTable} set={set} />);
    fireEvent.click(screen.getByText("Auto CSV"));
    expect(set).toHaveBeenCalledWith("mode", "auto");
    // Should also limit rows to 1
    expect(set).toHaveBeenCalledWith("rows", [["Alice", "30"]]);
  });

  it("switches to manual mode", () => {
    const set = jest.fn();
    render(<TableSection el={autoTable} set={set} />);
    fireEvent.click(screen.getByText("Manual"));
    expect(set).toHaveBeenCalledWith("mode", "manual");
  });

  it("renders auto mode with preview row", () => {
    const set = jest.fn();
    render(<TableSection el={autoTable} set={set} />);
    expect(screen.getByText("PREVIEW ROW (editor only)")).toBeTruthy();
    expect(screen.getByLabelText("Preview, Col1")).toBeTruthy();
    expect(screen.getByLabelText("Preview, Col2")).toBeTruthy();
  });

  it("renders auto mode info box", () => {
    const set = jest.fn();
    render(<TableSection el={autoTable} set={set} />);
    expect(screen.getByText(/CSV uploaded at export/)).toBeTruthy();
  });

  it("updates preview cell in auto mode", () => {
    const set = jest.fn();
    render(<TableSection el={autoTable} set={set} />);
    fireEvent.change(screen.getByLabelText("Preview, Col1"), { target: { value: "newVal" } });
    expect(set).toHaveBeenCalledWith("rows", [["newVal", "preview2"]]);
  });

  it("defaults to manual mode when mode is undefined", () => {
    const set = jest.fn();
    render(<TableSection el={tableNoMode} set={set} />);
    // Should show ROWS section (manual mode)
    expect(screen.getByText("ROWS")).toBeTruthy();
  });

  it("auto switch with no rows adds blank row", () => {
    const set = jest.fn();
    render(<TableSection el={emptyTable} set={set} />);
    fireEvent.click(screen.getByText("Auto CSV"));
    expect(set).toHaveBeenCalledWith("mode", "auto");
    expect(set).toHaveBeenCalledWith("rows", [["", ""]]);
  });

  it("does not show add row in auto mode", () => {
    const set = jest.fn();
    render(<TableSection el={autoTable} set={set} />);
    expect(screen.queryByText("+ Add Row")).toBeNull();
  });

  it("does not show delete row buttons in auto mode", () => {
    const set = jest.fn();
    render(<TableSection el={autoTable} set={set} />);
    expect(screen.queryByLabelText("Delete row 1")).toBeNull();
  });

  it("renders empty rows in manual mode", () => {
    const set = jest.fn();
    render(<TableSection el={emptyTable} set={set} />);
    expect(screen.getByText("ROWS")).toBeTruthy();
    expect(screen.getByText("+ Add Row")).toBeTruthy();
  });
});
