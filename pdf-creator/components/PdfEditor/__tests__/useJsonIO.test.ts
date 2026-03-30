/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { useJsonIO } from "../useJsonIO";
import type { Template } from "@/types/template";

// Mock downloadJson
jest.mock("@/lib/utils", () => ({
  downloadJson: jest.fn(),
}));

const baseTemplate: Template = {
  fontFamily: "Roboto",
  pages: [{ elements: [] }],
} as Template;

const templateWithUploadedFonts: Template = {
  fontFamily: "Roboto",
  fonts: [
    {
      family: "CustomFont",
      faces: [
        { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-normal-normal" },
        { weight: "bold" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-bold-normal" },
      ],
    },
    {
      family: "Bundled",
      faces: [
        { weight: "normal" as const, style: "normal" as const, source: "bundled" as const, ref: "bundled-regular.ttf" },
      ],
    },
  ],
  pages: [{ elements: [] }],
} as Template;

function makeParams() {
  return {
    template: baseTemplate,
    setTemplate: jest.fn(),
    setSelectedIds: jest.fn(),
    setActivePage: jest.fn(),
    setActiveSection: jest.fn(),
    setLoadMissingFonts: jest.fn(),
  };
}

function makeFile(content: string, name = "template.json") {
  const file = new File([content], name, { type: "application/json" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(content),
  });
  return file;
}

function makeFileInput(file?: File) {
  return {
    target: {
      files: file ? [file] : [],
      value: "some-path",
    },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}

describe("useJsonIO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("saveJSON", () => {
    it("calls downloadJson with template and filename", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { downloadJson } = require("@/lib/utils");
      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));

      act(() => {
        result.current.saveJSON();
      });

      expect(downloadJson).toHaveBeenCalledWith(baseTemplate, "template.json");
    });
  });

  describe("loadJSON", () => {
    it("loads a valid template without fonts", async () => {
      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));
      const file = makeFile(JSON.stringify(baseTemplate));
      const event = makeFileInput(file);

      await act(async () => {
        await result.current.loadJSON(event);
      });

      expect(params.setTemplate).toHaveBeenCalledWith(baseTemplate);
      expect(params.setSelectedIds).toHaveBeenCalledWith(new Set());
      expect(params.setActivePage).toHaveBeenCalledWith(0);
      expect(params.setActiveSection).toHaveBeenCalledWith("body");
      // No uploaded fonts → setLoadMissingFonts should NOT be called
      expect(params.setLoadMissingFonts).not.toHaveBeenCalled();
      // File input should be cleared
      expect(event.target.value).toBe("");
    });

    it("loads template with uploaded fonts and checks missing refs", async () => {
      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));
      const file = makeFile(JSON.stringify(templateWithUploadedFonts));
      const event = makeFileInput(file);

      // Mock fetch to return some missing refs
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ missing: ["custom-bold-normal"] }),
        }),
      ) as jest.Mock;

      await act(async () => {
        await result.current.loadJSON(event);
      });

      expect(params.setTemplate).toHaveBeenCalledWith(templateWithUploadedFonts);
      expect(global.fetch).toHaveBeenCalledWith("/api/fonts/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refs: ["custom-normal-normal", "custom-bold-normal"] }),
      });
      expect(params.setLoadMissingFonts).toHaveBeenCalled();
      const missingFonts = params.setLoadMissingFonts.mock.calls[0][0];
      expect(missingFonts).toHaveLength(1);
      expect(missingFonts[0].family).toBe("CustomFont");
      expect(missingFonts[0].faces).toHaveLength(1);
      expect(missingFonts[0].faces[0].ref).toBe("custom-bold-normal");
    });

    it("does not set missing fonts when none are missing", async () => {
      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));
      const file = makeFile(JSON.stringify(templateWithUploadedFonts));
      const event = makeFileInput(file);

      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ missing: [] }),
        }),
      ) as jest.Mock;

      await act(async () => {
        await result.current.loadJSON(event);
      });

      expect(params.setLoadMissingFonts).not.toHaveBeenCalled();
    });

    it("handles network error on font status check gracefully", async () => {
      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));
      const file = makeFile(JSON.stringify(templateWithUploadedFonts));
      const event = makeFileInput(file);

      global.fetch = jest.fn(() => Promise.reject(new Error("Network error"))) as jest.Mock;

      await act(async () => {
        await result.current.loadJSON(event);
      });

      // Should still set the template, just skip missing font check
      expect(params.setTemplate).toHaveBeenCalledWith(templateWithUploadedFonts);
      expect(params.setLoadMissingFonts).not.toHaveBeenCalled();
    });

    it("shows alert for invalid JSON file", async () => {
      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));
      const file = makeFile("not valid json");
      const event = makeFileInput(file);

      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      await act(async () => {
        await result.current.loadJSON(event);
      });

      expect(alertSpy).toHaveBeenCalledWith("Invalid JSON file");
      expect(params.setTemplate).not.toHaveBeenCalled();
      // File input should still be cleared in finally
      expect(event.target.value).toBe("");
    });

    it("does nothing when no file is selected", async () => {
      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));
      const event = makeFileInput(); // no file

      await act(async () => {
        await result.current.loadJSON(event);
      });

      expect(params.setTemplate).not.toHaveBeenCalled();
    });

    it("does nothing when files is null", async () => {
      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));
      const event = {
        target: { files: null, value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.loadJSON(event);
      });

      expect(params.setTemplate).not.toHaveBeenCalled();
    });

    it("loads template with uploaded fonts where all fonts are from one family (single family)", async () => {
      const templateAllMissing: Template = {
        fontFamily: "Roboto",
        fonts: [
          {
            family: "MyFont",
            faces: [
              { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "myfont-reg" },
            ],
          },
        ],
        pages: [{ elements: [] }],
      } as Template;

      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));
      const file = makeFile(JSON.stringify(templateAllMissing));
      const event = makeFileInput(file);

      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ missing: ["myfont-reg"] }),
        }),
      ) as jest.Mock;

      await act(async () => {
        await result.current.loadJSON(event);
      });

      expect(params.setLoadMissingFonts).toHaveBeenCalled();
      const missingFonts = params.setLoadMissingFonts.mock.calls[0][0];
      expect(missingFonts).toHaveLength(1);
      expect(missingFonts[0].faces[0].ref).toBe("myfont-reg");
    });
  });

  describe("copyTemplateToClipboard", () => {
    it("writes template JSON to clipboard", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText, readText: jest.fn() } });
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));

      await act(async () => {
        await result.current.copyTemplateToClipboard();
      });

      expect(writeText).toHaveBeenCalledWith(JSON.stringify(baseTemplate, null, 2));
      expect(alertSpy).toHaveBeenCalledWith("Template JSON copied to clipboard");
    });

    it("shows error alert when clipboard write fails", async () => {
      Object.assign(navigator, { clipboard: { writeText: jest.fn().mockRejectedValue(new Error("denied")), readText: jest.fn() } });
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));

      await act(async () => {
        await result.current.copyTemplateToClipboard();
      });

      expect(alertSpy).toHaveBeenCalledWith("Failed to copy to clipboard");
    });
  });

  describe("pasteTemplateFromClipboard", () => {
    it("loads template from clipboard", async () => {
      const clipboardTemplate = { ...baseTemplate, name: "Pasted" };
      Object.assign(navigator, { clipboard: { readText: jest.fn().mockResolvedValue(JSON.stringify(clipboardTemplate)), writeText: jest.fn() } });
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));

      await act(async () => {
        await result.current.pasteTemplateFromClipboard();
      });

      expect(params.setTemplate).toHaveBeenCalledWith(clipboardTemplate);
      expect(params.setSelectedIds).toHaveBeenCalledWith(new Set());
      expect(params.setActivePage).toHaveBeenCalledWith(0);
    });

    it("shows error for invalid JSON in clipboard", async () => {
      Object.assign(navigator, { clipboard: { readText: jest.fn().mockResolvedValue("not json"), writeText: jest.fn() } });
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));

      await act(async () => {
        await result.current.pasteTemplateFromClipboard();
      });

      expect(alertSpy).toHaveBeenCalledWith("Failed to paste — clipboard does not contain valid template JSON");
      expect(params.setTemplate).not.toHaveBeenCalled();
    });

    it("rejects template without pages array", async () => {
      Object.assign(navigator, { clipboard: { readText: jest.fn().mockResolvedValue(JSON.stringify({ name: "Bad" })), writeText: jest.fn() } });
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));

      await act(async () => {
        await result.current.pasteTemplateFromClipboard();
      });

      expect(alertSpy).toHaveBeenCalledWith("Clipboard does not contain a valid template (missing pages)");
      expect(params.setTemplate).not.toHaveBeenCalled();
    });
  });

  describe("shareAsUrl", () => {
    it("posts template to /api/share and copies URL with UUID to clipboard", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText, readText: jest.fn() } });
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "abc-123" }),
        }),
      ) as jest.Mock;

      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));

      await act(async () => {
        await result.current.shareAsUrl();
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/share", expect.objectContaining({
        method: "POST",
      }));
      expect(writeText).toHaveBeenCalled();
      const url = writeText.mock.calls[0][0] as string;
      expect(url).toContain("?share=abc-123");
      expect(alertSpy).toHaveBeenCalledWith("Shareable URL copied to clipboard");
    });

    it("shows error when API returns failure", async () => {
      Object.assign(navigator, { clipboard: { writeText: jest.fn(), readText: jest.fn() } });
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Server error" }),
        }),
      ) as jest.Mock;

      const params = makeParams();
      const { result } = renderHook(() => useJsonIO(params));

      await act(async () => {
        await result.current.shareAsUrl();
      });

      expect(alertSpy).toHaveBeenCalledWith("Share failed: Server error");
    });
  });
});
