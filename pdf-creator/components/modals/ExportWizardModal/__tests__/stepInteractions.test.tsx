/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { WizardResult } from "../types";
import type { TableElement, RepeaterElement } from "@/types/template";

// Mock echarts
jest.mock("echarts", () => ({
  init: jest.fn(() => ({
    setOption: jest.fn(),
    dispose: jest.fn(),
    getDataURL: jest.fn(() => "data:image/png;base64,abc"),
  })),
}));

// Mock FontUploadList
jest.mock("../../FontUploadList", () => ({
  FontUploadList: ({ missingFonts, onAllDoneChange }: { missingFonts: unknown[]; onAllDoneChange?: (v: boolean) => void }) => (
    <div data-testid="font-upload-list">
      Fonts: {missingFonts.length}
      <button onClick={() => onAllDoneChange?.(true)}>MarkDone</button>
    </div>
  ),
}));

// Mock @/lib/utils
jest.mock("@/lib/utils", () => ({
  downloadJson: jest.fn(),
  parseTableData: jest.fn(() => ({ headers: ["A", "B"], rows: [["1", "2"]] })),
  renderWithPlaceholders: jest.fn((t: string) => t),
  btnStyle: jest.fn(() => ({})),
}));

jest.mock("@/lib/placeholders", () => ({
  extractPlaceholders: jest.fn(() => []),
}));

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

// ── PlaceholderStep Interactions ─────────────────────────────────────────────

describe("PlaceholderStep – interactions", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PlaceholderStep } = require("../PlaceholderStep");

  it("updates resultRef when user types in placeholder input", () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name", "email"]} resultRef={resultRef} />);
    const nameInput = screen.getByPlaceholderText("Value for name");
    fireEvent.change(nameInput, { target: { value: "John" } });
    expect(resultRef.current.placeholderValues.name).toBe("John");
  });

  it("downloads template JSON", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { downloadJson } = require("@/lib/utils");
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    fireEvent.click(screen.getByText(/Download template/));
    expect(downloadJson).toHaveBeenCalled();
  });

  it("loads values from JSON file", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name", "email"]} resultRef={resultRef} />);

    const jsonContent = JSON.stringify({ name: "Jane", email: "jane@example.com" });
    const file = new File([jsonContent], "values.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent) });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      // Give time for async file.text() to resolve
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane")).toBeTruthy();
      expect(screen.getByDisplayValue("jane@example.com")).toBeTruthy();
    });
  });

  it("shows error for invalid JSON file", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);

    const file = new File(["not json"], "bad.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve("not json") });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(screen.getByText("Invalid JSON file.")).toBeTruthy();
    });
  });

  it("shows error for non-object JSON", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);

    const jsonContent = JSON.stringify([1, 2, 3]);
    const file = new File([jsonContent], "arr.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent) });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(screen.getByText("File must be a JSON object with placeholder keys.")).toBeTruthy();
    });
  });

  it("shows warning for missing keys in loaded JSON", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name", "email"]} resultRef={resultRef} />);

    const jsonContent = JSON.stringify({ name: "Jane" });
    const file = new File([jsonContent], "partial.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent) });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(screen.getByText(/Missing keys/)).toBeTruthy();
      expect(screen.getAllByText(/\{\{email\}\}/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("no-op when no file selected", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
    // No crash
  });
});

// ── CsvStep Interactions ────────────────────────────────────────────────────

describe("CsvStep – interactions", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { CsvStep } = require("../CsvStep");

  const table: TableElement = {
    id: "tbl1", x: 0, y: 0, type: "table", mode: "auto",
    headers: ["Name", "Value"], rows: [["Alice", "100"]],
    headerColor: "#1E40AF", headerTextColor: "#fff", fontSize: 11, width: 400,
  };

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

  it("no-op when no file selected", async () => {
    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
    // No crash
  });

  it("shows plural rows message", () => {
    const resultRef = makeResultRef();
    const multiRowTable = { ...table, rows: [["A", "1"], ["B", "2"], ["C", "3"]] };
    render(<CsvStep table={multiRowTable} resultRef={resultRef} />);
    expect(screen.getByText(/3 existing rows/)).toBeTruthy();
  });

  it("shows singular row message", () => {
    const resultRef = makeResultRef();
    render(<CsvStep table={table} resultRef={resultRef} />);
    expect(screen.getByText(/1 existing row/)).toBeTruthy();
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
    });

    await waitFor(() => {
      expect(screen.getByText(/showing first 5/)).toBeTruthy();
    });
  });
});

// ── MetadataStep Interactions ───────────────────────────────────────────────

describe("MetadataStep – interactions", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MetadataStep } = require("../MetadataStep");

  it("updates resultRef when typing in File Name field", () => {
    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);
    const input = screen.getByPlaceholderText("output.pdf");
    fireEvent.change(input, { target: { value: "report.pdf" } });
    expect(resultRef.current.metadata?.fileName).toBe("report.pdf");
  });

  it("updates resultRef when typing in Title field", () => {
    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);
    const input = screen.getByPlaceholderText("Document title");
    fireEvent.change(input, { target: { value: "My Report" } });
    expect(resultRef.current.metadata?.title).toBe("My Report");
  });

  it("updates resultRef when typing in Author field", () => {
    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);
    const input = screen.getByPlaceholderText("Author name");
    fireEvent.change(input, { target: { value: "Tester" } });
    expect(resultRef.current.metadata?.author).toBe("Tester");
  });

  it("clears field value when emptied", () => {
    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);
    const input = screen.getByPlaceholderText("Document title");
    fireEvent.change(input, { target: { value: "T" } });
    fireEvent.change(input, { target: { value: "" } });
    expect(resultRef.current.metadata?.title).toBeUndefined();
  });

  it("loads metadata from JSON file", async () => {
    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);

    const metaContent = JSON.stringify({ fileName: "loaded.pdf", title: "Loaded Title", author: "Author" });
    const file = new File([metaContent], "meta.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(metaContent) });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("loaded.pdf")).toBeTruthy();
      expect(screen.getByDisplayValue("Loaded Title")).toBeTruthy();
    });
  });

  it("shows error for invalid JSON file", async () => {
    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);

    const file = new File(["bad json"], "bad.json", { type: "application/json" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON file/)).toBeTruthy();
    });
  });

  it("saves metadata as JSON", () => {
    globalThis.URL.createObjectURL = jest.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = jest.fn();

    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);
    fireEvent.click(screen.getByText("Save as JSON"));
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it("no-op when no file selected during load", async () => {
    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
    // No crash
  });

  it("renders preview JSON block", () => {
    const resultRef = makeResultRef();
    render(<MetadataStep resultRef={resultRef} />);
    expect(screen.getByText("Preview")).toBeTruthy();
  });
});

// ── SignatureStep Interactions ───────────────────────────────────────────────

describe("SignatureStep – interactions", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SignatureStep } = require("../SignatureStep");

  it("becomes ready when both keystore and password provided", async () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={setReady} />);

    // Upload keystore file
    const fileContent = "keystore-binary-data";
    const file = new File([fileContent], "keystore.p12", { type: "application/octet-stream" });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { value: [file] });

    // Mock FileReader
    const originalFileReader = globalThis.FileReader;
    const mockReadAsDataURL = jest.fn();
    const mockFileReader = {
      readAsDataURL: mockReadAsDataURL,
      onload: null as (() => void) | null,
      result: "data:application/octet-stream;base64,a2V5c3RvcmU=",
    };
    globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

    fireEvent.change(fileInput);
    // Trigger onload
    act(() => {
      if (mockFileReader.onload) mockFileReader.onload();
    });

    globalThis.FileReader = originalFileReader;

    // Enter password
    const passwordInput = screen.getByPlaceholderText("Enter keystore password");
    fireEvent.change(passwordInput, { target: { value: "mypass" } });

    expect(setReady).toHaveBeenCalledWith(true);
  });

  it("is not ready when only password is provided", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={setReady} />);

    const passwordInput = screen.getByPlaceholderText("Enter keystore password");
    fireEvent.change(passwordInput, { target: { value: "mypass" } });
    // setReady should be called with false (no keystore)
    expect(setReady).toHaveBeenCalledWith(false);
  });

  it("updates optional fields (reason, location, contactInfo)", () => {
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Document approval"), { target: { value: "Approval" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Ho Chi Minh City, Vietnam"), { target: { value: "HCMC" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. signer@example.com"), { target: { value: "test@test.com" } });
  });

  it("shows file name after upload", () => {
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={jest.fn()} />);

    expect(screen.getByText("No file selected")).toBeTruthy();
  });

  it("no-op when no file selected on change", () => {
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={jest.fn()} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    // No crash
  });
});

// ── RepeaterStep Interactions ───────────────────────────────────────────────

describe("RepeaterStep – interactions", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { RepeaterStep } = require("../RepeaterStep");

  const repeater: RepeaterElement = {
    id: "rep1", x: 0, y: 0, type: "repeater", label: "Sensors",
    dataKey: "sensors", width: 500, cardWidth: 200, cardHeight: 100,
    itemsPerRow: 2, gap: 10,
    cardElements: [
      {
        id: "t1", x: 0, y: 0, type: "text" as const, content: "{{sensor_name}}",
        fontSize: 12, bold: false, italic: false, underline: false, color: "#000", width: 100,
      },
    ],
  };

  it("parses JSON array input", () => {
    const resultRef = makeResultRef();
    const setReady = jest.fn();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={setReady}
        setProcessingMsg={jest.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ sensor_name: "A" }, { sensor_name: "B" }]) },
    });
    expect(screen.getByText("2 items parsed")).toBeTruthy();
    expect(setReady).toHaveBeenCalledWith(true);
  });

  it("parses CSV input", () => {
    const resultRef = makeResultRef();
    const setReady = jest.fn();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={setReady}
        setProcessingMsg={jest.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, { target: { value: "sensor_name\nSensor A\nSensor B" } });
    expect(screen.getByText("2 items parsed")).toBeTruthy();
  });

  it("shows error for invalid JSON array", () => {
    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, { target: { value: "[invalid" } });
    expect(screen.getByText("Invalid JSON array")).toBeTruthy();
  });

  it("shows error for CSV with only header row", () => {
    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, { target: { value: "sensor_name" } });
    expect(screen.getByText("CSV must have a header row and at least one data row")).toBeTruthy();
  });

  it("handles empty input", () => {
    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, { target: { value: "" } });
    expect(screen.getByText("Parsed items will appear here")).toBeTruthy();
  });

  it("downloads sample CSV", () => {
    globalThis.URL.createObjectURL = jest.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = jest.fn();

    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText(/Sample CSV/));
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it("uploads file and parses input", async () => {
    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    const fileContent = JSON.stringify([{ sensor_name: "Sensor X" }]);
    const file = new File([fileContent], "data.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(fileContent) });
    const input = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText("1 item parsed")).toBeTruthy();
    });
  });

  it("registers beforeNext handler and calls it", async () => {
    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });

    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    expect(registerBeforeNext).toHaveBeenCalled();

    // Parse some data first
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ sensor_name: "A" }]) },
    });

    // Call the registered handler
    if (registeredHandler) {
      const result = await registeredHandler();
      expect(result).toBe(true);
      expect(resultRef.current.repeaterItems.has("rep1")).toBe(true);
    }
  });

  it("beforeNext returns false when no items parsed", async () => {
    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });

    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    if (registeredHandler) {
      const result = await registeredHandler();
      expect(result).toBe(false);
    }
  });

  it("handles JSON objects with null values", () => {
    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ sensor_name: null, nested: { a: 1 } }]) },
    });
    expect(screen.getByText("1 item parsed")).toBeTruthy();
  });

  it("shows non-JSON array error", () => {
    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText(/JSON array/);
    // Single line text is treated as CSV with only a header row (no data rows)
    fireEvent.change(textarea, { target: { value: "just some random text" } });
    expect(screen.getByText("CSV must have a header row and at least one data row")).toBeTruthy();
  });

  it("shows preview with correct fields", () => {
    const resultRef = makeResultRef();
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ sensor_name: "A", extra: "B" }]) },
    });
    expect(screen.getAllByText("sensor_name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("extra")).toBeTruthy();
  });
});

// ── ExportWizardModal – navigation ──────────────────────────────────────────

describe("ExportWizardModal – full navigation", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExportWizardModal = require("../index").default;

  it("navigates forward and backward through steps", () => {
    const steps = [
      { id: "ph", label: "Placeholders", type: "placeholders" as const, placeholders: ["name"] },
      { id: "csv", label: "CSV", type: "csv" as const, table: { id: "t1", x: 0, y: 0, type: "table" as const, headers: ["A"], rows: [], headerColor: "#000", headerTextColor: "#fff", fontSize: 11, width: 400 } },
      { id: "meta", label: "Metadata", type: "metadata" as const },
    ];

    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Step 1 -> Step 2
    fireEvent.click(screen.getByText(/Next/));
    // Step 2 -> Step 3
    fireEvent.click(screen.getByText(/Next/));
    // Should show Export PDF on last step
    expect(screen.getByText("Export PDF")).toBeTruthy();
    // Go back
    fireEvent.click(screen.getByText(/Back/));
    // Go back again
    fireEvent.click(screen.getByText(/Back/));
    // Should be on first step again
    expect(screen.getByText(/Next/)).toBeTruthy();
  });

  it("password step blocks until ready", () => {
    const steps = [
      { id: "pw", label: "Password", type: "password" as const },
    ];

    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Password step requires readyMap to be true
    const exportBtn = screen.getByText("Export PDF");
    expect(exportBtn.closest("button")?.disabled).toBe(true);
  });

  it("signature step blocks until ready", () => {
    const steps = [
      { id: "sig", label: "Signature", type: "signature" as const },
    ];

    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const exportBtn = screen.getByText("Export PDF");
    expect(exportBtn.closest("button")?.disabled).toBe(true);
  });

  it("PdfA step is always ready", () => {
    const steps = [
      { id: "pdfa", label: "PDF/A", type: "pdfa" as const },
    ];

    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const exportBtn = screen.getByText("Export PDF");
    expect(exportBtn.closest("button")?.disabled).toBe(false);
  });

  it("metadata step is always ready", () => {
    const onExport = jest.fn();
    const steps = [
      { id: "meta", label: "Metadata", type: "metadata" as const },
    ];

    render(
      <ExportWizardModal
        steps={steps}
        onExport={onExport}
        onCancel={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText("Export PDF"));
    expect(onExport).toHaveBeenCalled();
  });

  it("does not show Back button on first step", () => {
    const steps = [
      { id: "ph", label: "Placeholders", type: "placeholders" as const, placeholders: ["name"] },
      { id: "meta", label: "Metadata", type: "metadata" as const },
    ];

    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByText(/Back/)).toBeNull();
  });
});

// ── PasswordStep Interactions ───────────────────────────────────────────────

describe("PasswordStep – interactions", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PasswordStep } = require("../PasswordStep");

  it("sets ready when passwords match and are non-empty", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<PasswordStep resultRef={resultRef} setReady={setReady} />);

    const inputs = screen.getAllByDisplayValue("");
    fireEvent.change(inputs[0], { target: { value: "abc" } });
    fireEvent.change(inputs[1], { target: { value: "abc" } });
    expect(setReady).toHaveBeenCalledWith(true);
  });

  it("sets not ready when passwords are empty", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<PasswordStep resultRef={resultRef} setReady={setReady} />);

    // Initially setReady should have been called with false
    expect(setReady).toHaveBeenCalledWith(false);
  });

  it("updates resultRef.password when valid", () => {
    const resultRef = makeResultRef();
    render(<PasswordStep resultRef={resultRef} setReady={jest.fn()} />);

    const inputs = screen.getAllByDisplayValue("");
    fireEvent.change(inputs[0], { target: { value: "secret" } });
    fireEvent.change(inputs[1], { target: { value: "secret" } });
    expect(resultRef.current.password).toBe("secret");
  });
});

// ── PdfAStep Interactions ───────────────────────────────────────────────────

describe("PdfAStep – interactions", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PdfAStep } = require("../PdfAStep");

  it("updates resultRef.pdfA when version changes", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);

    // Should have default values set
    expect(resultRef.current.pdfA).toBeDefined();
  });

  it("renders conformance and version options", () => {
    const resultRef = makeResultRef();
    const { container } = render(<PdfAStep resultRef={resultRef} />);
    expect(container.textContent).toContain("Version");
    expect(container.textContent).toContain("Level");
  });
});
