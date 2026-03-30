/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("lucide-react", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require("react");
  return new Proxy(
    {},
    {
      get: (_t: Record<string, unknown>, prop: string) => {
        if (prop === "__esModule") return true;
        return (props: Record<string, unknown>) =>
          R.createElement("span", { "data-testid": prop, ...props });
      },
    }
  );
});

jest.mock("@/lib/imageConvert", () => ({
  ensurePngSrc: jest.fn((s: string) => Promise.resolve(s)),
}));

// ── ImageSection Tests ──────────────────────────────────────────────────────

describe("ImageSection", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ImageSection = require("../ImageSection").default;

  it("renders without src (placeholder mode)", () => {
    const el = {
      id: "i1",
      x: 10,
      y: 20,
      type: "image" as const,
      label: "My Image",
      width: 200,
      height: 120,
      bgColor: "#DBEAFE",
    };
    const set = jest.fn();
    render(React.createElement(ImageSection, { el, set }));
    expect(screen.getByText("Image")).toBeTruthy();
    expect(screen.getByText("Placeholder label")).toBeTruthy();
    expect(screen.getByText("Placeholder background")).toBeTruthy();
  });

  it("renders with src (shows preview)", () => {
    const el = {
      id: "i1",
      x: 10,
      y: 20,
      type: "image" as const,
      label: "My Image",
      width: 200,
      height: 120,
      bgColor: "#DBEAFE",
      src: "https://example.com/img.png",
    };
    const set = jest.fn();
    render(React.createElement(ImageSection, { el, set }));
    expect(screen.getByAltText("preview")).toBeTruthy();
    // When src is set, label/bg fields are hidden
    expect(screen.queryByText("Placeholder label")).toBeNull();
  });

  it("renders with data URL src (shows uploaded file text)", () => {
    const el = {
      id: "i1",
      x: 10,
      y: 20,
      type: "image" as const,
      label: "Image",
      width: 200,
      height: 120,
      bgColor: "#DBEAFE",
      src: "data:image/png;base64,abc",
    };
    const set = jest.fn();
    render(React.createElement(ImageSection, { el, set }));
    expect(screen.getByPlaceholderText("Uploaded file")).toBeTruthy();
  });

  it("clears image on clear button click", () => {
    const el = {
      id: "i1",
      x: 10,
      y: 20,
      type: "image" as const,
      label: "Image",
      width: 200,
      height: 120,
      bgColor: "#DBEAFE",
      src: "https://example.com/img.png",
    };
    const set = jest.fn();
    render(React.createElement(ImageSection, { el, set }));
    fireEvent.click(screen.getByTitle("Clear image"));
    expect(set).toHaveBeenCalledWith("src", undefined);
  });

  it("updates src from URL input", () => {
    const el = {
      id: "i1",
      x: 10,
      y: 20,
      type: "image" as const,
      label: "Image",
      width: 200,
      height: 120,
      bgColor: "#DBEAFE",
    };
    const set = jest.fn();
    render(React.createElement(ImageSection, { el, set }));
    const urlInput = screen.getByPlaceholderText("https://\u2026");
    fireEvent.change(urlInput, {
      target: { value: "https://example.com/new.png" },
    });
    expect(set).toHaveBeenCalledWith("src", "https://example.com/new.png");
  });
});

// ── TableSection Tests ──────────────────────────────────────────────────────

describe("TableSection", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TableSection = require("../TableSection").default;

  const baseEl = {
    id: "tb1",
    x: 10,
    y: 20,
    type: "table" as const,
    headers: ["Col 1", "Col 2"],
    rows: [
      ["A", "B"],
      ["C", "D"],
    ],
    headerColor: "#1E40AF",
    headerTextColor: "#fff",
    fontSize: 11,
    width: 515,
    mode: "manual" as const,
  };

  it("renders in manual mode", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    expect(screen.getByText("Table")).toBeTruthy();
    expect(screen.getByText("Manual")).toBeTruthy();
    expect(screen.getByText("Auto CSV")).toBeTruthy();
    expect(screen.getByText("ROWS")).toBeTruthy();
  });

  it("renders header inputs", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    expect(screen.getByLabelText("Header 1")).toBeTruthy();
    expect(screen.getByLabelText("Header 2")).toBeTruthy();
  });

  it("renders row cells", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    expect(screen.getByLabelText("Row 1, Col 1")).toBeTruthy();
    expect(screen.getByLabelText("Row 1, Col 2")).toBeTruthy();
    expect(screen.getByLabelText("Row 2, Col 1")).toBeTruthy();
  });

  it("updates header value", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    fireEvent.change(screen.getByLabelText("Header 1"), {
      target: { value: "NewCol" },
    });
    expect(set).toHaveBeenCalledWith("headers", ["NewCol", "Col 2"]);
  });

  it("updates cell value", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    fireEvent.change(screen.getByLabelText("Row 1, Col 1"), {
      target: { value: "X" },
    });
    expect(set).toHaveBeenCalledWith("rows", [
      ["X", "B"],
      ["C", "D"],
    ]);
  });

  it("deletes a row", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    fireEvent.click(screen.getByLabelText("Delete row 1"));
    expect(set).toHaveBeenCalledWith("rows", [["C", "D"]]);
  });

  it("adds a row", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    fireEvent.click(screen.getByText("+ Add Row"));
    expect(set).toHaveBeenCalledWith("rows", [
      ["A", "B"],
      ["C", "D"],
      ["", ""],
    ]);
  });

  it("switches to auto mode", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    fireEvent.click(screen.getByText("Auto CSV"));
    expect(set).toHaveBeenCalledWith("mode", "auto");
  });

  it("renders in auto mode", () => {
    const autoEl = { ...baseEl, mode: "auto" as const };
    const set = jest.fn();
    render(React.createElement(TableSection, { el: autoEl, set }));
    expect(screen.getByText("PREVIEW ROW (editor only)")).toBeTruthy();
    expect(
      screen.getByText(
        /CSV uploaded at export/
      )
    ).toBeTruthy();
  });

  it("renders auto mode preview row cells", () => {
    const autoEl = { ...baseEl, mode: "auto" as const };
    const set = jest.fn();
    render(React.createElement(TableSection, { el: autoEl, set }));
    expect(screen.getByLabelText("Preview, Col 1")).toBeTruthy();
    expect(screen.getByLabelText("Preview, Col 2")).toBeTruthy();
  });

  it("switches to manual mode", () => {
    const autoEl = { ...baseEl, mode: "auto" as const };
    const set = jest.fn();
    render(React.createElement(TableSection, { el: autoEl, set }));
    fireEvent.click(screen.getByText("Manual"));
    expect(set).toHaveBeenCalledWith("mode", "manual");
  });

  it("switch to auto with no rows adds a blank row", () => {
    const noRowsEl = { ...baseEl, rows: [] as string[][] };
    const set = jest.fn();
    render(React.createElement(TableSection, { el: noRowsEl, set }));
    fireEvent.click(screen.getByText("Auto CSV"));
    // Should call set with mode and then rows
    expect(set).toHaveBeenCalledWith("mode", "auto");
    expect(set).toHaveBeenCalledWith("rows", [["", ""]]);
  });

  it("updates font size", () => {
    const set = jest.fn();
    render(React.createElement(TableSection, { el: baseEl, set }));
    const fontSizeInput = screen.getByDisplayValue("11");
    fireEvent.change(fontSizeInput, { target: { value: "14" } });
    expect(set).toHaveBeenCalledWith("fontSize", 14);
  });
});

// ── ChartSection Tests ──────────────────────────────────────────────────────

describe("ChartSection", () => {
  // Mock echarts to prevent actual rendering
  jest.mock("echarts", () => ({
    init: jest.fn(() => ({
      setOption: jest.fn(),
      dispose: jest.fn(),
    })),
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ChartSection = require("../ChartSection").default;

  it("renders with empty option (no chart placeholder)", () => {
    const el = {
      id: "ch1",
      x: 10,
      y: 20,
      type: "chart" as const,
      width: 400,
      height: 250,
      option: {},
    };
    const set = jest.fn();
    render(React.createElement(ChartSection, { el, set }));
    expect(screen.getByText("Chart (ECharts option)")).toBeTruthy();
    expect(
      screen.getByText(/No option configured/)
    ).toBeTruthy();
  });

  it("renders with non-empty option (has preview)", () => {
    const el = {
      id: "ch1",
      x: 10,
      y: 20,
      type: "chart" as const,
      width: 400,
      height: 250,
      option: { xAxis: {}, yAxis: {} },
    };
    const set = jest.fn();
    render(React.createElement(ChartSection, { el, set }));
    expect(screen.getByText("Chart (ECharts option)")).toBeTruthy();
    // Should not show the "no option" text
    expect(screen.queryByText(/No option configured/)).toBeNull();
  });

  it("renders JSON textarea with formatted option", () => {
    const option = { xAxis: { type: "category" } };
    const el = {
      id: "ch1",
      x: 10,
      y: 20,
      type: "chart" as const,
      width: 400,
      height: 250,
      option,
    };
    const set = jest.fn();
    render(React.createElement(ChartSection, { el, set }));
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeTruthy();
    expect((textarea as HTMLTextAreaElement).value).toContain("xAxis");
  });

  it("handles valid JSON change", () => {
    const el = {
      id: "ch1",
      x: 10,
      y: 20,
      type: "chart" as const,
      width: 400,
      height: 250,
      option: {},
    };
    const set = jest.fn();
    render(React.createElement(ChartSection, { el, set }));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: '{"series":[]}' },
    });
    expect(set).toHaveBeenCalledWith("option", { series: [] });
  });

  it("handles invalid JSON change (shows error)", () => {
    const el = {
      id: "ch1",
      x: 10,
      y: 20,
      type: "chart" as const,
      width: 400,
      height: 250,
      option: {},
    };
    const set = jest.fn();
    render(React.createElement(ChartSection, { el, set }));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "not-json" } });
    expect(screen.getByText("Invalid JSON")).toBeTruthy();
    // set should NOT have been called with option
    expect(set).not.toHaveBeenCalled();
  });

  it("renders link to ECharts docs", () => {
    const el = {
      id: "ch1",
      x: 10,
      y: 20,
      type: "chart" as const,
      width: 400,
      height: 250,
      option: {},
    };
    const set = jest.fn();
    render(React.createElement(ChartSection, { el, set }));
    expect(screen.getByText("ECharts option")).toBeTruthy();
  });
});
