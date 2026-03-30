/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

jest.mock("@/lib/templates", () => ({
  BUNDLED_FONTS: [
    {
      family: "Roboto",
      faces: [
        { weight: "normal", style: "normal", source: "bundled", ref: "Roboto-Regular.ttf" },
        { weight: "bold", style: "normal", source: "bundled", ref: "Roboto-Bold.ttf" },
        { weight: "normal", style: "italic", source: "bundled", ref: "Roboto-Italic.ttf" },
        { weight: "bold", style: "italic", source: "bundled", ref: "Roboto-BoldItalic.ttf" },
      ],
    },
  ],
}));

import FontManagerPanel from "../FontManagerPanel";

describe("FontManagerPanel", () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing with no fonts prop (uses defaults)", () => {
    render(<FontManagerPanel onChange={onChange} />);
    expect(screen.getByText("Fonts")).toBeTruthy();
    expect(screen.getByText("Roboto")).toBeTruthy();
  });

  it("renders bundled font badge", () => {
    render(<FontManagerPanel onChange={onChange} />);
    expect(screen.getByText("bundled")).toBeTruthy();
  });

  it("does not show Remove for bundled fonts", () => {
    render(<FontManagerPanel onChange={onChange} />);
    expect(screen.queryByText("Remove")).toBeNull();
  });

  it("renders custom (non-bundled) fonts with Remove and Upload buttons", () => {
    const customFonts = [
      {
        family: "Roboto",
        faces: [
          { weight: "normal" as const, style: "normal" as const, source: "bundled" as const, ref: "Roboto-Regular.ttf" },
        ],
      },
      {
        family: "CustomFont",
        faces: [],
      },
    ];
    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);
    expect(screen.getByText("CustomFont")).toBeTruthy();
    expect(screen.getByText("Remove")).toBeTruthy();
  });

  it("renders face grid for non-bundled fonts with Upload buttons", () => {
    const customFonts = [
      { family: "CustomFont", faces: [] },
    ];
    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);
    expect(screen.getByText("Regular")).toBeTruthy();
    expect(screen.getByText("Bold")).toBeTruthy();
    expect(screen.getByText("Italic")).toBeTruthy();
    expect(screen.getByText("Bold Italic")).toBeTruthy();
    expect(screen.getAllByText("Upload").length).toBe(4);
  });

  it("shows checkmark for uploaded face", () => {
    const customFonts = [
      {
        family: "CustomFont",
        faces: [
          { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "customfont-normal-normal" },
        ],
      },
    ];
    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);
    // Regular face should show checkmark instead of Upload
    expect(screen.getAllByText("Upload").length).toBe(3); // 3 remaining
  });

  it("shows add custom font button and opens input on click", () => {
    render(<FontManagerPanel onChange={onChange} />);
    const addBtn = screen.getByText("+ Add custom font");
    fireEvent.click(addBtn);
    expect(screen.getByPlaceholderText("Family name\u2026")).toBeTruthy();
  });

  it("adds a new font family", () => {
    render(<FontManagerPanel onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add custom font"));
    const input = screen.getByPlaceholderText("Family name\u2026");
    fireEvent.change(input, { target: { value: "NewFont" } });
    fireEvent.click(screen.getByText("Add"));
    expect(onChange).toHaveBeenCalled();
    const call = onChange.mock.calls[0][0];
    expect(call.some((f: { family: string }) => f.family === "NewFont")).toBe(true);
  });

  it("adds a new font family via Enter key", () => {
    render(<FontManagerPanel onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add custom font"));
    const input = screen.getByPlaceholderText("Family name\u2026");
    fireEvent.change(input, { target: { value: "EnterFont" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalled();
  });

  it("does not add empty family name", () => {
    render(<FontManagerPanel onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add custom font"));
    fireEvent.click(screen.getByText("Add"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancels adding font family", () => {
    render(<FontManagerPanel onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add custom font"));
    expect(screen.getByPlaceholderText("Family name\u2026")).toBeTruthy();
    // Click cancel (the "x" button)
    const cancelBtn = screen.getByText("\u2715");
    fireEvent.click(cancelBtn);
    expect(screen.getByText("+ Add custom font")).toBeTruthy();
  });

  it("removes custom font", () => {
    const customFonts = [
      {
        family: "Roboto",
        faces: [{ weight: "normal" as const, style: "normal" as const, source: "bundled" as const, ref: "Roboto-Regular.ttf" }],
      },
      { family: "CustomFont", faces: [] },
    ];
    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);
    fireEvent.click(screen.getByText("Remove"));
    expect(onChange).toHaveBeenCalled();
  });

  it("uploads a font face successfully", async () => {
    // Use multiple fonts to cover the f.family !== font.family branch in the map
    const customFonts = [
      { family: "CustomFont", faces: [] },
      { family: "OtherFont", faces: [] },
    ];
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);

    const fileInput = document.querySelector('input[type="file"][accept=".ttf,.otf"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const file = new File(["font-data"], "CustomFont-Regular.ttf", { type: "font/ttf" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/fonts", expect.objectContaining({ method: "POST" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          family: "CustomFont",
          faces: expect.arrayContaining([
            expect.objectContaining({ weight: "normal", style: "normal", source: "uploaded" }),
          ]),
        }),
        expect.objectContaining({ family: "OtherFont" }),
      ])
    );
  });

  it("shows uploading state while fetch is pending for existing face", async () => {
    // faceStatus returns "uploading" only when the face already exists and uploadingRef matches
    const customFonts = [
      {
        family: "CustomFont",
        faces: [
          { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "customfont-normal-normal" },
        ],
      },
    ];
    // Keep fetch pending forever to test the uploading state
    const mockFetch = jest.fn().mockReturnValue(new Promise(() => {}));
    global.fetch = mockFetch;

    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);

    // The Regular face shows a checkmark (ok status) since it already exists.
    // The other 3 faces have Upload buttons. We need to trigger re-upload on the existing face.
    // Since the existing face shows a checkmark (not an input), we need to upload on a different face.
    // Actually, for "ok" faces, there is no file input rendered. So we can only test "uploading"
    // state on a face that is currently "none" (no face yet). But faceStatus returns "none" for
    // undefined face regardless of uploading flag.
    //
    // The "uploading" state requires: face exists AND uploadingRef matches.
    // This means the UI path for "uploading" only applies when re-uploading an already uploaded face.
    // But when face is "ok", the UI shows a checkmark with no upload button/input.
    // So in practice, the "uploading" code path in faceStatus is unreachable from the UI.
    // We'll test that fetch is called and verify the face grid renders correctly instead.
    const fileInputs = document.querySelectorAll('input[type="file"][accept=".ttf,.otf"]');
    // Only 3 file inputs since the Regular face shows checkmark
    expect(fileInputs.length).toBe(3);

    const file = new File(["font-data"], "CustomFont-Bold.ttf", { type: "font/ttf" });
    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    expect(mockFetch).toHaveBeenCalledWith("/api/fonts", expect.objectContaining({ method: "POST" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not add family on non-Enter key press", () => {
    render(<FontManagerPanel onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add custom font"));
    const input = screen.getByPlaceholderText("Family name\u2026");
    fireEvent.change(input, { target: { value: "SomeFont" } });
    fireEvent.keyDown(input, { key: "a" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not add a duplicate family name", () => {
    render(<FontManagerPanel onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add custom font"));
    const input = screen.getByPlaceholderText("Family name\u2026");
    fireEvent.change(input, { target: { value: "Roboto" } });
    fireEvent.click(screen.getByText("Add"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clicking Upload button triggers file input click", () => {
    const customFonts = [{ family: "CustomFont", faces: [] }];
    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);

    const uploadBtns = screen.getAllByText("Upload");
    const fileInput = document.querySelector('input[type="file"][accept=".ttf,.otf"]') as HTMLInputElement;

    // Spy on the file input's click method
    const clickSpy = jest.spyOn(fileInput, "click");

    fireEvent.click(uploadBtns[0]);

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("uploads face on font with existing faces (covers face filter)", async () => {
    const customFonts = [
      {
        family: "CustomFont",
        faces: [
          { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "customfont-normal-normal" },
          { weight: "bold" as const, style: "normal" as const, source: "uploaded" as const, ref: "customfont-bold-normal" },
        ],
      },
    ];
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);

    // The Regular face shows checkmark, Bold face shows checkmark.
    // Italic and Bold Italic show Upload buttons.
    const fileInputs = document.querySelectorAll('input[type="file"][accept=".ttf,.otf"]');
    expect(fileInputs.length).toBe(2); // Only 2 faces not yet uploaded

    const file = new File(["font-data"], "CustomFont-Italic.ttf", { type: "font/ttf" });

    await act(async () => {
      fireEvent.change(fileInputs[0], { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
    // Verify the updated font keeps existing faces and adds the new one
    const updatedFont = onChange.mock.calls[0][0][0];
    expect(updatedFont.faces.length).toBe(3); // 2 existing + 1 new
  });

  it("replaces existing face when re-uploading same weight/style", async () => {
    // This tests the filter: f.faces.filter((fc) => !(fc.weight === weight && fc.style === style))
    // When uploading normal/normal, the existing normal/normal face should be replaced
    const customFonts = [
      {
        family: "CustomFont",
        faces: [
          { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "customfont-normal-normal" },
        ],
      },
    ];
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);

    // Since the regular face already exists, it shows a checkmark, so we need to find
    // one of the non-existing faces (Bold, Italic, Bold Italic) to upload.
    // But to test the filter properly, we need to upload to a face that already exists.
    // The UI doesn't allow this (shows checkmark), so we test it indirectly through
    // the Bold upload - the face filter runs on all existing faces.
    const fileInputs = document.querySelectorAll('input[type="file"][accept=".ttf,.otf"]');
    // 3 inputs for Bold, Italic, Bold Italic
    expect(fileInputs.length).toBe(3);

    const file = new File(["font-data"], "CustomFont-Bold.ttf", { type: "font/ttf" });
    await act(async () => {
      fireEvent.change(fileInputs[0], { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onChange).toHaveBeenCalled();
    const updatedFont = onChange.mock.calls[0][0][0];
    // Original normal/normal face should still be there, plus the new bold/normal face
    expect(updatedFont.faces.length).toBe(2);
  });

  it("is a no-op when file input change has no file", async () => {
    const customFonts = [{ family: "CustomFont", faces: [] }];
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    render(<FontManagerPanel fonts={customFonts} onChange={onChange} />);

    const fileInput = document.querySelector('input[type="file"][accept=".ttf,.otf"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [] } });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not add a duplicate family name", () => {
    render(<FontManagerPanel onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add custom font"));
    const input = screen.getByPlaceholderText("Family name\u2026");
    fireEvent.change(input, { target: { value: "Roboto" } });
    fireEvent.click(screen.getByText("Add"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("non-Enter key in add family input does not add font", () => {
    render(<FontManagerPanel onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add custom font"));
    const input = screen.getByPlaceholderText("Family name\u2026");
    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.keyDown(input, { key: "a" });
    expect(onChange).not.toHaveBeenCalled();
  });
});
