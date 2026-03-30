import {
  makeId,
  createElement,
  BUNDLED_FONTS,
  DEFAULT_FONT_FAMILY,
  SUPPORTED_FONT_FAMILIES,
  PAGE_DIMENSIONS,
  getPageDimensions,
  A4_W,
  A4_H,
  CANVAS_SCALE,
  SAMPLE_LOGO_SRC,
} from "@/lib/templates/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

describe("constants", () => {
  it("A4_W and A4_H match PAGE_DIMENSIONS.A4", () => {
    expect(A4_W).toBe(595);
    expect(A4_H).toBe(842);
    expect(PAGE_DIMENSIONS.A4.width).toBe(A4_W);
    expect(PAGE_DIMENSIONS.A4.height).toBe(A4_H);
  });

  it("CANVAS_SCALE is 0.75", () => {
    expect(CANVAS_SCALE).toBe(0.75);
  });

  it("DEFAULT_FONT_FAMILY is Roboto", () => {
    expect(DEFAULT_FONT_FAMILY).toBe("Roboto");
  });

  it("SAMPLE_LOGO_SRC starts with data:image/png", () => {
    expect(SAMPLE_LOGO_SRC).toMatch(/^data:image\/png;base64,/);
  });

  it("PAGE_DIMENSIONS contains A4, A3, and A5", () => {
    expect(PAGE_DIMENSIONS.A4).toBeDefined();
    expect(PAGE_DIMENSIONS.A3).toBeDefined();
    expect(PAGE_DIMENSIONS.A5).toBeDefined();
  });

  it("SUPPORTED_FONT_FAMILIES includes all expected families", () => {
    expect(SUPPORTED_FONT_FAMILIES).toContain("Open Sans");
    expect(SUPPORTED_FONT_FAMILIES).toContain("Roboto");
    expect(SUPPORTED_FONT_FAMILIES).toContain("Calibri");
    expect(SUPPORTED_FONT_FAMILIES).toContain("Arial");
    expect(SUPPORTED_FONT_FAMILIES).toContain("Verdana");
    expect(SUPPORTED_FONT_FAMILIES).toContain("Lato");
    expect(SUPPORTED_FONT_FAMILIES).toContain("Inter");
  });
});

// ─── BUNDLED_FONTS ───────────────────────────────────────────────────────────

describe("BUNDLED_FONTS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(BUNDLED_FONTS)).toBe(true);
    expect(BUNDLED_FONTS.length).toBeGreaterThan(0);
  });

  it("each font has family and 4 faces", () => {
    for (const font of BUNDLED_FONTS) {
      expect(typeof font.family).toBe("string");
      expect(font.faces).toHaveLength(4);
    }
  });

  it("each face has weight, style, source=bundled, and a ref ending in .ttf", () => {
    for (const font of BUNDLED_FONTS) {
      for (const face of font.faces) {
        expect(["normal", "bold"]).toContain(face.weight);
        expect(["normal", "italic"]).toContain(face.style);
        expect(face.source).toBe("bundled");
        expect(face.ref).toMatch(/\.ttf$/);
      }
    }
  });

  it("covers all four weight/style combinations per font", () => {
    for (const font of BUNDLED_FONTS) {
      const combos = font.faces.map((f) => `${f.weight}-${f.style}`);
      expect(combos).toContain("normal-normal");
      expect(combos).toContain("bold-normal");
      expect(combos).toContain("normal-italic");
      expect(combos).toContain("bold-italic");
    }
  });
});

// ─── getPageDimensions ───────────────────────────────────────────────────────

describe("getPageDimensions", () => {
  it("returns A4 dimensions by default", () => {
    expect(getPageDimensions()).toEqual({ width: 595, height: 842 });
  });

  it("returns A4 when explicitly passed", () => {
    expect(getPageDimensions("A4")).toEqual({ width: 595, height: 842 });
  });

  it("returns A3 dimensions", () => {
    expect(getPageDimensions("A3")).toEqual({ width: 842, height: 1191 });
  });

  it("returns A5 dimensions", () => {
    expect(getPageDimensions("A5")).toEqual({ width: 420, height: 595 });
  });
});

// ─── makeId ──────────────────────────────────────────────────────────────────

describe("makeId", () => {
  it("returns a string", () => {
    expect(typeof makeId()).toBe("string");
  });

  it("returns a 7-character string", () => {
    expect(makeId()).toHaveLength(7);
  });

  it("contains only alphanumeric characters", () => {
    for (let i = 0; i < 20; i++) {
      expect(makeId()).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("produces unique IDs across calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => makeId()));
    // Extremely unlikely to get duplicates in 100 calls
    expect(ids.size).toBeGreaterThan(90);
  });
});

// ─── createElement ───────────────────────────────────────────────────────────

describe("createElement", () => {
  const elementTypes = [
    "heading", "text", "link", "table", "divider", "image",
    "card", "chart", "shape", "repeater",
  ] as const;

  it.each(elementTypes)("creates a valid %s element", (type) => {
    const el = createElement(type);
    expect(el.type).toBe(type);
    expect(typeof el.id).toBe("string");
    expect(el.id).toHaveLength(7);
    expect(el.x).toBe(40);
  });

  it("uses default yOffset of 50", () => {
    const el = createElement("text");
    expect(el.y).toBe(50);
  });

  it("uses custom yOffset", () => {
    const el = createElement("text", 200);
    expect(el.y).toBe(200);
  });

  // Specific element type checks
  it("heading has correct defaults", () => {
    const el = createElement("heading");
    if (el.type === "heading") {
      expect(el.content).toBe("New Heading");
      expect(el.fontSize).toBe(24);
      expect(el.bold).toBe(true);
      expect(el.color).toBe("#1E40AF");
      expect(el.width).toBe(420);
    }
  });

  it("text has correct defaults", () => {
    const el = createElement("text");
    if (el.type === "text") {
      expect(el.content).toContain("New text block");
      expect(el.fontSize).toBe(12);
      expect(el.bold).toBe(false);
    }
  });

  it("link has correct defaults", () => {
    const el = createElement("link");
    if (el.type === "link") {
      expect(el.content).toBe("Click here");
      expect(el.href).toBe("https://");
      expect(el.underline).toBe(true);
    }
  });

  it("table has correct defaults", () => {
    const el = createElement("table");
    if (el.type === "table") {
      expect(el.mode).toBe("manual");
      expect(el.headers).toHaveLength(3);
      expect(el.rows).toHaveLength(2);
      expect(el.width).toBe(515);
    }
  });

  it("divider has correct defaults", () => {
    const el = createElement("divider");
    if (el.type === "divider") {
      expect(el.thickness).toBe(1);
      expect(el.width).toBe(515);
    }
  });

  it("image has correct defaults", () => {
    const el = createElement("image");
    if (el.type === "image") {
      expect(el.label).toBe("Image");
      expect(el.width).toBe(200);
      expect(el.height).toBe(120);
    }
  });

  it("card has correct defaults", () => {
    const el = createElement("card");
    if (el.type === "card") {
      expect(el.title).toBe("Sensor Name");
      expect(el.value).toBe("0.0");
      expect(el.unit).toBe("unit");
    }
  });

  it("chart has correct defaults", () => {
    const el = createElement("chart");
    if (el.type === "chart") {
      expect(el.width).toBe(400);
      expect(el.height).toBe(250);
      expect(el.option).toEqual({});
    }
  });

  it("shape has correct defaults", () => {
    const el = createElement("shape");
    if (el.type === "shape") {
      expect(el.shapeType).toBe("rectangle");
      expect(el.borderRadius).toBe(8);
    }
  });

  it("repeater has correct defaults and cardElements", () => {
    const el = createElement("repeater");
    if (el.type === "repeater") {
      expect(el.label).toBe("Sensor Group");
      expect(el.dataKey).toBe("sensor_group");
      expect(el.cardElements.length).toBeGreaterThan(0);
      expect(el.itemsPerRow).toBe(1);
      expect(el.gap).toBe(12);
      // Verify cardElements contain various types
      const types = el.cardElements.map((c) => c.type);
      expect(types).toContain("heading");
      expect(types).toContain("card");
      expect(types).toContain("chart");
      expect(types).toContain("table");
      expect(types).toContain("text");
    }
  });
});
