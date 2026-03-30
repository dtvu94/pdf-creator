/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { WizardResult } from "../types";
import type { ChartElement } from "@/types/template";

const mockDispose = jest.fn();
const mockSetOption = jest.fn();
const mockInit = jest.fn(() => ({
  setOption: mockSetOption,
  dispose: mockDispose,
  getDataURL: jest.fn(() => "data:image/png;base64,abc"),
}));

jest.mock("echarts", () => ({
  init: (...args: unknown[]) => mockInit(...args),
}));

jest.mock("../utils", () => ({
  renderChartImage: jest.fn(() => Promise.resolve("data:image/png;base64,rendered")),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ChartStep } = require("../ChartStep");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderChartImage } = require("../utils");

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

function makeChart(option: Record<string, unknown> = {}): ChartElement {
  return {
    id: "chart-1",
    type: "chart",
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    option,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── 1. Renders blank chart ──────────────────────────────────────────────────

describe("ChartStep – blank chart", () => {
  it("shows 'Blank' status when option is empty", () => {
    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );
    expect(screen.getByText(/Blank/)).toBeTruthy();
  });
});

// ── 2. Renders pre-configured chart ─────────────────────────────────────────

describe("ChartStep – pre-configured chart", () => {
  it("shows 'Pre-configured' status and populates textarea with JSON", () => {
    const option = { xAxis: { type: "category" }, series: [{ type: "bar" }] };
    render(
      <ChartStep
        chart={makeChart(option)}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );
    expect(screen.getByText("Pre-configured")).toBeTruthy();
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe(JSON.stringify(option, null, 2));
  });
});

// ── 3. applyJson with valid JSON ────────────────────────────────────────────

describe("ChartStep – applyJson", () => {
  it("updates textarea and sets parsedOption with valid JSON", () => {
    const setReady = jest.fn();
    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={setReady}
      />,
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const validJson = '{"xAxis":{"type":"value"}}';
    fireEvent.change(textarea, { target: { value: validJson } });
    expect(textarea.value).toBe(validJson);
    // No error message visible
    expect(screen.queryByText(/Invalid JSON/)).toBeNull();
  });

  // ── 4. applyJson with invalid JSON ──────────────────────────────────────

  it("shows error message with invalid JSON", () => {
    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "{bad json" } });
    expect(screen.getByText(/Invalid JSON/)).toBeTruthy();
  });

  // ── 5. applyJson with empty/whitespace text ────────────────────────────

  it("clears parsedOption and error when text is empty or whitespace", () => {
    const setReady = jest.fn();
    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={setReady}
      />,
    );
    const textarea = screen.getByRole("textbox");
    // First set invalid JSON to trigger error
    fireEvent.change(textarea, { target: { value: "{bad" } });
    expect(screen.getByText(/Invalid JSON/)).toBeTruthy();
    // Then clear
    fireEvent.change(textarea, { target: { value: "   " } });
    expect(screen.queryByText(/Invalid JSON/)).toBeNull();
  });
});

// ── 6. handleFileUpload with file ───────────────────────────────────────────

describe("ChartStep – file upload", () => {
  it("applies JSON from uploaded file content", async () => {
    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );
    const jsonContent = '{"series":[{"type":"line"}]}';
    const file = new File([jsonContent], "chart.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent) });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe(jsonContent);
  });

  // ── 7. handleFileUpload with no file ────────────────────────────────────

  it("does nothing when no file is selected", async () => {
    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const before = textarea.value;

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });

    expect(textarea.value).toBe(before);
  });
});

// ── 8. setReady called correctly ────────────────────────────────────────────

describe("ChartStep – setReady", () => {
  it("calls setReady(true) when parsedOption is valid, false when null", () => {
    const setReady = jest.fn();
    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={setReady}
      />,
    );
    // Initially blank, so parsedOption is null
    expect(setReady).toHaveBeenCalledWith(false);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    expect(setReady).toHaveBeenCalledWith(true);
  });
});

// ── 9. registerBeforeNext — returns true and sets chartImages ───────────────

describe("ChartStep – registerBeforeNext", () => {
  it("handler returns true and populates chartImages when option is valid", async () => {
    const resultRef = makeResultRef();
    let beforeNextFn: () => Promise<boolean> = async () => false;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      beforeNextFn = fn;
    });

    render(
      <ChartStep
        chart={makeChart({ xAxis: { type: "value" } })}
        active={false}
        resultRef={resultRef}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
      />,
    );

    expect(registerBeforeNext).toHaveBeenCalled();
    const result = await beforeNextFn();
    expect(result).toBe(true);
    expect(renderChartImage).toHaveBeenCalledWith({ xAxis: { type: "value" } }, 400, 300);
    expect(resultRef.current.chartImages.get("chart-1")).toBe("data:image/png;base64,rendered");
  });

  // ── 10. registerBeforeNext — returns false when no parsedOption ──────────

  it("handler returns false when parsedOption is null", async () => {
    let beforeNextFn: () => Promise<boolean> = async () => true;
    const registerBeforeNext = jest.fn((fn: () => Promise<boolean>) => {
      beforeNextFn = fn;
    });

    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={registerBeforeNext}
        setReady={jest.fn()}
      />,
    );

    const result = await beforeNextFn();
    expect(result).toBe(false);
    expect(renderChartImage).not.toHaveBeenCalled();
  });
});

// ── 11. ECharts preview init/dispose ────────────────────────────────────────

describe("ChartStep – ECharts preview", () => {
  it("initializes echarts when active with valid option", async () => {
    const option = { xAxis: { type: "value" } };
    render(
      <ChartStep
        chart={makeChart(option)}
        active={true}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockInit).toHaveBeenCalled();
    });
    expect(mockSetOption).toHaveBeenCalledWith(option);
  });

  it("does not initialize echarts when not active", async () => {
    render(
      <ChartStep
        chart={makeChart({ xAxis: { type: "value" } })}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );

    // Give time for any async import to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(mockInit).not.toHaveBeenCalled();
  });

  // ── 12. Disposes old chart before creating new one ──────────────────────

  it("disposes old chart instance before creating a new one on option change", async () => {
    const option1 = { xAxis: { type: "value" } };
    const option2 = { xAxis: { type: "category" } };

    render(
      <ChartStep
        chart={makeChart(option1)}
        active={true}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockInit).toHaveBeenCalledTimes(1);
    });

    // Change option by typing new JSON
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: JSON.stringify(option2) } });

    await waitFor(() => {
      expect(mockDispose).toHaveBeenCalled();
    });
  });
});

// ── 13. Cleanup on unmount ──────────────────────────────────────────────────

describe("ChartStep – cleanup on unmount", () => {
  it("disposes chart instance on unmount", async () => {
    const { unmount } = render(
      <ChartStep
        chart={makeChart({ xAxis: { type: "value" } })}
        active={true}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockInit).toHaveBeenCalled();
    });

    mockDispose.mockClear();
    unmount();
    expect(mockDispose).toHaveBeenCalled();
  });
});

// ── 14. Upload button clicks hidden file input ─────────────────────────────

describe("ChartStep – upload button", () => {
  it("clicks hidden file input when upload button is pressed", () => {
    render(
      <ChartStep
        chart={makeChart({})}
        active={false}
        resultRef={makeResultRef()}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, "click");

    const uploadBtn = screen.getByText(/Upload JSON/);
    fireEvent.click(uploadBtn);

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("does nothing when files is null on file upload", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(
      <ChartStep
        chart={makeChart({})}
        active={true}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={setReady}
      />,
    );
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: null } });
    // Should not crash or update anything
  });
});
