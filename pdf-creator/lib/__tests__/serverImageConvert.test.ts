// Mock sharp before importing the module under test
jest.mock("sharp", () => {
  const mockToBuffer = jest.fn().mockResolvedValue(Buffer.from("PNGDATA"));
  const mockJpeg = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });
  const mockPng = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });
  const mockWithMetadata = jest.fn().mockReturnValue({
    png: mockPng,
    jpeg: mockJpeg,
    toBuffer: mockToBuffer,
  });
  const sharpFn = jest.fn().mockReturnValue({
    png: mockPng,
    jpeg: mockJpeg,
    withMetadata: mockWithMetadata,
  });
  return { __esModule: true, default: sharpFn };
});

import type { Template, TemplateElement } from "@/types/template";
import { convertTemplateImages } from "@/lib/serverImageConvert";
import sharp from "sharp";

// Access private functions by importing the module and using internal helpers
// Since isSvgDataUrl, convertSrc, convertElements are not exported, we test
// them indirectly through convertTemplateImages.

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTemplate(elements: TemplateElement[], opts?: {
  headerElements?: TemplateElement[];
  footerElements?: TemplateElement[];
}): Template {
  return {
    name: "Test",
    pages: [{
      id: "p1",
      elements,
      header: opts?.headerElements
        ? { height: 50, elements: opts.headerElements }
        : undefined,
      footer: opts?.footerElements
        ? { height: 50, elements: opts.footerElements }
        : undefined,
    }],
    styles: { primaryColor: "#000" },
  };
}

function imageEl(src: string, id = "img1"): TemplateElement {
  return {
    id, x: 0, y: 0, type: "image",
    label: "Img", width: 100, height: 100,
    bgColor: "#fff", src,
  };
}

function textEl(content: string, id = "t1"): TemplateElement {
  return {
    id, x: 0, y: 0, type: "text", content,
    fontSize: 12, bold: false, italic: false, underline: false,
    color: "#000", width: 100,
  };
}

// ─── convertTemplateImages ───────────────────────────────────────────────────

describe("convertTemplateImages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("converts SVG data URL images to PNG", async () => {
    const svgSrc = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
    const t = makeTemplate([imageEl(svgSrc)]);
    const result = await convertTemplateImages(t);
    const el = result.pages[0].elements[0];
    if (el.type === "image") {
      expect(el.src).toBe("data:image/png;base64," + Buffer.from("PNGDATA").toString("base64"));
      expect(sharp).toHaveBeenCalled();
    }
  });

  it("passes through non-SVG image sources unchanged", async () => {
    const pngSrc = "data:image/png;base64,abc123";
    const t = makeTemplate([imageEl(pngSrc)]);
    const result = await convertTemplateImages(t);
    const el = result.pages[0].elements[0];
    if (el.type === "image") {
      expect(el.src).toBe(pngSrc);
    }
  });

  it("passes through non-image elements unchanged", async () => {
    const t = makeTemplate([textEl("hello")]);
    const result = await convertTemplateImages(t);
    const el = result.pages[0].elements[0];
    expect(el).toEqual(textEl("hello"));
  });

  it("converts images in header and footer", async () => {
    const svgSrc = "data:image/svg+xml;base64,PHN2Zz4=";
    const t = makeTemplate([], {
      headerElements: [imageEl(svgSrc, "himg")],
      footerElements: [imageEl(svgSrc, "fimg")],
    });
    const result = await convertTemplateImages(t);
    const hEl = result.pages[0].header!.elements[0];
    const fEl = result.pages[0].footer!.elements[0];
    if (hEl.type === "image") {
      expect(hEl.src).toContain("data:image/png;base64,");
    }
    if (fEl.type === "image") {
      expect(fEl.src).toContain("data:image/png;base64,");
    }
  });

  it("preserves header/footer when they are undefined", async () => {
    const t = makeTemplate([textEl("body")]);
    const result = await convertTemplateImages(t);
    expect(result.pages[0].header).toBeUndefined();
    expect(result.pages[0].footer).toBeUndefined();
  });

  it("does not mutate the original template", async () => {
    const svgSrc = "data:image/svg+xml;base64,PHN2Zz4=";
    const t = makeTemplate([imageEl(svgSrc)]);
    await convertTemplateImages(t);
    const el = t.pages[0].elements[0];
    if (el.type === "image") {
      expect(el.src).toBe(svgSrc);
    }
  });

  it("handles image elements without src", async () => {
    const noSrcImg: TemplateElement = {
      id: "ns", x: 0, y: 0, type: "image",
      label: "No Src", width: 100, height: 100, bgColor: "#fff",
    };
    const t = makeTemplate([noSrcImg]);
    // Should not throw — el.src is falsy so the element is returned as-is
    const result = await convertTemplateImages(t);
    expect(result.pages[0].elements[0]).toEqual(noSrcImg);
  });

  it("handles multiple pages", async () => {
    const svgSrc = "data:image/svg+xml;base64,PHN2Zz4=";
    const t: Template = {
      name: "Multi",
      pages: [
        { id: "p1", elements: [imageEl(svgSrc, "i1")] },
        { id: "p2", elements: [imageEl(svgSrc, "i2")] },
      ],
      styles: { primaryColor: "#000" },
    };
    const result = await convertTemplateImages(t);
    for (const page of result.pages) {
      const el = page.elements[0];
      if (el.type === "image") {
        expect(el.src).toContain("data:image/png;base64,");
      }
    }
  });

  it("re-encodes images as JPEG when compression quality < 90", async () => {
    const pngSrc = "data:image/png;base64,abc123";
    const t = makeTemplate([imageEl(pngSrc)]);
    t.compression = { imageQuality: 50 };
    const result = await convertTemplateImages(t);
    const el = result.pages[0].elements[0];
    if (el.type === "image") {
      expect(el.src).toContain("data:image/jpeg;base64,");
      expect(sharp).toHaveBeenCalled();
    }
  });

  it("does not re-encode when quality is 90 or above", async () => {
    const pngSrc = "data:image/png;base64,abc123";
    const t = makeTemplate([imageEl(pngSrc)]);
    t.compression = { imageQuality: 95 };
    const result = await convertTemplateImages(t);
    const el = result.pages[0].elements[0];
    if (el.type === "image") {
      expect(el.src).toBe(pngSrc);
    }
  });

  it("applies DPI setting when specified", async () => {
    const pngSrc = "data:image/png;base64,abc123";
    const t = makeTemplate([imageEl(pngSrc)]);
    t.compression = { imageQuality: 50, imageDpi: 150 };
    const result = await convertTemplateImages(t);
    const el = result.pages[0].elements[0];
    if (el.type === "image") {
      expect(el.src).toContain("data:image/jpeg;base64,");
    }
  });

  it("does not compress non-data-url images", async () => {
    const urlSrc = "https://example.com/image.png";
    const t = makeTemplate([imageEl(urlSrc)]);
    t.compression = { imageQuality: 50 };
    const result = await convertTemplateImages(t);
    const el = result.pages[0].elements[0];
    if (el.type === "image") {
      expect(el.src).toBe(urlSrc);
    }
  });
});
