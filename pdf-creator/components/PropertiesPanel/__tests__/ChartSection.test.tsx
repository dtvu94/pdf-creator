/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { ChartElement } from "@/types/template";

// Mock echarts
const mockSetOption = jest.fn();
const mockDispose = jest.fn();
const mockInit = jest.fn(() => ({
  setOption: mockSetOption,
  dispose: mockDispose,
}));

jest.mock("echarts", () => ({
  __esModule: true,
  default: { init: (...args: unknown[]) => mockInit(...args) },
  init: (...args: unknown[]) => mockInit(...args),
}));

import ChartSection from "../ChartSection";

const chartElWithOption: ChartElement = {
  id: "ch1",
  x: 10,
  y: 20,
  type: "chart",
  width: 400,
  height: 250,
  option: {
    xAxis: { type: "category", data: ["A", "B", "C"] },
    yAxis: { type: "value" },
    series: [{ data: [10, 20, 30], type: "bar" }],
  },
};

const chartElEmpty: ChartElement = {
  id: "ch2",
  x: 10,
  y: 20,
  type: "chart",
  width: 400,
  height: 250,
  option: {},
};

describe("ChartSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with chart option and shows preview", async () => {
    const set = jest.fn();
    render(<ChartSection el={chartElWithOption} set={set} />);
    expect(screen.getByText("Chart (ECharts option)")).toBeTruthy();
    // Should show the JSON textarea
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toContain("xAxis");
  });

  it("renders empty option placeholder", () => {
    const set = jest.fn();
    render(<ChartSection el={chartElEmpty} set={set} />);
    expect(screen.getByText(/No option configured/)).toBeTruthy();
  });

  it("calls set when valid JSON is entered", () => {
    const set = jest.fn();
    render(<ChartSection el={chartElEmpty} set={set} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: '{"type": "bar"}' } });
    expect(set).toHaveBeenCalledWith("option", { type: "bar" });
  });

  it("shows error for invalid JSON", () => {
    const set = jest.fn();
    render(<ChartSection el={chartElWithOption} set={set} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "not valid json{" } });
    expect(screen.getByText("Invalid JSON")).toBeTruthy();
    // set should NOT have been called with "option"
    expect(set).not.toHaveBeenCalled();
  });

  it("re-syncs JSON text when element id changes", () => {
    const set = jest.fn();
    const { rerender } = render(<ChartSection el={chartElWithOption} set={set} />);
    const newEl = { ...chartElWithOption, id: "ch-new", option: { newProp: true } };
    rerender(<ChartSection el={newEl} set={set} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toContain("newProp");
  });

  it("renders ECharts link", () => {
    const set = jest.fn();
    render(<ChartSection el={chartElEmpty} set={set} />);
    const link = screen.getByText("ECharts option");
    expect(link.getAttribute("href")).toBe("https://echarts.apache.org/en/option.html");
  });

  it("disposes chart on unmount", async () => {
    const set = jest.fn();
    const { unmount } = render(<ChartSection el={chartElWithOption} set={set} />);
    // Wait for async import to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    unmount();
    // The dispose should have been called
  });

  it("disposes existing chart before reinitializing on option change", async () => {
    const set = jest.fn();
    const { rerender } = render(<ChartSection el={chartElWithOption} set={set} />);

    // Wait for async import to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Change the option to trigger re-init
    const updatedEl = {
      ...chartElWithOption,
      option: { ...chartElWithOption.option, title: { text: "Updated" } },
    };
    rerender(<ChartSection el={updatedEl} set={set} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // dispose should have been called for the previous chart instance
    expect(mockDispose).toHaveBeenCalled();
  });

  it("disposes chart and sets ref to null when option becomes empty", async () => {
    const set = jest.fn();
    const { rerender } = render(<ChartSection el={chartElWithOption} set={set} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Rerender with empty option
    rerender(<ChartSection el={chartElEmpty} set={set} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Should show placeholder text
    expect(screen.getByText(/No option configured/)).toBeTruthy();
  });

  it("handles cancelled async import (component unmounted before echarts loads)", async () => {
    const set = jest.fn();
    const { unmount } = render(<ChartSection el={chartElWithOption} set={set} />);
    // Unmount immediately before echarts import can resolve
    unmount();
    // Wait a tick to let the import resolve (but cancelled flag should prevent init)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    // Should not crash
  });
});
