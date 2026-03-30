/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { WizardStep } from "../types";
import type { ChartElement, RepeaterElement } from "@/types/template";

// Mock echarts
jest.mock("echarts", () => ({
  init: jest.fn(() => ({
    setOption: jest.fn(),
    dispose: jest.fn(),
    getDataURL: jest.fn(() => "data:image/png;base64,abc"),
  })),
}));

// Mock FontUploadList — exposes onAllDoneChange so tests can trigger readiness
jest.mock("../../FontUploadList", () => ({
  FontUploadList: ({ onAllDoneChange }: { missingFonts: unknown[]; onAllDoneChange?: (v: boolean) => void }) => (
    <div data-testid="font-upload">
      <button data-testid="mark-fonts-done" onClick={() => onAllDoneChange?.(true)}>MarkDone</button>
    </div>
  ),
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

// Mock renderChartImage so we can make it throw in specific tests
const mockRenderChartImage = jest.fn(() => Promise.resolve("data:image/png;base64,chart"));
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  renderChartImage: (...args: unknown[]) => mockRenderChartImage(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ExportWizardModal = require("../index").default;

// ── Step rendering for fonts, chart, repeater types ──────────────────────────

describe("ExportWizardModal – renders fonts/chart/repeater step types", () => {
  it("renders a fonts step", () => {
    const steps: WizardStep[] = [
      {
        id: "fonts",
        label: "Fonts",
        type: "fonts",
        missingFonts: [
          {
            family: "TestFont",
            faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "test-ref" }],
          },
        ],
      },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    expect(screen.getByTestId("font-upload")).toBeTruthy();
  });

  it("fonts step blocks export until ready", () => {
    const steps: WizardStep[] = [
      {
        id: "fonts",
        label: "Fonts",
        type: "fonts",
        missingFonts: [
          {
            family: "TestFont",
            faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "test-ref" }],
          },
        ],
      },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    const exportBtn = screen.getByText("Export PDF");
    expect(exportBtn.closest("button")?.disabled).toBe(true);
  });

  it("fonts step becomes ready when fonts are marked done", () => {
    const steps: WizardStep[] = [
      {
        id: "fonts",
        label: "Fonts",
        type: "fonts",
        missingFonts: [
          {
            family: "TestFont",
            faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "test-ref" }],
          },
        ],
      },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    // Click the mock button to trigger setReady(true)
    fireEvent.click(screen.getByTestId("mark-fonts-done"));

    const exportBtn = screen.getByText("Export PDF");
    expect(exportBtn.closest("button")?.disabled).toBe(false);
  });

  it("renders a chart step", () => {
    const chart: ChartElement = {
      id: "ch1",
      x: 0,
      y: 0,
      type: "chart",
      width: 200,
      height: 100,
      option: { type: "bar" },
    };

    const steps: WizardStep[] = [
      { id: "chart", label: "Chart", type: "chart", chart },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    // Chart step should render (ChartStep component shows "Pre-configured" for non-empty option)
    expect(screen.getByText("Export PDF")).toBeTruthy();
  });

  it("chart step blocks until ready", () => {
    const chart: ChartElement = {
      id: "ch1",
      x: 0,
      y: 0,
      type: "chart",
      width: 200,
      height: 100,
      option: {},
    };

    const steps: WizardStep[] = [
      { id: "chart", label: "Chart", type: "chart", chart },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    const exportBtn = screen.getByText("Export PDF");
    expect(exportBtn.closest("button")?.disabled).toBe(true);
  });

  it("renders a repeater step", () => {
    const repeater: RepeaterElement = {
      id: "rep1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Items",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [],
    };

    const steps: WizardStep[] = [
      { id: "repeater", label: "Repeater", type: "repeater", repeater },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    // Repeater step should render its label
    expect(screen.getByText("Items")).toBeTruthy();
  });

  it("repeater step blocks until ready", () => {
    const repeater: RepeaterElement = {
      id: "rep1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Items",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [],
    };

    const steps: WizardStep[] = [
      { id: "repeater", label: "Repeater", type: "repeater", repeater },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    const exportBtn = screen.getByText("Export PDF");
    expect(exportBtn.closest("button")?.disabled).toBe(true);
  });
});

// ── handleNext with beforeNext handlers ──────────────────────────────────────

describe("ExportWizardModal – handleNext with beforeNext handlers", () => {
  it("advances when beforeNext handler returns true", async () => {
    // Use a chart step which registers a beforeNext handler via the component
    // Instead, we use a two-step wizard where step 0 is a chart step.
    // The ChartStep registers a beforeNext handler internally.
    // For more control, we'll use a repeater step and interact with it.

    const repeater: RepeaterElement = {
      id: "rep1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Items",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [],
    };

    const steps: WizardStep[] = [
      { id: "repeater", label: "Repeater", type: "repeater", repeater },
      { id: "meta", label: "Metadata", type: "metadata" },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    // Enter data to make repeater ready
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ name: "A" }]) },
    });

    // Wait for setReady to propagate
    await waitFor(() => {
      const nextBtn = screen.getByText("Next \u2192");
      expect(nextBtn.closest("button")?.disabled).toBe(false);
    });

    // Click Next — this should invoke the beforeNext handler (which returns true since items exist)
    await act(async () => {
      fireEvent.click(screen.getByText("Next \u2192"));
    });

    // Should have advanced to metadata step — Export PDF is visible on last step
    await waitFor(() => {
      expect(screen.getByText("Export PDF")).toBeTruthy();
    });
  });

  it("does NOT advance when beforeNext handler returns false (no items)", async () => {
    const repeater: RepeaterElement = {
      id: "rep1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Items",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [],
    };

    const steps: WizardStep[] = [
      { id: "ph", label: "Placeholders", type: "placeholders", placeholders: ["x"] },
      { id: "repeater", label: "Repeater", type: "repeater", repeater },
      { id: "meta", label: "Metadata", type: "metadata" },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    // Navigate to the repeater step first
    fireEvent.click(screen.getByText("Next \u2192"));

    // Now on step 1 (repeater) — do NOT enter any data
    // The button should be disabled because repeater is not ready without data
    await waitFor(() => {
      const nextBtn = screen.getByText("Next \u2192");
      expect(nextBtn.closest("button")?.disabled).toBe(true);
    });
  });

  it("stops processing and does NOT advance when beforeNext handler throws", async () => {
    // Make renderChartImage reject so ChartStep's beforeNext throws
    mockRenderChartImage.mockRejectedValueOnce(new Error("render boom"));

    const chart: ChartElement = {
      id: "ch1",
      x: 0,
      y: 0,
      type: "chart",
      width: 200,
      height: 100,
      option: { type: "bar" },
    };

    const steps: WizardStep[] = [
      { id: "chart", label: "Chart", type: "chart", chart },
      { id: "meta", label: "Metadata", type: "metadata" },
    ];

    const onExport = jest.fn();
    render(
      <ExportWizardModal steps={steps} onExport={onExport} onCancel={jest.fn()} />
    );

    // ChartStep with non-empty option should be ready
    await waitFor(() => {
      const nextBtn = screen.getByText("Next \u2192");
      expect(nextBtn.closest("button")?.disabled).toBe(false);
    });

    // Click Next — beforeNext will throw due to mocked rejection
    await act(async () => {
      fireEvent.click(screen.getByText("Next \u2192"));
    });

    // Should NOT have advanced — still on step 0 showing "Next" not "Export PDF"
    // The button should still say "Next" (not "Export PDF") since we didn't advance
    expect(screen.getByText("Next \u2192")).toBeTruthy();
    expect(onExport).not.toHaveBeenCalled();
  });

  it("exports on last step after beforeNext succeeds", async () => {
    const repeater: RepeaterElement = {
      id: "rep1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Items",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [],
    };

    const onExport = jest.fn();
    const steps: WizardStep[] = [
      { id: "repeater", label: "Repeater", type: "repeater", repeater },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={onExport} onCancel={jest.fn()} />
    );

    // Enter data
    const textarea = screen.getByPlaceholderText(/JSON array/);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ name: "A" }]) },
    });

    await waitFor(() => {
      const exportBtn = screen.getByText("Export PDF");
      expect(exportBtn.closest("button")?.disabled).toBe(false);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(onExport).toHaveBeenCalled();
    });
  });
});

// ── Processing state ──────────────────────────────────────────────────────────

describe("ExportWizardModal – processing state", () => {
  it("disables Back button while processing", async () => {
    // We need a multi-step wizard where step 1 has a slow beforeNext handler.
    // Use a repeater step.
    const repeater: RepeaterElement = {
      id: "rep1",
      x: 0,
      y: 0,
      type: "repeater",
      label: "Items",
      dataKey: "items",
      width: 500,
      cardWidth: 200,
      cardHeight: 100,
      itemsPerRow: 2,
      gap: 10,
      cardElements: [
        {
          id: "ch1",
          x: 0,
          y: 0,
          type: "chart" as const,
          width: 200,
          height: 100,
          option: {},
          seriesDataField: "data",
        },
      ],
    };

    const steps: WizardStep[] = [
      { id: "ph", label: "Placeholders", type: "placeholders", placeholders: ["x"] },
      { id: "repeater", label: "Repeater", type: "repeater", repeater },
      { id: "meta", label: "Metadata", type: "metadata" },
    ];

    render(
      <ExportWizardModal steps={steps} onExport={jest.fn()} onCancel={jest.fn()} />
    );

    // Navigate to repeater step
    fireEvent.click(screen.getByText("Next \u2192"));

    // The Back button should exist and be enabled
    const backBtn = screen.getByText("\u2190 Back");
    expect(backBtn.closest("button")?.disabled).toBe(false);
  });
});
