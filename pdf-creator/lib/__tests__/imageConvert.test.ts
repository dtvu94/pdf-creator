/**
 * @jest-environment jsdom
 */

import { isSvgSrc, svgToPng, ensurePngSrc } from "@/lib/imageConvert";

// ─── isSvgSrc ────────────────────────────────────────────────────────────────

describe("isSvgSrc", () => {
  it("returns true for SVG data URLs", () => {
    expect(isSvgSrc("data:image/svg+xml;base64,abc")).toBe(true);
    expect(isSvgSrc("data:image/svg+xml,<svg></svg>")).toBe(true);
  });

  it("returns false for non-SVG data URLs", () => {
    expect(isSvgSrc("data:image/png;base64,abc")).toBe(false);
    expect(isSvgSrc("data:image/jpeg;base64,abc")).toBe(false);
  });

  it("returns true for .svg file URLs", () => {
    expect(isSvgSrc("https://example.com/icon.svg")).toBe(true);
    expect(isSvgSrc("/images/logo.svg")).toBe(true);
  });

  it("returns true for .svg URLs with query params", () => {
    expect(isSvgSrc("https://example.com/icon.svg?v=2")).toBe(true);
  });

  it("returns true for .SVG (case insensitive)", () => {
    expect(isSvgSrc("/images/LOGO.SVG")).toBe(true);
    expect(isSvgSrc("/images/logo.Svg")).toBe(true);
  });

  it("returns false for non-SVG file URLs", () => {
    expect(isSvgSrc("https://example.com/photo.png")).toBe(false);
    expect(isSvgSrc("/images/logo.jpg")).toBe(false);
    expect(isSvgSrc("https://example.com/file.svgz")).toBe(false);
  });

  it("returns false for plain strings", () => {
    expect(isSvgSrc("hello")).toBe(false);
    expect(isSvgSrc("")).toBe(false);
  });
});

// ─── svgToPng ────────────────────────────────────────────────────────────────

describe("svgToPng", () => {
  let mockCtx: { drawImage: jest.Mock };
  let mockCanvas: { width: number; height: number; getContext: jest.Mock; toDataURL: jest.Mock };
  let imgInstances: Array<{
    crossOrigin: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    src: string;
    naturalWidth: number;
    naturalHeight: number;
  }>;

  beforeEach(() => {
    imgInstances = [];

    mockCtx = { drawImage: jest.fn() };
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(mockCtx),
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,RESULT"),
    };

    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
      throw new Error(`Unexpected createElement: ${tag}`);
    });

    // Mock window.Image
    (window as { Image: unknown }).Image = class {
      crossOrigin = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";
      naturalWidth = 0;
      naturalHeight = 0;
      constructor() {
        imgInstances.push(this);
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("converts SVG to PNG via canvas", async () => {
    const promise = svgToPng("data:image/svg+xml;base64,abc");

    // Simulate image load
    const img = imgInstances[0];
    img.naturalWidth = 100;
    img.naturalHeight = 50;
    img.onload!();

    const result = await promise;
    expect(result).toBe("data:image/png;base64,RESULT");
    expect(mockCanvas.width).toBe(100);
    expect(mockCanvas.height).toBe(50);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(img, 0, 0, 100, 50);
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
  });

  it("uses 512x512 fallback when naturalWidth/Height is 0", async () => {
    const promise = svgToPng("data:image/svg+xml;base64,abc");

    const img = imgInstances[0];
    img.naturalWidth = 0;
    img.naturalHeight = 0;
    img.onload!();

    await promise;
    expect(mockCanvas.width).toBe(512);
    expect(mockCanvas.height).toBe(512);
  });

  it("rejects when image fails to load", async () => {
    const promise = svgToPng("data:image/svg+xml;base64,bad");

    const img = imgInstances[0];
    img.onerror!();

    await expect(promise).rejects.toThrow("Failed to load SVG for conversion");
  });

  it("rejects when canvas 2D context is not available", async () => {
    mockCanvas.getContext.mockReturnValue(null);
    const promise = svgToPng("data:image/svg+xml;base64,abc");

    const img = imgInstances[0];
    img.naturalWidth = 100;
    img.naturalHeight = 100;
    img.onload!();

    await expect(promise).rejects.toThrow("Canvas 2D not available");
  });

  it("sets crossOrigin to anonymous", () => {
    svgToPng("data:image/svg+xml;base64,abc");
    expect(imgInstances[0].crossOrigin).toBe("anonymous");
  });
});

// ─── ensurePngSrc ────────────────────────────────────────────────────────────

describe("ensurePngSrc", () => {
  let imgInstances: Array<{
    crossOrigin: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    src: string;
    naturalWidth: number;
    naturalHeight: number;
  }>;

  beforeEach(() => {
    imgInstances = [];

    const mockCtx = { drawImage: jest.fn() };
    const mockCanvas = {
      width: 0, height: 0,
      getContext: jest.fn().mockReturnValue(mockCtx),
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,CONVERTED"),
    };

    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
      throw new Error(`Unexpected createElement: ${tag}`);
    });

    (window as { Image: unknown }).Image = class {
      crossOrigin = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";
      naturalWidth = 100;
      naturalHeight = 100;
      constructor() {
        imgInstances.push(this);
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns non-SVG sources unchanged", async () => {
    const result = await ensurePngSrc("data:image/png;base64,abc");
    expect(result).toBe("data:image/png;base64,abc");
  });

  it("converts SVG sources to PNG", async () => {
    const promise = ensurePngSrc("data:image/svg+xml;base64,abc");
    imgInstances[0].onload!();
    const result = await promise;
    expect(result).toBe("data:image/png;base64,CONVERTED");
  });
});
