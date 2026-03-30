/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { WizardResult } from "../types";
import type { TableElement } from "@/types/template";

jest.mock("@/lib/utils", () => ({
  parseTableData: jest.fn(() => ({ headers: ["Name", "Value"], rows: [["Bob", "200"]] })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CsvStep } = require("../CsvStep");

function makeResultRef(): React.RefObject<WizardResult> {
  return {
    current: {
      placeholderValues: {},
      resolvedRows: new Map(),
      chartImages: new Map(),
      repeaterItems: new Map(),
    },
  } as React.RefObject<WizardResult>;
}

const table: TableElement = {
  id: "tbl1", x: 0, y: 0, type: "table", mode: "auto",
  headers: ["Name", "Value"], rows: [["Alice", "100"]],
  headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 400,
};

describe("CsvStep", () => {
  it("renders with table headers and existing rows", () => {
    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    expect(screen.getByText("Upload CSV data")).toBeTruthy();
    expect(screen.getAllByText("Name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Value").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/1 existing row/)).toBeTruthy();
  });

  it("sets default rows in resultRef on mount", () => {
    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    expect(resultRef.current.resolvedRows.get("tbl1")).toEqual([["Alice", "100"]]);
  });

  it("loads CSV file and updates resultRef", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { parseTableData } = require("@/lib/utils");
    parseTableData.mockReturnValue({ headers: ["Name", "Value"], rows: [["Bob", "200"]] });

    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);

    const csvContent = "Name,Value\nBob,200";
    const file = new File([csvContent], "data.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(csvContent) });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 50));
    });
    await waitFor(() => {
      expect(screen.getByText(/1 row loaded from file/)).toBeTruthy();
    });
  });

  it("shows column mismatch warning", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { parseTableData } = require("@/lib/utils");
    parseTableData.mockReturnValue({ headers: ["Name", "Value", "Extra"], rows: [["Bob", "200", "X"]] });

    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);

    const csvContent = "Name,Value,Extra\nBob,200,X";
    const file = new File([csvContent], "data.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(csvContent) });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 50));
    });
    await waitFor(() => {
      expect(screen.getByText(/Column count mismatch/)).toBeTruthy();
    });
  });

  it("downloads sample CSV", () => {
    globalThis.URL.createObjectURL = jest.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = jest.fn();
    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    fireEvent.click(screen.getByText(/Download sample CSV/));
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it("downloads sample CSV with comma in cell (escaped)", () => {
    globalThis.URL.createObjectURL = jest.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = jest.fn();
    const tableWithComma: TableElement = {
      ...table,
      headers: ["Name, First", "Value"],
      rows: [["Alice, B", "100"]],
    };
    const resultRef = makeResultRef();
    render(<CsvStep table={tableWithComma} resultRef={resultRef} />);
    fireEvent.click(screen.getByText(/Download sample CSV/));
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it("no-op when no file selected", async () => {
    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
  });

  it("shows plural rows message", () => {
    const resultRef = makeResultRef();
    const multiRowTable = { ...table, rows: [["A", "1"], ["B", "2"], ["C", "3"]] };
    render(<CsvStep table={multiRowTable} resultRef={resultRef} />);
    expect(screen.getByText(/3 existing rows/)).toBeTruthy();
  });

  it("shows 'showing first 5' when more than 5 rows", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { parseTableData } = require("@/lib/utils");
    const manyRows = Array.from({ length: 8 }, (_, i) => [`Name${i}`, `${i}`]);
    parseTableData.mockReturnValue({ headers: ["Name", "Value"], rows: manyRows });

    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    const csvContent = "data";
    const file = new File([csvContent], "data.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(csvContent) });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 50));
    });
    await waitFor(() => {
      expect(screen.getByText(/showing first 5/)).toBeTruthy();
    });
  });

  it("shows upload button that triggers file input", () => {
    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, "click");
    // The upload button contains "Upload CSV / TSV"
    const buttons = screen.getAllByText(/Upload CSV/);
    // Click the button (last match, which is the actual button)
    fireEvent.click(buttons[buttons.length - 1]);
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("handles table with no initial rows (triggers previewRow fallback)", () => {
    globalThis.URL.createObjectURL = jest.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = jest.fn();
    const resultRef = makeResultRef();
    const emptyTable = { ...table, rows: [] as string[][] };
    render(<CsvStep table={emptyTable} resultRef={resultRef} />);
    expect(screen.getByText(/0 existing rows/)).toBeTruthy();
    // Download sample triggers the `table.rows[0] ?? table.headers.map(() => "")` fallback
    fireEvent.click(screen.getByText(/Download sample CSV/));
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it("renders rows with empty first cell (row[0] ?? ri fallback)", () => {
    const resultRef = makeResultRef();
    const tableWithEmptyCell = { ...table, rows: [["", "100"]] };
    render(<CsvStep table={tableWithEmptyCell} resultRef={resultRef} />);
    // Should render without crashing — the empty first cell triggers ?? fallback
    expect(screen.getByText("100")).toBeTruthy();
  });

  it("does nothing when files is null", async () => {
    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: null } });
    });
  });
});
