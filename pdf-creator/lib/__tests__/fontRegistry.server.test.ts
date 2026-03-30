/**
 * Unit tests for lib/fontRegistry.server.ts (server-side font registration)
 */

import type { TemplateFont } from "@/types/template";

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockRegister = jest.fn();

jest.mock("@react-pdf/renderer", () => ({
  Font: { register: mockRegister },
}));

jest.mock("@/lib/templates", () => ({
  BUNDLED_FONTS: [
    {
      family: "Roboto",
      faces: [
        { weight: "normal", style: "normal", source: "bundled", ref: "Roboto-Regular.ttf" },
        { weight: "bold",   style: "normal", source: "bundled", ref: "Roboto-Bold.ttf" },
      ],
    },
    {
      family: "Open Sans",
      faces: [
        { weight: "normal", style: "normal", source: "bundled", ref: "OpenSans-Regular.ttf" },
      ],
    },
  ],
  DEFAULT_FONT_FAMILY: "Roboto",
}));

const mockReaddirSync = jest.fn();

jest.mock("fs", () => ({
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
}));

describe("fontRegistry.server", () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockReaddirSync.mockClear();
  });

  function loadModule() {
    let mod: typeof import("../fontRegistry.server");
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require("../fontRegistry.server");
    });
    return mod!;
  }

  // ─── registerFontsServer ──────────────────────────────────────────────────────

  describe("registerFontsServer", () => {
    it("registers Helvetica override with filesystem paths", () => {
      const { registerFontsServer } = loadModule();
      registerFontsServer();

      const helveticaCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "Helvetica"
      );
      expect(helveticaCall).toBeDefined();
      const fonts = (helveticaCall![0] as { fonts: { src: string }[] }).fonts;
      expect(fonts).toHaveLength(4);
      // Should use absolute filesystem paths via path.join
      expect(fonts[0].src).toContain("public");
      expect(fonts[0].src).toContain("fonts");
      expect(fonts[0].src).toContain("Calibri-Regular.ttf");
    });

    it("registers all bundled fonts with filesystem paths", () => {
      const { registerFontsServer } = loadModule();
      registerFontsServer();

      // Helvetica + Roboto + Open Sans = 3
      expect(mockRegister).toHaveBeenCalledTimes(3);

      const robotoCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "Roboto"
      );
      expect(robotoCall).toBeDefined();
      const fonts = (robotoCall![0] as { fonts: { src: string }[] }).fonts;
      expect(fonts).toHaveLength(2);
      expect(fonts[0].src).toContain("Roboto-Regular.ttf");
      expect(fonts[0].fontWeight).toBe("normal");
      expect(fonts[1].src).toContain("Roboto-Bold.ttf");
      expect(fonts[1].fontWeight).toBe("bold");
    });

    it("skips already-registered families on second call", () => {
      const { registerFontsServer } = loadModule();
      registerFontsServer();
      const countAfterFirst = mockRegister.mock.calls.length;

      registerFontsServer();
      expect(mockRegister).toHaveBeenCalledTimes(countAfterFirst);
    });

    it("registers custom uploaded fonts from /tmp/pdf-creator-fonts/ when files exist", () => {
      mockReaddirSync.mockReturnValue(["customfont-normal-normal.ttf"]);

      const { registerFontsServer } = loadModule();
      const customFonts: TemplateFont[] = [
        {
          family: "CustomFont",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "customfont-normal-normal" },
          ],
        },
      ];

      const missing = registerFontsServer(customFonts);
      expect(missing).toEqual([]);

      const customCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "CustomFont"
      );
      expect(customCall).toBeDefined();
      const fonts = (customCall![0] as { fonts: { src: string }[] }).fonts;
      expect(fonts[0].src).toContain("customfont-normal-normal.ttf");
      expect(fonts[0].src).toContain("/tmp/pdf-creator-fonts/");
    });

    it("returns missing font names when uploaded files are not found", () => {
      mockReaddirSync.mockReturnValue([]);

      const { registerFontsServer } = loadModule();
      const customFonts: TemplateFont[] = [
        {
          family: "MissingFont",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "missingfont-normal-normal" },
            { weight: "bold",   style: "normal", source: "uploaded", ref: "missingfont-bold-normal" },
          ],
        },
      ];

      const missing = registerFontsServer(customFonts);
      expect(missing).toEqual([
        "MissingFont (normal normal)",
        "MissingFont (bold normal)",
      ]);
    });

    it("handles readdirSync throwing (upload dir does not exist)", () => {
      mockReaddirSync.mockImplementation(() => {
        throw new Error("ENOENT: no such file or directory");
      });

      const { registerFontsServer } = loadModule();
      const customFonts: TemplateFont[] = [
        {
          family: "NoDir",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "nodir-normal-normal" },
          ],
        },
      ];

      const missing = registerFontsServer(customFonts);
      expect(missing).toEqual(["NoDir (normal normal)"]);
    });

    it("handles custom fonts with mixed bundled and uploaded faces", () => {
      mockReaddirSync.mockReturnValue(["mixed-bold-normal.ttf"]);

      const { registerFontsServer } = loadModule();
      const customFonts: TemplateFont[] = [
        {
          family: "MixedFont",
          faces: [
            { weight: "normal", style: "normal", source: "bundled",  ref: "MixedFont-Regular.ttf" },
            { weight: "bold",   style: "normal", source: "uploaded", ref: "mixed-bold-normal" },
          ],
        },
      ];

      const missing = registerFontsServer(customFonts);
      expect(missing).toEqual([]);

      const mixedCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "MixedFont"
      );
      expect(mixedCall).toBeDefined();
      const fonts = (mixedCall![0] as { fonts: { src: string }[] }).fonts;
      expect(fonts).toHaveLength(2);
      // Bundled face uses BUNDLED_DIR path
      expect(fonts[0].src).toContain("MixedFont-Regular.ttf");
      // Uploaded face uses UPLOAD_DIR path
      expect(fonts[1].src).toContain("mixed-bold-normal.ttf");
    });

    it("matches uploaded font file with exact ref name", () => {
      mockReaddirSync.mockReturnValue(["myfont-normal-normal"]);

      const { registerFontsServer } = loadModule();
      const customFonts: TemplateFont[] = [
        {
          family: "MyFont",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "myfont-normal-normal" },
          ],
        },
      ];

      const missing = registerFontsServer(customFonts);
      expect(missing).toEqual([]);
    });

    it("matches uploaded font file with ref prefix + extension", () => {
      mockReaddirSync.mockReturnValue(["myfont-normal-normal.woff2"]);

      const { registerFontsServer } = loadModule();
      const customFonts: TemplateFont[] = [
        {
          family: "MyFont",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "myfont-normal-normal" },
          ],
        },
      ];

      const missing = registerFontsServer(customFonts);
      expect(missing).toEqual([]);
    });

    it("does not register custom font family that only has bundled faces", () => {
      const { registerFontsServer } = loadModule();
      const bundledOnlyFonts: TemplateFont[] = [
        {
          family: "BundledOnly",
          faces: [
            { weight: "normal", style: "normal", source: "bundled", ref: "BundledOnly-Regular.ttf" },
          ],
        },
      ];

      registerFontsServer(bundledOnlyFonts);

      const bundledOnlyCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "BundledOnly"
      );
      expect(bundledOnlyCall).toBeUndefined();
    });

    it("does not call Font.register when all uploaded faces are missing", () => {
      mockReaddirSync.mockReturnValue([]);

      const { registerFontsServer } = loadModule();
      const customFonts: TemplateFont[] = [
        {
          family: "AllMissing",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "allm-normal-normal" },
          ],
        },
      ];

      registerFontsServer(customFonts);

      const call = mockRegister.mock.calls.find(
        (c: unknown[]) => (c[0] as { family: string }).family === "AllMissing"
      );
      expect(call).toBeUndefined();
    });

    it("handles undefined fonts parameter", () => {
      const { registerFontsServer } = loadModule();
      const missing = registerFontsServer();
      expect(missing).toEqual([]);
    });

    it("returns empty array when no fonts are missing", () => {
      const { registerFontsServer } = loadModule();
      const missing = registerFontsServer([]);
      expect(missing).toEqual([]);
    });

    it("skips custom font if already registered", () => {
      mockReaddirSync.mockReturnValue(["custom-normal-normal.ttf"]);

      const { registerFontsServer } = loadModule();
      const customFonts: TemplateFont[] = [
        {
          family: "RepeatFont",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "custom-normal-normal" },
          ],
        },
      ];

      registerFontsServer(customFonts);
      const countAfterFirst = mockRegister.mock.calls.length;

      registerFontsServer(customFonts);
      expect(mockRegister).toHaveBeenCalledTimes(countAfterFirst);
    });
  });

  // ─── getDefaultFamily ─────────────────────────────────────────────────────────

  describe("getDefaultFamily", () => {
    it("returns the provided family name", () => {
      const { getDefaultFamily } = loadModule();
      expect(getDefaultFamily("Arial")).toBe("Arial");
    });

    it("returns DEFAULT_FONT_FAMILY when no argument is given", () => {
      const { getDefaultFamily } = loadModule();
      expect(getDefaultFamily()).toBe("Roboto");
    });

    it("returns DEFAULT_FONT_FAMILY when undefined is passed", () => {
      const { getDefaultFamily } = loadModule();
      expect(getDefaultFamily(undefined)).toBe("Roboto");
    });
  });
});
