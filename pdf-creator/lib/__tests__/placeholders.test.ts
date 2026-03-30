import type { Template, TemplateElement, RepeaterItem } from "@/types/template";
import {
  extractPlaceholders,
  collectAutoTables,
  applyValues,
  applyAutoRows,
  collectCharts,
  applyChartImages,
  collectRepeaters,
  applyRepeaterItems,
} from "@/lib/placeholders";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTemplate(elements: TemplateElement[], opts?: {
  headerElements?: TemplateElement[];
  footerElements?: TemplateElement[];
}): Template {
  return {
    name: "Test",
    pages: [
      {
        id: "p1",
        elements,
        header: opts?.headerElements
          ? { height: 50, elements: opts.headerElements }
          : undefined,
        footer: opts?.footerElements
          ? { height: 50, elements: opts.footerElements }
          : undefined,
      },
    ],
    styles: { primaryColor: "#000" },
  };
}

function textEl(content: string, id = "t1"): TemplateElement {
  return {
    id, x: 0, y: 0, type: "text", content,
    fontSize: 12, bold: false, italic: false, underline: false,
    color: "#000", width: 100,
  };
}

function headingEl(content: string, id = "h1"): TemplateElement {
  return {
    id, x: 0, y: 0, type: "heading", content,
    fontSize: 24, bold: true, italic: false, underline: false,
    color: "#000", width: 100,
  };
}

function tableEl(
  headers: string[],
  rows: string[][],
  opts?: { mode?: "manual" | "auto"; id?: string }
): TemplateElement {
  return {
    id: opts?.id ?? "tbl1", x: 0, y: 0, type: "table",
    mode: opts?.mode ?? "manual",
    headers, rows,
    headerColor: "#000", headerTextColor: "#fff",
    fontSize: 11, width: 500,
  };
}

function chartEl(id = "ch1"): TemplateElement {
  return {
    id, x: 0, y: 0, type: "chart",
    width: 400, height: 250, option: {},
  };
}

function repeaterEl(id = "rp1"): TemplateElement {
  return {
    id, x: 0, y: 0, type: "repeater",
    label: "Rep", dataKey: "group",
    width: 500, cardWidth: 500, cardHeight: 300,
    itemsPerRow: 1, gap: 10,
    cardElements: [],
  };
}

// ─── extractPlaceholders ─────────────────────────────────────────────────────

describe("extractPlaceholders", () => {
  it("returns empty array when no placeholders exist", () => {
    const t = makeTemplate([textEl("No placeholders here")]);
    expect(extractPlaceholders(t)).toEqual([]);
  });

  it("extracts placeholders from text elements", () => {
    const t = makeTemplate([textEl("Hello {{name}}, age {{age}}")]);
    const result = extractPlaceholders(t);
    expect(result).toContain("name");
    expect(result).toContain("age");
  });

  it("extracts placeholders from heading elements", () => {
    const t = makeTemplate([headingEl("Report: {{title}}")]);
    expect(extractPlaceholders(t)).toContain("title");
  });

  it("extracts placeholders from table headers and cells", () => {
    const t = makeTemplate([
      tableEl(["{{col1}}", "Col2"], [["{{val}}", "fixed"]]),
    ]);
    const result = extractPlaceholders(t);
    expect(result).toContain("col1");
    expect(result).toContain("val");
  });

  it("excludes reserved placeholders (page_number, total_pages)", () => {
    const t = makeTemplate([
      textEl("Page {{page_number}} of {{total_pages}}"),
    ]);
    expect(extractPlaceholders(t)).toEqual([]);
  });

  it("deduplicates placeholder names", () => {
    const t = makeTemplate([
      textEl("{{name}} {{name}}"),
      headingEl("{{name}}"),
    ]);
    const result = extractPlaceholders(t);
    expect(result.filter((n) => n === "name")).toHaveLength(1);
  });

  it("extracts placeholders from header and footer elements", () => {
    const t = makeTemplate([], {
      headerElements: [textEl("{{header_val}}")],
      footerElements: [textEl("{{footer_val}}")],
    });
    const result = extractPlaceholders(t);
    expect(result).toContain("header_val");
    expect(result).toContain("footer_val");
  });

  it("handles template with no header/footer", () => {
    const t = makeTemplate([textEl("{{x}}")]);
    expect(extractPlaceholders(t)).toEqual(["x"]);
  });
});

// ─── collectAutoTables ───────────────────────────────────────────────────────

describe("collectAutoTables", () => {
  it("returns empty array when no auto tables exist", () => {
    const t = makeTemplate([tableEl(["A"], [["1"]], { mode: "manual" })]);
    expect(collectAutoTables(t)).toEqual([]);
  });

  it("collects tables with mode auto from body", () => {
    const t = makeTemplate([
      tableEl(["A"], [], { mode: "auto", id: "auto1" }),
      tableEl(["B"], [], { mode: "manual", id: "manual1" }),
    ]);
    const result = collectAutoTables(t);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("auto1");
  });

  it("collects auto tables from header and footer", () => {
    const autoTable = tableEl(["X"], [], { mode: "auto", id: "hdr-auto" });
    const t = makeTemplate([], { headerElements: [autoTable] });
    const result = collectAutoTables(t);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("hdr-auto");
  });
});

// ─── applyValues ─────────────────────────────────────────────────────────────

describe("applyValues", () => {
  it("replaces placeholders in text elements", () => {
    const t = makeTemplate([textEl("Hello {{name}}")]);
    const result = applyValues(t, { name: "World" });
    const el = result.pages[0].elements[0];
    expect(el.type === "text" && el.content).toBe("Hello World");
  });

  it("replaces placeholders in heading elements", () => {
    const t = makeTemplate([headingEl("Title: {{title}}")]);
    const result = applyValues(t, { title: "Report" });
    const el = result.pages[0].elements[0];
    expect(el.type === "heading" && el.content).toBe("Title: Report");
  });

  it("replaces placeholders in table headers and cells", () => {
    const t = makeTemplate([
      tableEl(["{{h1}}"], [["{{c1}}"]]),
    ]);
    const result = applyValues(t, { h1: "Header", c1: "Cell" });
    const el = result.pages[0].elements[0];
    if (el.type === "table") {
      expect(el.headers[0]).toBe("Header");
      expect(el.rows[0][0]).toBe("Cell");
    } else {
      fail("Expected table element");
    }
  });

  it("preserves reserved placeholders (page_number, total_pages)", () => {
    const t = makeTemplate([textEl("Page {{page_number}} of {{total_pages}}")]);
    const result = applyValues(t, {});
    const el = result.pages[0].elements[0];
    expect(el.type === "text" && el.content).toBe(
      "Page {{page_number}} of {{total_pages}}"
    );
  });

  it("leaves unmatched placeholders untouched", () => {
    const t = makeTemplate([textEl("{{missing}}")]);
    const result = applyValues(t, {});
    const el = result.pages[0].elements[0];
    expect(el.type === "text" && el.content).toBe("{{missing}}");
  });

  it("applies values in header and footer", () => {
    const t = makeTemplate([], {
      headerElements: [textEl("{{h}}")],
      footerElements: [textEl("{{f}}")],
    });
    const result = applyValues(t, { h: "HDR", f: "FTR" });
    const hEl = result.pages[0].header!.elements[0];
    const fEl = result.pages[0].footer!.elements[0];
    expect(hEl.type === "text" && hEl.content).toBe("HDR");
    expect(fEl.type === "text" && fEl.content).toBe("FTR");
  });

  it("does not mutate the original template", () => {
    const t = makeTemplate([textEl("{{x}}")]);
    const original = (t.pages[0].elements[0] as { content: string }).content;
    applyValues(t, { x: "replaced" });
    expect((t.pages[0].elements[0] as { content: string }).content).toBe(original);
  });

  it("passes through non-text/table elements unchanged", () => {
    const divider: TemplateElement = {
      id: "d1", x: 0, y: 0, type: "divider",
      color: "#000", width: 100, thickness: 1,
    };
    const t = makeTemplate([divider]);
    const result = applyValues(t, { any: "val" });
    expect(result.pages[0].elements[0]).toEqual(divider);
  });
});

// ─── applyAutoRows ───────────────────────────────────────────────────────────

describe("applyAutoRows", () => {
  it("replaces rows for auto tables matching the ID", () => {
    const t = makeTemplate([
      tableEl(["A", "B"], [], { mode: "auto", id: "t1" }),
    ]);
    const newRows = [["x", "y"], ["m", "n"]];
    const rowsById = new Map([["t1", newRows]]);
    const result = applyAutoRows(t, rowsById);
    const el = result.pages[0].elements[0];
    if (el.type === "table") {
      expect(el.rows).toEqual(newRows);
    } else {
      fail("Expected table");
    }
  });

  it("leaves auto tables without matching ID unchanged", () => {
    const t = makeTemplate([
      tableEl(["A"], [["orig"]], { mode: "auto", id: "t1" }),
    ]);
    const rowsById = new Map([["other", [["new"]]]]);
    const result = applyAutoRows(t, rowsById);
    const el = result.pages[0].elements[0];
    if (el.type === "table") {
      expect(el.rows).toEqual([["orig"]]);
    }
  });

  it("leaves manual tables untouched", () => {
    const t = makeTemplate([
      tableEl(["A"], [["orig"]], { mode: "manual", id: "t1" }),
    ]);
    const rowsById = new Map([["t1", [["new"]]]]);
    const result = applyAutoRows(t, rowsById);
    const el = result.pages[0].elements[0];
    if (el.type === "table") {
      expect(el.rows).toEqual([["orig"]]);
    }
  });

  it("applies auto rows in header and footer", () => {
    const t = makeTemplate([], {
      headerElements: [tableEl(["A"], [], { mode: "auto", id: "ht" })],
      footerElements: [tableEl(["B"], [], { mode: "auto", id: "ft" })],
    });
    const rowsById = new Map([
      ["ht", [["h1"]]],
      ["ft", [["f1"]]],
    ]);
    const result = applyAutoRows(t, rowsById);
    const hEl = result.pages[0].header!.elements[0];
    const fEl = result.pages[0].footer!.elements[0];
    if (hEl.type === "table") expect(hEl.rows).toEqual([["h1"]]);
    if (fEl.type === "table") expect(fEl.rows).toEqual([["f1"]]);
  });
});

// ─── collectCharts ───────────────────────────────────────────────────────────

describe("collectCharts", () => {
  it("returns empty array when no charts exist", () => {
    const t = makeTemplate([textEl("no charts")]);
    expect(collectCharts(t)).toEqual([]);
  });

  it("collects chart elements from body", () => {
    const t = makeTemplate([chartEl("c1"), chartEl("c2")]);
    expect(collectCharts(t)).toHaveLength(2);
  });

  it("collects chart elements from header and footer", () => {
    const t = makeTemplate([], {
      headerElements: [chartEl("hc")],
      footerElements: [chartEl("fc")],
    });
    const result = collectCharts(t);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["hc", "fc"]);
  });
});

// ─── applyChartImages ────────────────────────────────────────────────────────

describe("applyChartImages", () => {
  it("sets renderedImage for matching chart IDs", () => {
    const t = makeTemplate([chartEl("c1")]);
    const images = new Map([["c1", "data:image/png;base64,abc"]]);
    const result = applyChartImages(t, images);
    const el = result.pages[0].elements[0];
    if (el.type === "chart") {
      expect(el.renderedImage).toBe("data:image/png;base64,abc");
    }
  });

  it("leaves charts without matching ID unchanged", () => {
    const t = makeTemplate([chartEl("c1")]);
    const images = new Map([["other", "data:img"]]);
    const result = applyChartImages(t, images);
    const el = result.pages[0].elements[0];
    if (el.type === "chart") {
      expect(el.renderedImage).toBeUndefined();
    }
  });

  it("applies chart images in header and footer", () => {
    const t = makeTemplate([], {
      headerElements: [chartEl("hc")],
      footerElements: [chartEl("fc")],
    });
    const images = new Map([
      ["hc", "img-h"],
      ["fc", "img-f"],
    ]);
    const result = applyChartImages(t, images);
    const hEl = result.pages[0].header!.elements[0];
    const fEl = result.pages[0].footer!.elements[0];
    if (hEl.type === "chart") expect(hEl.renderedImage).toBe("img-h");
    if (fEl.type === "chart") expect(fEl.renderedImage).toBe("img-f");
  });

  it("does not mutate the original template", () => {
    const t = makeTemplate([chartEl("c1")]);
    applyChartImages(t, new Map([["c1", "img"]]));
    const el = t.pages[0].elements[0];
    if (el.type === "chart") {
      expect(el.renderedImage).toBeUndefined();
    }
  });
});

// ─── collectRepeaters ────────────────────────────────────────────────────────

describe("collectRepeaters", () => {
  it("returns empty array when no repeaters exist", () => {
    const t = makeTemplate([textEl("text")]);
    expect(collectRepeaters(t)).toEqual([]);
  });

  it("collects repeater elements from body (not header/footer)", () => {
    const t = makeTemplate([repeaterEl("r1"), repeaterEl("r2")]);
    const result = collectRepeaters(t);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("does not collect repeaters from header/footer", () => {
    // collectRepeaters only looks at page.elements, not header/footer
    const t: Template = {
      name: "Test",
      pages: [{
        id: "p1",
        elements: [],
        header: { height: 50, elements: [repeaterEl("hr")] },
      }],
      styles: { primaryColor: "#000" },
    };
    expect(collectRepeaters(t)).toEqual([]);
  });
});

// ─── applyRepeaterItems ──────────────────────────────────────────────────────

describe("applyRepeaterItems", () => {
  it("injects items into matching repeater elements", () => {
    const t = makeTemplate([repeaterEl("r1")]);
    const items: RepeaterItem[] = [
      { fields: { name: "Sensor A" } },
      { fields: { name: "Sensor B" } },
    ];
    const itemsById = new Map([["r1", items]]);
    const result = applyRepeaterItems(t, itemsById);
    const el = result.pages[0].elements[0];
    if (el.type === "repeater") {
      expect(el.items).toEqual(items);
    }
  });

  it("leaves repeaters without matching ID unchanged", () => {
    const t = makeTemplate([repeaterEl("r1")]);
    const itemsById = new Map([["other", [{ fields: {} }]]]);
    const result = applyRepeaterItems(t, itemsById);
    const el = result.pages[0].elements[0];
    if (el.type === "repeater") {
      expect(el.items).toBeUndefined();
    }
  });

  it("does not mutate the original template", () => {
    const t = makeTemplate([repeaterEl("r1")]);
    applyRepeaterItems(t, new Map([["r1", [{ fields: { a: "1" } }]]]));
    const el = t.pages[0].elements[0];
    if (el.type === "repeater") {
      expect(el.items).toBeUndefined();
    }
  });
});
