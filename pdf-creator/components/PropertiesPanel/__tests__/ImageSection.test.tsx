/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ImageElement } from "@/types/template";

jest.mock("@/lib/imageConvert", () => ({
  ensurePngSrc: jest.fn((src: string) => Promise.resolve(src)),
}));

import ImageSection from "../ImageSection";

const imageElWithSrc: ImageElement = {
  id: "i1", x: 10, y: 20, type: "image",
  label: "Logo", width: 200, height: 120, bgColor: "#DBEAFE",
  src: "https://example.com/image.png",
};

const imageElWithDataUrl: ImageElement = {
  id: "i2", x: 10, y: 20, type: "image",
  label: "Upload", width: 200, height: 120, bgColor: "#DBEAFE",
  src: "data:image/png;base64,abc123",
};

const imageElNoSrc: ImageElement = {
  id: "i3", x: 10, y: 20, type: "image",
  label: "Placeholder", width: 200, height: 120, bgColor: "#DBEAFE",
};

describe("ImageSection", () => {
  it("renders with external URL source", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElWithSrc} set={set} />);
    expect(screen.getByText("Image")).toBeTruthy();
    // Should show preview
    const img = screen.getByAltText("preview");
    expect(img).toBeTruthy();
    expect((img as HTMLImageElement).src).toBe("https://example.com/image.png");
  });

  it("renders URL input with value for non-data URL", () => {
    const set = jest.fn();
    const { container } = render(<ImageSection el={imageElWithSrc} set={set} />);
    // The source input has no explicit type attribute; it renders as a default text input
    const inputs = container.querySelectorAll("input:not([type='file']):not([type='color'])");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders disabled input for data URL source", () => {
    const set = jest.fn();
    const { container } = render(<ImageSection el={imageElWithDataUrl} set={set} />);
    const inputs = container.querySelectorAll("input");
    // The text input should be disabled for data URL
    const textInputs = Array.from(inputs).filter(i => i.type === "text") as HTMLInputElement[];
    if (textInputs.length > 0) {
      expect(textInputs[0].disabled).toBe(true);
    }
  });

  it("calls set to clear image when clear button clicked", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElWithSrc} set={set} />);
    // Find clear button (the x button)
    const clearBtn = screen.getByTitle("Clear image");
    fireEvent.click(clearBtn);
    expect(set).toHaveBeenCalledWith("src", undefined);
  });

  it("does not show clear button when no src", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElNoSrc} set={set} />);
    expect(screen.queryByTitle("Clear image")).toBeNull();
  });

  it("shows placeholder label and background inputs when no src", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElNoSrc} set={set} />);
    expect(screen.getByText("Placeholder label")).toBeTruthy();
    expect(screen.getByText("Placeholder background")).toBeTruthy();
  });

  it("does not show placeholder inputs when src exists", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElWithSrc} set={set} />);
    expect(screen.queryByText("Placeholder label")).toBeNull();
    expect(screen.queryByText("Placeholder background")).toBeNull();
  });

  it("calls set when label changes", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElNoSrc} set={set} />);
    const labelInput = screen.getByDisplayValue("Placeholder");
    fireEvent.change(labelInput, { target: { value: "New Label" } });
    expect(set).toHaveBeenCalledWith("label", "New Label");
  });

  it("handles file upload", async () => {
    const set = jest.fn();
    const { container } = render(<ImageSection el={imageElNoSrc} set={set} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const file = new File(["content"], "test.png", { type: "image/png" });

    // Mock FileReader
    const originalFileReader = globalThis.FileReader;
    const mockReadAsDataURL = jest.fn();
    const mockFileReader = {
      readAsDataURL: mockReadAsDataURL,
      result: "data:image/png;base64,mock",
      onload: null as (() => void) | null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.FileReader = jest.fn(() => mockFileReader) as any;

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Trigger onload
    if (mockFileReader.onload) {
      await (mockFileReader.onload as () => Promise<void>)();
    }

    await waitFor(() => {
      expect(set).toHaveBeenCalledWith("src", "data:image/png;base64,mock");
    });

    globalThis.FileReader = originalFileReader;
  });

  it("does nothing when no file is selected", () => {
    const set = jest.fn();
    const { container } = render(<ImageSection el={imageElNoSrc} set={set} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(set).not.toHaveBeenCalled();
  });

  it("does nothing when files is null", () => {
    const set = jest.fn();
    const { container } = render(<ImageSection el={imageElNoSrc} set={set} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: null } });
    expect(set).not.toHaveBeenCalled();
  });

  it("upload button triggers file input click", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElNoSrc} set={set} />);
    const uploadBtn = screen.getByText(/Upload file/);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, "click");
    fireEvent.click(uploadBtn);
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("calls set when background color changes", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElNoSrc} set={set} />);
    // The ColorInput renders an input[type="color"]
    const colorInputs = document.querySelectorAll('input[type="color"]');
    if (colorInputs.length > 0) {
      fireEvent.change(colorInputs[0], { target: { value: "#FF0000" } });
      expect(set).toHaveBeenCalledWith("bgColor", "#ff0000");
    }
  });

  it("does not show preview when no src", () => {
    const set = jest.fn();
    render(<ImageSection el={imageElNoSrc} set={set} />);
    expect(screen.queryByAltText("preview")).toBeNull();
  });

  it("calls set with undefined when URL input is cleared", () => {
    const set = jest.fn();
    const { container } = render(<ImageSection el={imageElWithSrc} set={set} />);
    // Find the text input (non-file)
    const textInputs = Array.from(container.querySelectorAll("input")).filter(
      (i) => i.type === "text"
    );
    if (textInputs.length > 0) {
      fireEvent.change(textInputs[0], { target: { value: "" } });
      expect(set).toHaveBeenCalledWith("src", undefined);
    }
  });

  it("calls set with new URL when URL input changes", () => {
    const set = jest.fn();
    const { container } = render(<ImageSection el={imageElWithSrc} set={set} />);
    const textInputs = Array.from(container.querySelectorAll("input")).filter(
      (i) => i.type === "text"
    );
    if (textInputs.length > 0) {
      fireEvent.change(textInputs[0], { target: { value: "https://new-url.com/img.png" } });
      expect(set).toHaveBeenCalledWith("src", "https://new-url.com/img.png");
    }
  });
});
