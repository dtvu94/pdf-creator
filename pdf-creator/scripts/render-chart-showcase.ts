/**
 * Pre-render chart-showcase charts as PNG images, inject them into the template,
 * and save the result as a ready-to-generate template JSON.
 *
 * Usage: npx tsx scripts/render-chart-showcase.ts
 *
 * Output: public/samples/chart-showcase/template-with-charts.json
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { LineChart, BarChart, PieChart, ScatterChart, HeatmapChart } from "echarts/charts";
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, VisualMapComponent,
} from "echarts/components";
import sharp from "sharp";

echarts.use([
  SVGRenderer, LineChart, BarChart, PieChart, ScatterChart, HeatmapChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, VisualMapComponent,
]);

const samplesDir = join(process.cwd(), "public", "samples", "chart-showcase");

function loadJson(filename: string) {
  return JSON.parse(readFileSync(join(samplesDir, filename), "utf-8"));
}

async function renderChart(option: Record<string, unknown>, width: number, height: number): Promise<string> {
  const chart = echarts.init(null, null, {
    renderer: "svg",
    ssr: true,
    width,
    height,
  });
  chart.setOption(option);
  const svgStr = chart.renderToSVGString();
  chart.dispose();

  // Convert SVG to PNG via sharp
  const pngBuffer = await sharp(Buffer.from(svgStr)).png().toBuffer();
  return "data:image/png;base64," + pngBuffer.toString("base64");
}

async function main() {
  const template = loadJson("template.json");

  // Chart data files for the 4 pre-configured charts (page 1 & 2)
  const chartDataFiles: Record<string, string> = {
    "lfcgthn": "line-chart-data.json",        // Page 1: Line chart
    "o82xppd": "vertical-bar-chart-data.json", // Page 1: Vertical bar chart
    "lmyak21": "horizontal-bar-chart-data.json", // Page 2: Horizontal bar chart
    "22nnjju": "pie-chart-data.json",          // Page 2: Pie chart
  };

  // Full ECharts option files for the 2 "bring your own" charts (page 3)
  const chartOptionFiles: Record<string, string> = {
    "3o56i0f": "scatter-chart-option.json",
    "q1br4fg": "heatmap-chart-option.json",
  };

  // Render each chart
  for (const page of template.pages) {
    for (const el of page.elements) {
      if (el.type !== "chart") continue;

      let option: Record<string, unknown>;

      if (chartDataFiles[el.id]) {
        // Charts with pre-configured option in template + external data
        const data = loadJson(chartDataFiles[el.id]);
        // Merge: template option as base, data file overrides/provides series etc.
        option = { ...el.option, ...data };
      } else if (chartOptionFiles[el.id]) {
        // Charts that need full option from file
        option = loadJson(chartOptionFiles[el.id]);
        // Remove non-echarts keys
        delete (option as Record<string, unknown>)["_comment"];
        delete (option as Record<string, unknown>)["_usage"];
      } else {
        console.log(`  skip ${el.id} — no data file`);
        continue;
      }

      console.log(`  rendering ${el.id} (${el.width}x${el.height})...`);
      el.renderedImage = await renderChart(option, el.width, el.height);
      console.log(`  ✓ ${el.id} rendered (${Math.round(el.renderedImage.length / 1024)}KB base64)`);
    }
  }

  const outPath = join(samplesDir, "template-with-charts.json");
  writeFileSync(outPath, JSON.stringify(template, null, 2) + "\n");
  console.log(`\nWrote: ${outPath}`);
}

main().catch(console.error);
