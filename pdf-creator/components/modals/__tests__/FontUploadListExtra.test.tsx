/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { FontUploadList } from "../FontUploadList";

describe("FontUploadList – interactions", () => {
  const missingFonts = [
    {
      family: "CustomFont",
      faces: [
        { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-normal-normal" },
        { weight: "bold" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-bold-normal" },
      ],
    },
    {
      family: "AnotherFont",
      faces: [
        { weight: "normal" as const, style: "italic" as const, source: "uploaded" as const, ref: "another-normal-italic" },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all missing font faces", () => {
    render(<FontUploadList missingFonts={missingFonts} />);
    expect(screen.getAllByText("CustomFont").length).toBeGreaterThan(0);
    expect(screen.getByText("Regular")).toBeTruthy();
    expect(screen.getByText("Bold")).toBeTruthy();
    expect(screen.getByText("AnotherFont")).toBeTruthy();
    expect(screen.getByText("Regular Italic")).toBeTruthy();
  });

  it("renders Upload buttons for each face", () => {
    render(<FontUploadList missingFonts={missingFonts} />);
    const uploadBtns = screen.getAllByText("Upload");
    expect(uploadBtns.length).toBe(3);
  });

  it("calls onAllDoneChange with false initially", () => {
    const onAllDone = jest.fn();
    render(<FontUploadList missingFonts={missingFonts} onAllDoneChange={onAllDone} />);
    expect(onAllDone).toHaveBeenCalledWith(false);
  });

  it("uploads a font file successfully", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = mockFetch;

    const onAllDone = jest.fn();
    render(<FontUploadList missingFonts={[{
      family: "TestFont",
      faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "test-ref" }],
    }]} onAllDoneChange={onAllDone} />);

    // Click the upload button to trigger file input
    const uploadBtn = screen.getByText("Upload");
    fireEvent.click(uploadBtn);

    // Find the hidden file input and change it
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["font data"], "font.ttf", { type: "font/ttf" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/fonts", expect.objectContaining({ method: "POST" }));
    });

    // After successful upload, should show checkmark
    await waitFor(() => {
      expect(screen.getByText("\u2713")).toBeTruthy();
    });

    // onAllDoneChange should have been called with true
    expect(onAllDone).toHaveBeenCalledWith(true);
  });

  it("shows Retry button on upload failure", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: false });
    globalThis.fetch = mockFetch;

    render(<FontUploadList missingFonts={[{
      family: "TestFont",
      faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "test-ref" }],
    }]} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["font data"], "font.ttf", { type: "font/ttf" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeTruthy();
    });
  });

  it("shows Retry button on network error", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    render(<FontUploadList missingFonts={[{
      family: "TestFont",
      faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "test-ref" }],
    }]} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["font data"], "font.ttf", { type: "font/ttf" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeTruthy();
    });
  });

  it("shows Uploading... label during upload", async () => {
    // Make fetch hang
    globalThis.fetch = jest.fn(() => new Promise<never>(() => {}));

    render(<FontUploadList missingFonts={[{
      family: "TestFont",
      faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "test-ref" }],
    }]} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["font data"], "font.ttf", { type: "font/ttf" });

    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText("Uploading\u2026")).toBeTruthy();
    });
  });

  it("does nothing when no file is selected", () => {
    render(<FontUploadList missingFonts={[{
      family: "TestFont",
      faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "test-ref" }],
    }]} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    // Should not crash
    expect(screen.getByText("Upload")).toBeTruthy();
  });

  it("renders without onAllDoneChange callback", () => {
    render(<FontUploadList missingFonts={missingFonts} />);
    expect(screen.getAllByText("Upload").length).toBe(3);
  });

  it("filters only uploaded-source faces", () => {
    const fontsWithBundled = [{
      family: "Mixed",
      faces: [
        { weight: "normal" as const, style: "normal" as const, source: "bundled" as const, ref: "bundled-ref" },
        { weight: "bold" as const, style: "normal" as const, source: "uploaded" as const, ref: "uploaded-ref" },
      ],
    }];
    render(<FontUploadList missingFonts={fontsWithBundled} />);
    // Only 1 Upload button (for the uploaded face)
    expect(screen.getAllByText("Upload").length).toBe(1);
    expect(screen.getByText("Bold")).toBeTruthy();
  });
});
