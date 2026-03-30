import type { Template, TemplatePage, TemplateElement } from "@/types/template";
import {
  getSectionElements,
  updateSectionElements,
  reorderZIndex,
  computeAlignment,
} from "../templateUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const el = (id: string, x: number, y: number, w = 100, h = 40): TemplateElement =>
  ({
    id,
    x,
    y,
    type: "text" as const,
    content: "",
    fontSize: 12,
    bold: false,
    italic: false,
    underline: false,
    color: "#000",
    width: w,
    ...(h !== 40 ? { height: h } : {}),
  }) as unknown as TemplateElement;

const makeTemplate = (pages: TemplatePage[]): Template =>
  ({ name: "test", pages, styles: { primaryColor: "#000" }, fontFamily: "Roboto" }) as Template;

const makePage = (
  overrides: Partial<TemplatePage> = {}
): TemplatePage => ({
  id: "page-1",
  elements: [el("b1", 0, 0), el("b2", 10, 10)],
  ...overrides,
});

// ---------------------------------------------------------------------------
// getSectionElements
// ---------------------------------------------------------------------------

describe("getSectionElements", () => {
  it("returns [] when page is undefined", () => {
    expect(getSectionElements("body", undefined)).toEqual([]);
  });

  it('returns header elements for section "header"', () => {
    const headerEls = [el("h1", 0, 0)];
    const page = makePage({ header: { height: 50, elements: headerEls } });
    expect(getSectionElements("header", page)).toBe(headerEls);
  });

  it('returns [] for section "header" when header is absent', () => {
    const page = makePage();
    expect(getSectionElements("header", page)).toEqual([]);
  });

  it('returns footer elements for section "footer"', () => {
    const footerEls = [el("f1", 0, 0)];
    const page = makePage({ footer: { height: 30, elements: footerEls } });
    expect(getSectionElements("footer", page)).toBe(footerEls);
  });

  it('returns [] for section "footer" when footer is absent', () => {
    const page = makePage();
    expect(getSectionElements("footer", page)).toEqual([]);
  });

  it('returns page.elements for section "body"', () => {
    const bodyEls = [el("b1", 0, 0)];
    const page = makePage({ elements: bodyEls });
    expect(getSectionElements("body", page)).toBe(bodyEls);
  });

  it('returns [] for section "body" when elements is undefined', () => {
    const page = { id: "p", elements: undefined } as unknown as TemplatePage;
    expect(getSectionElements("body", page)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// updateSectionElements
// ---------------------------------------------------------------------------

describe("updateSectionElements", () => {
  const addMarker = (els: TemplateElement[]) => [...els, el("new", 99, 99)];

  it("updates body section elements", () => {
    const t = makeTemplate([makePage()]);
    const result = updateSectionElements(t, 0, "body", addMarker);
    expect(result.pages[0].elements).toHaveLength(3);
    expect(result.pages[0].elements[2].id).toBe("new");
  });

  it("updates header section when header exists", () => {
    const page = makePage({ header: { height: 50, elements: [el("h1", 0, 0)] } });
    const t = makeTemplate([page]);
    const result = updateSectionElements(t, 0, "header", addMarker);
    expect(result.pages[0].header!.elements).toHaveLength(2);
    expect(result.pages[0].header!.elements[1].id).toBe("new");
  });

  it("updates footer section when footer exists", () => {
    const page = makePage({ footer: { height: 30, elements: [el("f1", 0, 0)] } });
    const t = makeTemplate([page]);
    const result = updateSectionElements(t, 0, "footer", addMarker);
    expect(result.pages[0].footer!.elements).toHaveLength(2);
    expect(result.pages[0].footer!.elements[1].id).toBe("new");
  });

  it("falls through to body when updating header but no header exists", () => {
    const t = makeTemplate([makePage()]);
    const result = updateSectionElements(t, 0, "header", addMarker);
    // No header → falls through to default body update
    expect(result.pages[0].elements).toHaveLength(3);
    expect(result.pages[0].header).toBeUndefined();
  });

  it("falls through to body when updating footer but no footer exists", () => {
    const t = makeTemplate([makePage()]);
    const result = updateSectionElements(t, 0, "footer", addMarker);
    expect(result.pages[0].elements).toHaveLength(3);
    expect(result.pages[0].footer).toBeUndefined();
  });

  it("leaves non-matching page indices unchanged", () => {
    const page0 = makePage({ id: "p0" });
    const page1 = makePage({ id: "p1" });
    const t = makeTemplate([page0, page1]);
    const result = updateSectionElements(t, 1, "body", addMarker);
    // page 0 is untouched (same reference)
    expect(result.pages[0]).toBe(page0);
    expect(result.pages[1].elements).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// reorderZIndex
// ---------------------------------------------------------------------------

describe("reorderZIndex", () => {
  const els = [el("a", 0, 0), el("b", 1, 1), el("c", 2, 2)];

  it('"up" moves element one position later in the array', () => {
    const result = reorderZIndex(els, "a", "up");
    expect(result.map((e) => e.id)).toEqual(["b", "a", "c"]);
  });

  it('"down" moves element one position earlier in the array', () => {
    const result = reorderZIndex(els, "c", "down");
    expect(result.map((e) => e.id)).toEqual(["a", "c", "b"]);
  });

  it('"top" moves element to the end of the array', () => {
    const result = reorderZIndex(els, "a", "top");
    expect(result.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it('"bottom" moves element to the start of the array', () => {
    const result = reorderZIndex(els, "c", "bottom");
    expect(result.map((e) => e.id)).toEqual(["c", "a", "b"]);
  });

  it("returns original array when target ID is not found", () => {
    const result = reorderZIndex(els, "missing", "up");
    expect(result).toBe(els);
  });

  it('"up" at last position stays at end', () => {
    const result = reorderZIndex(els, "c", "up");
    expect(result.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it('"down" at first position stays at start', () => {
    const result = reorderZIndex(els, "a", "down");
    expect(result.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });
});

// ---------------------------------------------------------------------------
// computeAlignment
// ---------------------------------------------------------------------------

describe("computeAlignment", () => {
  it("returns original array when fewer than 2 elements are selected", () => {
    const els = [el("a", 10, 20), el("b", 50, 60)];
    const result = computeAlignment(els, new Set(["a"]), "left");
    expect(result).toBe(els);
  });

  it("returns original array when no elements are selected", () => {
    const els = [el("a", 10, 20)];
    const result = computeAlignment(els, new Set(), "left");
    expect(result).toBe(els);
  });

  describe("left", () => {
    it("aligns all selected elements to the minimum x", () => {
      const els = [el("a", 10, 0), el("b", 50, 0), el("c", 30, 0)];
      const result = computeAlignment(els, new Set(["a", "b", "c"]), "left");
      expect(result.map((e) => e.x)).toEqual([10, 10, 10]);
    });
  });

  describe("right", () => {
    it("aligns all selected elements to the max right edge", () => {
      // a: x=10, w=100 → right=110
      // b: x=50, w=200 → right=250
      const els = [el("a", 10, 0, 100), el("b", 50, 0, 200)];
      const result = computeAlignment(els, new Set(["a", "b"]), "right");
      // maxRight = 250; a.x = 250-100=150, b.x = 250-200=50
      expect(result[0].x).toBe(150);
      expect(result[1].x).toBe(50);
    });
  });

  describe("center", () => {
    it("aligns all selected elements to horizontal center", () => {
      // a: x=0, w=100 → right=100
      // b: x=200, w=100 → right=300
      // center = (0+300)/2 = 150
      const els = [el("a", 0, 0, 100), el("b", 200, 0, 100)];
      const result = computeAlignment(els, new Set(["a", "b"]), "center");
      // a.x = round(150 - 50) = 100, b.x = round(150 - 50) = 100
      expect(result[0].x).toBe(100);
      expect(result[1].x).toBe(100);
    });
  });

  describe("top", () => {
    it("aligns all selected elements to the minimum y", () => {
      const els = [el("a", 0, 10), el("b", 0, 50), el("c", 0, 30)];
      const result = computeAlignment(els, new Set(["a", "b", "c"]), "top");
      expect(result.map((e) => e.y)).toEqual([10, 10, 10]);
    });
  });

  describe("bottom", () => {
    it("aligns all selected elements to the max bottom edge", () => {
      // a: y=10, h=40 → bottom=50
      // b: y=100, h=60 → bottom=160
      const els = [el("a", 0, 10, 100, 40), el("b", 0, 100, 100, 60)];
      const result = computeAlignment(els, new Set(["a", "b"]), "bottom");
      // maxBottom = 160; a.y = 160-40=120, b.y = 160-60=100
      expect(result[0].y).toBe(120);
      expect(result[1].y).toBe(100);
    });
  });

  describe("middle", () => {
    it("aligns all selected elements to vertical center", () => {
      // a: y=0, h=40 → bottom=40
      // b: y=200, h=40 → bottom=240
      // cy = (0+240)/2 = 120
      const els = [el("a", 0, 0, 100, 40), el("b", 0, 200, 100, 40)];
      const result = computeAlignment(els, new Set(["a", "b"]), "middle");
      // a.y = round(120 - 20) = 100, b.y = round(120 - 20) = 100
      expect(result[0].y).toBe(100);
      expect(result[1].y).toBe(100);
    });
  });

  describe("distribute-h", () => {
    it("distributes elements evenly along the horizontal axis", () => {
      // 3 elements: widths 100, 100, 100
      // sorted by x: a(0), b(50), c(300)
      // first = 0, last = 300+100 = 400
      // totalWidth = 300, gap = (400 - 300) / 2 = 50
      // a: 0, b: 0+100+50=150, c: 150+100+50=300
      const els = [el("a", 0, 0, 100), el("b", 50, 0, 100), el("c", 300, 0, 100)];
      const result = computeAlignment(els, new Set(["a", "b", "c"]), "distribute-h");
      expect(result.find((e) => e.id === "a")!.x).toBe(0);
      expect(result.find((e) => e.id === "b")!.x).toBe(150);
      expect(result.find((e) => e.id === "c")!.x).toBe(300);
    });
  });

  describe("distribute-v", () => {
    it("distributes elements evenly along the vertical axis", () => {
      // 3 elements: heights 40, 40, 40
      // sorted by y: a(0), b(30), c(200)
      // first = 0, last = 200+40 = 240
      // totalHeight = 120, gap = (240 - 120) / 2 = 60
      // a: 0, b: 0+40+60=100, c: 100+40+60=200
      const els = [el("a", 0, 0, 100, 40), el("b", 0, 30, 100, 40), el("c", 0, 200, 100, 40)];
      const result = computeAlignment(els, new Set(["a", "b", "c"]), "distribute-v");
      expect(result.find((e) => e.id === "a")!.y).toBe(0);
      expect(result.find((e) => e.id === "b")!.y).toBe(100);
      expect(result.find((e) => e.id === "c")!.y).toBe(200);
    });
  });

  describe("default / unknown alignment", () => {
    it("returns original array for unknown alignment value", () => {
      const els = [el("a", 0, 0), el("b", 10, 10)];
      const result = computeAlignment(
        els,
        new Set(["a", "b"]),
        "unknown" as Parameters<typeof computeAlignment>[2]
      );
      expect(result).toBe(els);
    });
  });

  describe("default width/height", () => {
    it("uses default width of 100 and height of 40 when not provided", () => {
      // Elements without explicit height (h=40 is omitted by our helper)
      const a = el("a", 0, 0);
      const b = el("b", 200, 0);
      // These elements have width=100 (explicit) and no height property (defaults to 40 in computeAlignment)
      const result = computeAlignment([a, b], new Set(["a", "b"]), "right");
      // maxRight = 200+100 = 300; a.x = 300-100 = 200
      expect(result[0].x).toBe(200);
      expect(result[1].x).toBe(200);
    });
  });

  describe("non-selected elements", () => {
    it("leaves non-selected elements unchanged", () => {
      const els = [el("a", 10, 0), el("b", 50, 0), el("c", 30, 0)];
      const result = computeAlignment(els, new Set(["a", "b"]), "left");
      // a and b aligned to x=10, c untouched at x=30
      expect(result[0].x).toBe(10);
      expect(result[1].x).toBe(10);
      expect(result[2].x).toBe(30);
    });
  });
});
