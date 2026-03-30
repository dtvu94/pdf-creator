/**
 * SERVER-ONLY — do not import this file from any "use client" component.
 *
 * Renders ECharts chart elements server-side using SSR mode (SVG output)
 * and converts them to PNG data URLs via sharp.
 *
 * This allows the /api/generate-pdf endpoint to render charts without
 * a browser — filling in any chart elements that lack a renderedImage.
 */

import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { LineChart, BarChart, PieChart, ScatterChart, HeatmapChart, RadarChart, GaugeChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  DataZoomComponent,
  ToolboxComponent,
} from "echarts/components";
import sharp from "sharp";
import type { Template } from "@/types/template";
import { collectCharts, applyChartImages } from "@/lib/placeholders";

// Register ECharts components once
echarts.use([
  SVGRenderer,
  LineChart, BarChart, PieChart, ScatterChart, HeatmapChart, RadarChart, GaugeChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  VisualMapComponent, DataZoomComponent, ToolboxComponent,
]);

/**
 * Render a single ECharts option to a PNG data URL.
 */
async function renderChartToPng(
  option: Record<string, unknown>,
  width: number,
  height: number,
): Promise<string> {
  const chart = echarts.init(null, null, {
    renderer: "svg",
    ssr: true,
    width,
    height,
  });

  chart.setOption(option);
  const svgStr = chart.renderToSVGString();
  chart.dispose();

  const pngBuffer = await sharp(Buffer.from(svgStr)).png().toBuffer();
  return "data:image/png;base64," + pngBuffer.toString("base64");
}

/**
 * Check if an ECharts option object has enough content to render.
 */
function hasRenderableOption(option: Record<string, unknown> | undefined): boolean {
  if (!option) return false;
  // An empty {} or option with no series/data is not renderable
  return Object.keys(option).length > 0 && (
    "series" in option ||
    "xAxis" in option ||
    "yAxis" in option ||
    "radar" in option ||
    "visualMap" in option
  );
}

/**
 * Walk all chart elements in a template. For any that have an ECharts option
 * but no renderedImage, render the chart server-side and inject the image.
 *
 * Charts that already have a renderedImage (from browser rendering) are left
 * untouched. Charts with an empty option {} are also skipped.
 *
 * Returns a new template with renderedImage populated where possible.
 */
export async function renderCharts(template: Template): Promise<Template> {
  const charts = collectCharts(template);

  // Filter to charts that need rendering
  const needsRendering = charts.filter(
    (ch) => !ch.renderedImage && hasRenderableOption(ch.option),
  );

  if (needsRendering.length === 0) return template;

  const imagesById = new Map<string, string>();

  await Promise.all(
    needsRendering.map(async (ch) => {
      try {
        const png = await renderChartToPng(ch.option, ch.width, ch.height);
        imagesById.set(ch.id, png);
      } catch (e) {
        console.warn(`[renderCharts] Failed to render chart ${ch.id}:`, e);
        // Leave as placeholder — don't break generation
      }
    }),
  );

  if (imagesById.size === 0) return template;

  return applyChartImages(template, imagesById);
}
