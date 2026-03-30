/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { WizardResult } from "../types";
import type { RepeaterElement, ChartElement } from "@/types/template";

// Mock echarts
jest.mock("echarts", () => ({
  init: jest.fn(() => ({
    setOption: jest.fn(),
    dispose: jest.fn(),
    getDataURL: jest.fn(() => "data:image/png;base64,abc"),
  })),
}));

// Mock utils
jest.mock("../utils", () => ({
  parseCsv: jest.fn((text: string) =>
    text
      .trim()
      .split(/\r?\n/)
      .filter((l: string) => l.trim())
      .map((l: string) => l.split(",").map((c: string) => c.trim()))
  ),
  getExpectedFields: jest.fn(() => ["sensor_name"]),
  buildRepeaterChartOption: jest.fn(() => ({ type: "line" })),
  renderChartImage: jest.fn(() => Promise.resolve("data:image/png;base64,chart")),
}));

jest.mock("../../FontUploadList", () => ({
  FontUploadList: () => <div data-testid="font-upload" />,
}));

jest.mock("@/lib/utils", () => ({
  downloadJson: jest.fn(),
  parseTableData: jest.fn(() => ({ headers: [], rows: [] })),
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderChartImage, buildRepeaterChartOption, parseCsv } = require("../utils");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RepeaterStep } = require("../RepeaterStep");

// A chart element with seriesDataField for chart-rendering tests.
const chartEl: ChartElement = {
  id: "ch1",
  x: 0,
  y: 0,
  type: "chart",
  width: 200,
  height: 100,
  option: {},
  seriesDataField: "chartData",
};

// A chart element without seriesDataField.
const chartElNoSeries: ChartElement = {
  id: "ch2",
  x: 0,
  y: 0,
  type: "chart",
  width: 200,
  height: 100,
  option: {},
};

function makeRepeater(cardElements: unknown[] = []): RepeaterElement {
  return {
    id: "rep1",
    x: 0,
    y: 0,
    type: "repeater",
    label: "Sensors",
    dataKey: "sensors",
    width: 500,
    cardWidth: 200,
    cardHeight: 100,
    itemsPerRow: 2,
    gap: 10,
    cardElements: cardElements as RepeaterElement["cardElements"],
  };
}

describe("RepeaterStep – beforeNext with chart rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    renderChartImage.mockResolvedValue("data:image/png;base64,chart");
    buildRepeaterChartOption.mockReturnValue({ type: "line" });
  });

  it("renders chart images for items with seriesDataField data", async () => {
    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });

    const resultRef = makeResultRef();
    const repeater = makeRepeater([chartEl]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    // Parse JSON items that include chartData
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([
          { sensor_name: "A", chartData: "[1,2,3]" },
          { sensor_name: "B", chartData: "[4,5,6]" },
        ]),
      },
    });

    expect(screen.getByText("2 items parsed")).toBeTruthy();
    expect(registeredHandler).not.toBeNull();

    // Invoke the beforeNext handler
    let result: boolean | undefined;
    await act(async () => {
      result = await registeredHandler!();
    });

    expect(result).toBe(true);
    expect(buildRepeaterChartOption).toHaveBeenCalledTimes(2);
    expect(renderChartImage).toHaveBeenCalledTimes(2);

    // Verify chart images are set on the items
    const items = resultRef.current.repeaterItems.get("rep1");
    expect(items).toBeDefined();
    expect(items!.length).toBe(2);
    expect(items![0].chartImages?.["ch1"]).toBe("data:image/png;base64,chart");
    expect(items![1].chartImages?.["ch1"]).toBe("data:image/png;base64,chart");
  });

  it("skips chart rendering when chart elements have no seriesDataField", async () => {
    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });

    const resultRef = makeResultRef();
    const repeater = makeRepeater([chartElNoSeries]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ sensor_name: "A" }]) },
    });

    let result: boolean | undefined;
    await act(async () => {
      result = await registeredHandler!();
    });

    expect(result).toBe(true);
    expect(renderChartImage).not.toHaveBeenCalled();
    // Items should be stored without chartImages
    const items = resultRef.current.repeaterItems.get("rep1");
    expect(items).toBeDefined();
    expect(items!.length).toBe(1);
  });

  it("returns false when no items are parsed", async () => {
    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });

    const resultRef = makeResultRef();
    const repeater = makeRepeater([chartEl]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    // Do not enter any data
    let result: boolean | undefined;
    await act(async () => {
      result = await registeredHandler!();
    });

    expect(result).toBe(false);
  });

  it("skips items that have no series data for the chart field", async () => {
    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });

    const resultRef = makeResultRef();
    const repeater = makeRepeater([chartEl]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    // One item has chartData, one does not
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([
          { sensor_name: "A", chartData: "[1,2,3]" },
          { sensor_name: "B" }, // no chartData
        ]),
      },
    });

    let result: boolean | undefined;
    await act(async () => {
      result = await registeredHandler!();
    });

    expect(result).toBe(true);
    // Only one item should have been rendered
    expect(renderChartImage).toHaveBeenCalledTimes(1);

    const items = resultRef.current.repeaterItems.get("rep1");
    expect(items![0].chartImages?.["ch1"]).toBe("data:image/png;base64,chart");
    // The second item should be pushed without chartImages
    expect(items![1].chartImages).toBeUndefined();
  });

  it("pushes item without chartImages when chart rendering fails (catch block)", async () => {
    renderChartImage.mockRejectedValue(new Error("render failed"));

    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });

    const resultRef = makeResultRef();
    const repeater = makeRepeater([chartEl]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([{ sensor_name: "A", chartData: "[1,2,3]" }]),
      },
    });

    let result: boolean | undefined;
    await act(async () => {
      result = await registeredHandler!();
    });

    expect(result).toBe(true);
    const items = resultRef.current.repeaterItems.get("rep1");
    expect(items).toBeDefined();
    expect(items!.length).toBe(1);
    // Item should be pushed without chartImages since rendering failed
    expect(items![0].chartImages).toBeUndefined();
  });

  it("handles item with invalid JSON in seriesDataField (catch block)", async () => {
    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });

    const resultRef = makeResultRef();
    const repeater = makeRepeater([chartEl]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([{ sensor_name: "A", chartData: "not-valid-json" }]),
      },
    });

    let result: boolean | undefined;
    await act(async () => {
      result = await registeredHandler!();
    });

    expect(result).toBe(true);
    const items = resultRef.current.repeaterItems.get("rep1");
    expect(items!.length).toBe(1);
    // Pushed without chartImages due to JSON.parse failure
    expect(items![0].chartImages).toBeUndefined();
  });

  it("calls setProcessingMsg with progress during rendering", async () => {
    let registeredHandler: (() => Promise<boolean>) | null = null;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      registeredHandler = fn;
    });
    const setProcessingMsg = jest.fn();

    const resultRef = makeResultRef();
    const repeater = makeRepeater([chartEl]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
        setProcessingMsg={setProcessingMsg}
      />
    );

    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([
          { sensor_name: "A", chartData: "[1]" },
          { sensor_name: "B", chartData: "[2]" },
        ]),
      },
    });

    await act(async () => {
      await registeredHandler!();
    });

    // Should have been called with progress messages
    expect(setProcessingMsg).toHaveBeenCalledWith(
      expect.stringContaining("Rendering chart")
    );
  });
});

describe("RepeaterStep – file upload handler", () => {
  it("parses file content via handleFile", async () => {
    const resultRef = makeResultRef();
    const repeater = makeRepeater([]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    const fileContent = JSON.stringify([{ sensor_name: "From File" }]);
    const file = new File([fileContent], "data.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(fileContent),
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText("1 item parsed")).toBeTruthy();
    });
  });

  it("no-op when no file is selected", async () => {
    const resultRef = makeResultRef();
    const repeater = makeRepeater([]);

    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });

    // Should not crash and should still show empty preview
    expect(screen.getByText("Parsed items will appear here")).toBeTruthy();
  });
});

describe("RepeaterStep – CSV parse error (catch block)", () => {
  it("shows error when parseCsv throws", () => {
    parseCsv.mockImplementationOnce(() => {
      throw new Error("CSV parse failure");
    });

    const resultRef = makeResultRef();
    const repeater = makeRepeater([]);

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
    // Input that does not start with "[" so it goes to CSV path
    fireEvent.change(textarea, { target: { value: "some,csv\ndata,here" } });

    expect(
      screen.getByText("Could not parse input as JSON array or CSV")
    ).toBeTruthy();
  });

  it("does nothing when files is null on file upload", () => {
    const resultRef = makeResultRef();
    const repeater = makeRepeater([]);
    render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[fileInputs.length - 1] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: null } });
    // Should not crash
  });

  it("shows preview truncation for >5 items", () => {
    const resultRef = makeResultRef();
    const repeater = makeRepeater([]);
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
    const items = Array.from({ length: 8 }, (_, i) => ({ sensor_name: `S${i}` }));
    fireEvent.change(textarea, { target: { value: JSON.stringify(items) } });
    expect(screen.getByText(/first 5 of 8/)).toBeTruthy();
  });

  it("downloads sample CSV with no expected fields", () => {
    globalThis.URL.createObjectURL = jest.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getExpectedFields } = require("../utils");
    getExpectedFields.mockReturnValueOnce([]);
    const resultRef = makeResultRef();
    const repeater = makeRepeater([]);
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

  it("CSV row with fewer columns than header gets empty fallback", () => {
    const resultRef = makeResultRef();
    const repeater = makeRepeater([]);
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
    // CSV where second row has fewer columns
    fireEvent.change(textarea, { target: { value: "name,value\nAlice" } });
    expect(screen.getByText("1 item parsed")).toBeTruthy();
  });
});
