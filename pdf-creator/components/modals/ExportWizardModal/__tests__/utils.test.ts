/** @jest-environment jsdom */
/**
 * Tests for ExportWizardModal/utils.ts
 */

jest.mock("echarts", () => ({
  init: jest.fn(() => ({
    setOption: jest.fn(),
    dispose: jest.fn(),
    getDataURL: jest.fn(() => "data:image/png;base64,mockImage"),
  })),
}));

import { parseCsv, getExpectedFields, buildRepeaterChartOption } from "../utils";
import type { RepeaterElement, ChartElement } from "@/types/template";

describe("parseCsv", () => {
  it("parses simple CSV", () => {
    const result = parseCsv("a,b,c\n1,2,3");
    expect(result).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with commas", () => {
    const result = parseCsv('"hello, world",b,c');
    expect(result).toEqual([["hello, world", "b", "c"]]);
  });

  it("handles escaped double quotes", () => {
    const result = parseCsv('"say ""hello""",b');
    expect(result).toEqual([['say "hello"', "b"]]);
  });

  it("handles empty input", () => {
    const result = parseCsv("");
    expect(result).toEqual([]);
  });

  it("handles whitespace-only input", () => {
    const result = parseCsv("   \n  \n  ");
    expect(result).toEqual([]);
  });

  it("trims cell values", () => {
    const result = parseCsv("  a ,  b  , c  ");
    expect(result).toEqual([["a", "b", "c"]]);
  });

  it("handles Windows line endings", () => {
    const result = parseCsv("a,b\r\n1,2");
    expect(result).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("filters empty lines", () => {
    const result = parseCsv("a,b\n\n1,2\n\n");
    expect(result).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles single column", () => {
    const result = parseCsv("name\nAlice\nBob");
    expect(result).toEqual([["name"], ["Alice"], ["Bob"]]);
  });
});

describe("getExpectedFields", () => {
  it("extracts fields from text elements", () => {
    const repeater: RepeaterElement = {
      id: "r1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Test",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [
        {
          id: "t1",
          x: 0,
          y: 0,
          type: "text",
          content: "Hello {{name}} and {{age}}",
          fontSize: 12,
          bold: false,
          italic: false,
          underline: false,
          color: "#000",
          width: 100,
        },
      ],
    };
    const fields = getExpectedFields(repeater);
    expect(fields).toContain("name");
    expect(fields).toContain("age");
  });

  it("extracts fields from heading elements", () => {
    const repeater: RepeaterElement = {
      id: "r1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Test",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [
        {
          id: "h1",
          x: 0,
          y: 0,
          type: "heading",
          content: "{{title}}",
          fontSize: 14,
          bold: true,
          italic: false,
          underline: false,
          color: "#000",
          width: 100,
        },
      ],
    };
    const fields = getExpectedFields(repeater);
    expect(fields).toContain("title");
  });

  it("extracts fields from card elements", () => {
    const repeater: RepeaterElement = {
      id: "r1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Test",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [
        {
          id: "c1",
          x: 0,
          y: 0,
          type: "card",
          title: "{{sensor_name}}",
          value: "{{average_value}}",
          unit: "C",
          subtitle: "{{status}}",
          accentColor: "#000",
          bgColor: "#fff",
          borderColor: "#ccc",
          width: 100,
          height: 80,
        },
      ],
    };
    const fields = getExpectedFields(repeater);
    expect(fields).toContain("sensor_name");
    expect(fields).toContain("average_value");
    expect(fields).toContain("status");
  });

  it("extracts fields from table elements including rowsDataField", () => {
    const repeater: RepeaterElement = {
      id: "r1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Test",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [
        {
          id: "tbl1",
          x: 0,
          y: 0,
          type: "table",
          headers: ["{{col1}}", "Col 2"],
          rows: [],
          headerColor: "#000",
          headerTextColor: "#fff",
          fontSize: 10,
          width: 100,
          rowsDataField: "tableData",
        },
      ],
    };
    const fields = getExpectedFields(repeater);
    expect(fields).toContain("col1");
    expect(fields).toContain("tableData");
  });

  it("extracts fields from image elements including srcField", () => {
    const repeater: RepeaterElement = {
      id: "r1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Test",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [
        {
          id: "img1",
          x: 0,
          y: 0,
          type: "image",
          label: "{{imgLabel}}",
          width: 100,
          height: 80,
          bgColor: "#ccc",
          srcField: "imageUrl",
        },
      ],
    };
    const fields = getExpectedFields(repeater);
    expect(fields).toContain("imgLabel");
    expect(fields).toContain("imageUrl");
  });

  it("returns empty array when no card elements", () => {
    const repeater: RepeaterElement = {
      id: "r1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Test",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [],
    };
    expect(getExpectedFields(repeater)).toEqual([]);
  });

  it("deduplicates fields", () => {
    const repeater: RepeaterElement = {
      id: "r1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Test",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [
        {
          id: "t1",
          x: 0,
          y: 0,
          type: "text",
          content: "{{name}} {{name}}",
          fontSize: 12,
          bold: false,
          italic: false,
          underline: false,
          color: "#000",
          width: 100,
        },
      ],
    };
    const fields = getExpectedFields(repeater);
    expect(fields.filter((f) => f === "name")).toHaveLength(1);
  });
});

describe("buildRepeaterChartOption", () => {
  it("builds option with baseSeries when series exists", () => {
    const chartEl: ChartElement = {
      id: "ch1",
      x: 0,
      y: 0,
      type: "chart",
      width: 200,
      height: 100,
      option: {
        series: [{ type: "bar", data: [1, 2] }],
      },
    };
    const rawData = [10, 20, 30];
    const result = buildRepeaterChartOption(chartEl, rawData);
    expect(result.series).toEqual([{ type: "bar", data: [10, 20, 30] }]);
    expect(result.animation).toBe(false);
    expect(result.xAxis).toBeDefined();
    expect(result.yAxis).toBeDefined();
  });

  it("provides default series when no series in option", () => {
    const chartEl: ChartElement = {
      id: "ch1",
      x: 0,
      y: 0,
      type: "chart",
      width: 200,
      height: 100,
      option: {},
    };
    const rawData = [5, 10];
    const result = buildRepeaterChartOption(chartEl, rawData);
    const series = result.series as Array<Record<string, unknown>>;
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe("line");
    expect(series[0].data).toEqual([5, 10]);
  });

  it("generates xAxis data labels", () => {
    const chartEl: ChartElement = {
      id: "ch1",
      x: 0,
      y: 0,
      type: "chart",
      width: 200,
      height: 100,
      option: {},
    };
    const rawData = [1, 2, 3];
    const result = buildRepeaterChartOption(chartEl, rawData);
    const xAxis = result.xAxis as { data: string[] };
    expect(xAxis.data).toEqual(["D1", "D2", "D3"]);
  });

  it("keeps additional series untouched when there are multiple", () => {
    const chartEl: ChartElement = {
      id: "ch1",
      x: 0,
      y: 0,
      type: "chart",
      width: 200,
      height: 100,
      option: {
        series: [
          { type: "bar", data: [1, 2] },
          { type: "line", data: [3, 4] },
        ],
      },
    };
    const rawData = [10, 20];
    const result = buildRepeaterChartOption(chartEl, rawData);
    const series = result.series as Array<Record<string, unknown>>;
    expect(series[0].data).toEqual([10, 20]);
    expect(series[1].data).toEqual([3, 4]);
  });
});

describe("renderChartImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock requestAnimationFrame (not available in node env)
    (globalThis as Record<string, unknown>).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).requestAnimationFrame;
  });

  it("renders chart to data URL", async () => {
    // Need to import after mocks are set up
    const { renderChartImage } = await import("../utils");
    const result = await renderChartImage({ type: "bar" }, 200, 100);
    expect(result).toBe("data:image/png;base64,mockImage");
  });
});
