// Mock echarts before importing the module under test
const mockDispose = jest.fn();
const mockSetOption = jest.fn();
const mockRenderToSVGString = jest.fn().mockReturnValue("<svg></svg>");
const mockInit = jest.fn().mockReturnValue({
  setOption: mockSetOption,
  renderToSVGString: mockRenderToSVGString,
  dispose: mockDispose,
});
const mockUse = jest.fn();

jest.mock("echarts/core", () => ({
  init: mockInit,
  use: mockUse,
}));

jest.mock("echarts/renderers", () => ({ SVGRenderer: "SVGRenderer" }));
jest.mock("echarts/charts", () => ({
  LineChart: "LineChart",
  BarChart: "BarChart",
  PieChart: "PieChart",
  ScatterChart: "ScatterChart",
  HeatmapChart: "HeatmapChart",
  RadarChart: "RadarChart",
  GaugeChart: "GaugeChart",
}));
jest.mock("echarts/components", () => ({
  TitleComponent: "TitleComponent",
  TooltipComponent: "TooltipComponent",
  LegendComponent: "LegendComponent",
  GridComponent: "GridComponent",
  VisualMapComponent: "VisualMapComponent",
  DataZoomComponent: "DataZoomComponent",
  ToolboxComponent: "ToolboxComponent",
}));

jest.mock("sharp", () => {
  const mockPng = jest.fn().mockReturnValue({
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("PNGDATA")),
  });
  const sharpFn = jest.fn().mockReturnValue({ png: mockPng });
  return { __esModule: true, default: sharpFn };
});

import type { Template, ChartElement, TemplateElement } from "@/types/template";
import { renderCharts } from "@/lib/serverChartRenderer";
import sharp from "sharp";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chartEl(id: string, option: Record<string, unknown>, renderedImage?: string): ChartElement {
  return {
    id, x: 0, y: 0, type: "chart",
    width: 400, height: 300,
    option,
    ...(renderedImage ? { renderedImage } : {}),
  };
}

function textEl(id = "t1"): TemplateElement {
  return {
    id, x: 0, y: 0, type: "text", content: "hello",
    fontSize: 12, bold: false, italic: false, underline: false,
    color: "#000", width: 100,
  };
}

function makeTemplate(elements: TemplateElement[]): Template {
  return {
    name: "Test",
    pages: [{ id: "p1", elements }],
    styles: { primaryColor: "#000" },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("renderCharts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenderToSVGString.mockReturnValue("<svg></svg>");
  });

  it("renders charts that have an option but no renderedImage", async () => {
    const option = { series: [{ type: "line", data: [1, 2, 3] }] };
    const t = makeTemplate([chartEl("c1", option)]);

    const result = await renderCharts(t);
    const el = result.pages[0].elements[0] as ChartElement;

    expect(el.renderedImage).toContain("data:image/png;base64,");
    expect(mockInit).toHaveBeenCalledWith(null, null, {
      renderer: "svg", ssr: true, width: 400, height: 300,
    });
    expect(mockSetOption).toHaveBeenCalledWith(option);
    expect(mockDispose).toHaveBeenCalled();
    expect(sharp).toHaveBeenCalled();
  });

  it("skips charts that already have a renderedImage", async () => {
    const option = { series: [{ type: "bar", data: [1] }] };
    const existingImage = "data:image/png;base64,EXISTING";
    const t = makeTemplate([chartEl("c1", option, existingImage)]);

    const result = await renderCharts(t);
    const el = result.pages[0].elements[0] as ChartElement;

    expect(el.renderedImage).toBe(existingImage);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("skips charts with an empty option {}", async () => {
    const t = makeTemplate([chartEl("c1", {})]);

    const result = await renderCharts(t);
    const el = result.pages[0].elements[0] as ChartElement;

    expect(el.renderedImage).toBeUndefined();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("returns template unchanged when there are no chart elements", async () => {
    const t = makeTemplate([textEl()]);

    const result = await renderCharts(t);

    expect(result).toBe(t); // same reference — no copy needed
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("handles multiple charts across multiple pages", async () => {
    const opt1 = { series: [{ type: "line", data: [1] }] };
    const opt2 = { xAxis: { type: "category" }, series: [{ type: "bar", data: [2] }] };
    const t: Template = {
      name: "Multi",
      pages: [
        { id: "p1", elements: [chartEl("c1", opt1)] },
        { id: "p2", elements: [chartEl("c2", opt2)] },
      ],
      styles: { primaryColor: "#000" },
    };

    const result = await renderCharts(t);

    const el1 = result.pages[0].elements[0] as ChartElement;
    const el2 = result.pages[1].elements[0] as ChartElement;
    expect(el1.renderedImage).toContain("data:image/png;base64,");
    expect(el2.renderedImage).toContain("data:image/png;base64,");
    expect(mockInit).toHaveBeenCalledTimes(2);
  });

  it("renders only charts without renderedImage in a mixed set", async () => {
    const opt = { yAxis: { type: "value" }, series: [{ type: "line", data: [1] }] };
    const t = makeTemplate([
      chartEl("c1", opt, "data:image/png;base64,EXISTING"),
      chartEl("c2", opt),
    ]);

    const result = await renderCharts(t);

    const el1 = result.pages[0].elements[0] as ChartElement;
    const el2 = result.pages[0].elements[1] as ChartElement;
    expect(el1.renderedImage).toBe("data:image/png;base64,EXISTING");
    expect(el2.renderedImage).toContain("data:image/png;base64,");
    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it("gracefully handles chart rendering failure", async () => {
    mockRenderToSVGString.mockImplementation(() => { throw new Error("render fail"); });
    const opt = { series: [{ type: "pie", data: [1] }] };
    const t = makeTemplate([chartEl("c1", opt)]);

    // Should not throw
    const result = await renderCharts(t);
    const el = result.pages[0].elements[0] as ChartElement;

    // renderedImage should remain absent since rendering failed
    expect(el.renderedImage).toBeUndefined();
  });

  it("does not mutate the original template", async () => {
    const opt = { series: [{ type: "line", data: [1] }] };
    const t = makeTemplate([chartEl("c1", opt)]);
    const originalEl = t.pages[0].elements[0] as ChartElement;

    await renderCharts(t);

    expect(originalEl.renderedImage).toBeUndefined();
  });

  it("handles charts in header and footer sections", async () => {
    const opt = { radar: {}, series: [{ type: "radar", data: [1] }] };
    const t: Template = {
      name: "WithSections",
      pages: [{
        id: "p1",
        elements: [],
        header: { height: 100, elements: [chartEl("hc", opt)] },
        footer: { height: 50, elements: [chartEl("fc", opt)] },
      }],
      styles: { primaryColor: "#000" },
    };

    const result = await renderCharts(t);

    const hEl = result.pages[0].header!.elements[0] as ChartElement;
    const fEl = result.pages[0].footer!.elements[0] as ChartElement;
    expect(hEl.renderedImage).toContain("data:image/png;base64,");
    expect(fEl.renderedImage).toContain("data:image/png;base64,");
  });

  it("recognizes options with xAxis as renderable", async () => {
    const opt = { xAxis: { type: "category", data: ["A", "B"] } };
    const t = makeTemplate([chartEl("c1", opt)]);

    const result = await renderCharts(t);
    const el = result.pages[0].elements[0] as ChartElement;

    expect(el.renderedImage).toContain("data:image/png;base64,");
  });

  it("recognizes options with yAxis as renderable", async () => {
    const opt = { yAxis: { type: "value" } };
    const t = makeTemplate([chartEl("c1", opt)]);

    const result = await renderCharts(t);
    const el = result.pages[0].elements[0] as ChartElement;

    expect(el.renderedImage).toContain("data:image/png;base64,");
  });

  it("recognizes options with visualMap as renderable", async () => {
    const opt = { visualMap: { min: 0, max: 100 } };
    const t = makeTemplate([chartEl("c1", opt)]);

    const result = await renderCharts(t);
    const el = result.pages[0].elements[0] as ChartElement;

    expect(el.renderedImage).toContain("data:image/png;base64,");
  });

  it("skips options with only non-data keys (e.g. title only)", async () => {
    const opt = { title: { text: "Hello" }, tooltip: {} };
    const t = makeTemplate([chartEl("c1", opt)]);

    const result = await renderCharts(t);
    const el = result.pages[0].elements[0] as ChartElement;

    // title+tooltip alone isn't renderable (no series/axis/radar/visualMap)
    expect(el.renderedImage).toBeUndefined();
    expect(mockInit).not.toHaveBeenCalled();
  });

});
