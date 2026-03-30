/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CompressionPanel from "../CompressionPanel";
import type { CompressionConfig } from "@/types/template";

describe("CompressionPanel", () => {
  const defaultCompression: CompressionConfig = { imageQuality: 75 };

  it("renders quality and DPI inputs", () => {
    render(<CompressionPanel compression={defaultCompression} onUpdate={jest.fn()} />);
    expect(screen.getByText("Image Compression")).toBeTruthy();
    expect(screen.getByText("JPEG Quality (1–100)")).toBeTruthy();
    expect(screen.getByText("Target DPI (0 = no resampling)")).toBeTruthy();
  });

  it("displays current quality value", () => {
    render(<CompressionPanel compression={{ imageQuality: 60 }} onUpdate={jest.fn()} />);
    const inputs = screen.getAllByRole("spinbutton");
    expect((inputs[0] as HTMLInputElement).value).toBe("60");
  });

  it("calls onUpdate when quality changes", () => {
    const onUpdate = jest.fn();
    render(<CompressionPanel compression={defaultCompression} onUpdate={onUpdate} />);
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "50" } });
    expect(onUpdate).toHaveBeenCalledWith({ imageQuality: 50 });
  });

  it("calls onUpdate when DPI changes", () => {
    const onUpdate = jest.fn();
    render(<CompressionPanel compression={defaultCompression} onUpdate={onUpdate} />);
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[1], { target: { value: "150" } });
    expect(onUpdate).toHaveBeenCalledWith({ imageQuality: 75, imageDpi: 150 });
  });

  it("defaults DPI to 0 when not specified", () => {
    render(<CompressionPanel compression={{ imageQuality: 90 }} onUpdate={jest.fn()} />);
    const inputs = screen.getAllByRole("spinbutton");
    expect((inputs[1] as HTMLInputElement).value).toBe("0");
  });
});
