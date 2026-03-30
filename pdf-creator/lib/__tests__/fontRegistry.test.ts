/**
 * Unit tests for lib/fontRegistry.ts (client-side font registration)
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

// We need to reset the module-level `registeredFamilies` Set between tests.
// The simplest way is to re-import the module for each test using jest.isolateModules.

describe("fontRegistry (client)", () => {
  beforeEach(() => {
    mockRegister.mockClear();
  });

  function loadModule() {
    let mod: typeof import("../fontRegistry");
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require("../fontRegistry");
    });
    return mod!;
  }

  // ─── registerFontsClient ──────────────────────────────────────────────────────

  describe("registerFontsClient", () => {
    it("registers Helvetica override", () => {
      const { registerFontsClient } = loadModule();
      registerFontsClient();

      const helveticaCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "Helvetica"
      );
      expect(helveticaCall).toBeDefined();
      const fonts = (helveticaCall![0] as { fonts: { src: string }[] }).fonts;
      expect(fonts).toHaveLength(4);
      expect(fonts[0].src).toBe("/fonts/Calibri-Regular.ttf");
    });

    it("registers all bundled fonts with /fonts/ URLs", () => {
      const { registerFontsClient } = loadModule();
      registerFontsClient();

      // Helvetica + Roboto + Open Sans = 3 register calls
      expect(mockRegister).toHaveBeenCalledTimes(3);

      const robotoCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "Roboto"
      );
      expect(robotoCall).toBeDefined();
      const robotoFonts = (robotoCall![0] as { fonts: { src: string }[] }).fonts;
      expect(robotoFonts).toEqual([
        { src: "/fonts/Roboto-Regular.ttf", fontWeight: "normal", fontStyle: "normal" },
        { src: "/fonts/Roboto-Bold.ttf",    fontWeight: "bold",   fontStyle: "normal" },
      ]);
    });

    it("skips already-registered families on second call", () => {
      const { registerFontsClient } = loadModule();
      registerFontsClient();
      const countAfterFirst = mockRegister.mock.calls.length;

      registerFontsClient();
      expect(mockRegister).toHaveBeenCalledTimes(countAfterFirst);
    });

    it("registers custom uploaded fonts with /api/fonts/ URLs", () => {
      const { registerFontsClient } = loadModule();

      const customFonts: TemplateFont[] = [
        {
          family: "CustomFont",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "customfont-normal-normal" },
            { weight: "bold",   style: "normal", source: "bundled",  ref: "CustomFont-Bold.ttf" },
          ],
        },
      ];

      registerFontsClient(customFonts);

      const customCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "CustomFont"
      );
      expect(customCall).toBeDefined();
      const fonts = (customCall![0] as { fonts: { src: string }[] }).fonts;
      expect(fonts).toEqual([
        { src: "/api/fonts/customfont-normal-normal", fontWeight: "normal", fontStyle: "normal" },
        { src: "/fonts/CustomFont-Bold.ttf",          fontWeight: "bold",   fontStyle: "normal" },
      ]);
    });

    it("does not register custom fonts with only bundled faces", () => {
      const { registerFontsClient } = loadModule();

      const bundledOnlyFonts: TemplateFont[] = [
        {
          family: "BundledOnly",
          faces: [
            { weight: "normal", style: "normal", source: "bundled", ref: "BundledOnly-Regular.ttf" },
          ],
        },
      ];

      registerFontsClient(bundledOnlyFonts);

      const bundledOnlyCall = mockRegister.mock.calls.find(
        (call: unknown[]) => (call[0] as { family: string }).family === "BundledOnly"
      );
      // Should NOT be registered because it has no "uploaded" faces
      expect(bundledOnlyCall).toBeUndefined();
    });

    it("handles undefined fonts parameter", () => {
      const { registerFontsClient } = loadModule();
      expect(() => registerFontsClient()).not.toThrow();
      expect(() => registerFontsClient(undefined)).not.toThrow();
    });

    it("skips custom font if already registered", () => {
      const { registerFontsClient } = loadModule();

      const customFonts: TemplateFont[] = [
        {
          family: "CustomFont",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "customfont-normal-normal" },
          ],
        },
      ];

      registerFontsClient(customFonts);
      const countAfterFirst = mockRegister.mock.calls.length;

      registerFontsClient(customFonts);
      expect(mockRegister).toHaveBeenCalledTimes(countAfterFirst);
    });
  });

  // ─── getDefaultFamily ─────────────────────────────────────────────────────────

  describe("getDefaultFamily", () => {
    it("returns the provided family name", () => {
      const { getDefaultFamily } = loadModule();
      expect(getDefaultFamily("Custom")).toBe("Custom");
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
