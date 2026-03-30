/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

// Mock lucide-react (not used here but may be imported transitively)
jest.mock("lucide-react", () => new Proxy({}, {
  get: (_t: Record<string, unknown>, prop: string) => {
    if (prop === "__esModule") return true;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const R = require("react");
    return (props: Record<string, unknown>) => R.createElement("span", { "data-testid": prop, ...props });
  },
}));

import WatermarkPanel from "../WatermarkPanel";

describe("WatermarkPanel – additional coverage", () => {
  const baseWatermark = {
    enabled: true,
    pages: "all" as const,
    width: 200,
    height: 200,
    x: 100,
    y: 100,
    opacity: 0.15,
  };

  beforeEach(() => jest.clearAllMocks());

  it("handles image upload via file input", async () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);

    // Mock FileReader
    const originalFileReader = globalThis.FileReader;
    const mockReadAsDataURL = jest.fn();
    const mockFileReader = {
      readAsDataURL: mockReadAsDataURL,
      onload: null as (() => void) | null,
      result: "data:image/png;base64,abc123",
    };
    globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

    const file = new File(["img"], "watermark.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Trigger onload callback
    act(() => {
      if (mockFileReader.onload) mockFileReader.onload();
    });

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ src: "data:image/png;base64,abc123" }));

    globalThis.FileReader = originalFileReader;
  });

  it("handles image upload with no file selected", async () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);

    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [] } });
    });

    // onUpdate should not have been called for src
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("updates position X", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    // Find X input (first NumInput)
    const inputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(inputs[0], { target: { value: "150" } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ x: 150 }));
  });

  it("updates position Y", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    const inputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(inputs[1], { target: { value: "250" } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ y: 250 }));
  });

  it("updates width", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    const inputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(inputs[2], { target: { value: "300" } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ width: 300 }));
  });

  it("updates height", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    const inputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(inputs[3], { target: { value: "350" } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ height: 350 }));
  });

  it("updates opacity via slider", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "0.5" } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ opacity: 0.5 }));
  });

  it("displays correct opacity percentage", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, opacity: 0.75 };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.getByText("75%")).toBeTruthy();
  });

  it("toggles off watermark", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("ON"));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it("renders OFF button when watermark is disabled", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, enabled: false };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.getByText("OFF")).toBeTruthy();
  });

  it("toggles on watermark when OFF", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, enabled: false };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("OFF"));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });

  it("removes page from custom selection when clicking active page", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, pages: [1, 2] as number[] };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    // Click page 1 to remove it
    fireEvent.click(screen.getByText("1"));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ pages: [2] }));
  });

  it("falls back to [1] when removing last page from custom selection", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, pages: [2] as number[] };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    // Click page 2 to remove it (would empty the array)
    fireEvent.click(screen.getByText("2"));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ pages: [1] }));
  });

  it("does not show custom pages section when pages is 'all'", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.queryByText("Select pages:")).toBeNull();
  });

  it("renders Upload Image button", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.getByText("Upload Image")).toBeTruthy();
  });

  it("renders image preview when src is set", () => {
    const onUpdate = jest.fn();
    const wm = { ...baseWatermark, src: "data:image/png;base64,abc" };
    render(<WatermarkPanel watermark={wm} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.getByAltText("watermark preview")).toBeTruthy();
    expect(screen.getByText("Remove")).toBeTruthy();
  });

  it("hides Remove button when no src", () => {
    const onUpdate = jest.fn();
    render(<WatermarkPanel watermark={baseWatermark} totalPages={3} onUpdate={onUpdate} />);
    expect(screen.queryByText("Remove")).toBeNull();
  });
});
