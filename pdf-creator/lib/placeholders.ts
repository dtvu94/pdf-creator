import type { Template, TableElement, ChartElement, TemplateElement, RepeaterElement, RepeaterItem } from "@/types/template";

const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g;

/** Placeholder names that are resolved at PDF render time and must not appear in the fill-in form. */
const RESERVED_PLACEHOLDERS = new Set(["page_number", "total_pages"]);

function extractFromElements(elements: TemplateElement[], names: Set<string>) {
  for (const el of elements) {
    if (el.type === "text" || el.type === "heading") {
      for (const m of el.content.matchAll(PLACEHOLDER_RE)) {
        const name = m[1].trim();
        if (!RESERVED_PLACEHOLDERS.has(name)) names.add(name);
      }
    } else if (el.type === "table") {
      for (const h of el.headers) {
        for (const m of h.matchAll(PLACEHOLDER_RE)) {
          const name = m[1].trim();
          if (!RESERVED_PLACEHOLDERS.has(name)) names.add(name);
        }
      }
      for (const row of el.rows) {
        for (const cell of row) {
          for (const m of cell.matchAll(PLACEHOLDER_RE)) {
            const name = m[1].trim();
            if (!RESERVED_PLACEHOLDERS.has(name)) names.add(name);
          }
        }
      }
    }
  }
}

/** Returns all unique placeholder names found in the template. */
export function extractPlaceholders(template: Template): string[] {
  const names = new Set<string>();

  for (const page of template.pages) {
    if (page.header) extractFromElements(page.header.elements, names);
    if (page.footer) extractFromElements(page.footer.elements, names);
    extractFromElements(page.elements, names);
  }

  return [...names];
}

function replaceIn(text: string, values: Record<string, string>): string {
  return text.replaceAll(PLACEHOLDER_RE, (match, key) => {
    const name = key.trim();
    if (RESERVED_PLACEHOLDERS.has(name)) return match;
    return values[name] ?? match;
  });
}

/** Returns all tables that have mode "auto" (rows come from CSV at export time). */
export function collectAutoTables(template: Template): TableElement[] {
  const tables: TableElement[] = [];
  for (const page of template.pages) {
    for (const section of [page.header, page.footer]) {
      if (section) {
        for (const el of section.elements) {
          if (el.type === "table" && el.mode === "auto") tables.push(el);
        }
      }
    }
    for (const el of page.elements) {
      if (el.type === "table" && el.mode === "auto") tables.push(el);
    }
  }
  return tables;
}

function applyValuesToElements(
  elements: TemplateElement[],
  values: Record<string, string>
): TemplateElement[] {
  return elements.map((el) => {
    if (el.type === "text" || el.type === "heading") {
      return { ...el, content: replaceIn(el.content, values) };
    }
    if (el.type === "table") {
      return {
        ...el,
        headers: el.headers.map((h) => replaceIn(h, values)),
        rows: el.rows.map((row) => row.map((cell) => replaceIn(cell, values))),
      };
    }
    return el;
  });
}

function applyAutoRowsToElements(
  elements: TemplateElement[],
  rowsById: Map<string, string[][]>
): TemplateElement[] {
  return elements.map((el) => {
    if (el.type === "table" && el.mode === "auto" && rowsById.has(el.id)) {
      return { ...el, rows: rowsById.get(el.id)! };
    }
    return el;
  });
}

/** Returns a deep copy of the template with auto table rows replaced by the provided CSV rows. */
export function applyAutoRows(template: Template, rowsById: Map<string, string[][]>): Template {
  return {
    ...template,
    pages: template.pages.map((page) => ({
      ...page,
      header: page.header
        ? { ...page.header, elements: applyAutoRowsToElements(page.header.elements, rowsById) }
        : undefined,
      footer: page.footer
        ? { ...page.footer, elements: applyAutoRowsToElements(page.footer.elements, rowsById) }
        : undefined,
      elements: applyAutoRowsToElements(page.elements, rowsById),
    })),
  };
}

/** Returns all chart elements from the template in document order. */
export function collectCharts(template: Template): ChartElement[] {
  const charts: ChartElement[] = [];
  for (const page of template.pages) {
    for (const section of [page.header, page.footer]) {
      if (section) {
        for (const el of section.elements) {
          if (el.type === "chart") charts.push(el);
        }
      }
    }
    for (const el of page.elements) {
      if (el.type === "chart") charts.push(el);
    }
  }
  return charts;
}

function applyChartImagesToElements(
  elements: TemplateElement[],
  imagesById: Map<string, string>
): TemplateElement[] {
  return elements.map((el) => {
    if (el.type === "chart" && imagesById.has(el.id)) {
      return { ...el, renderedImage: imagesById.get(el.id)! };
    }
    return el;
  });
}

/** Returns a deep copy of the template with chart elements' renderedImage set from the provided map. */
export function applyChartImages(template: Template, imagesById: Map<string, string>): Template {
  return {
    ...template,
    pages: template.pages.map((page) => ({
      ...page,
      header: page.header
        ? { ...page.header, elements: applyChartImagesToElements(page.header.elements, imagesById) }
        : undefined,
      footer: page.footer
        ? { ...page.footer, elements: applyChartImagesToElements(page.footer.elements, imagesById) }
        : undefined,
      elements: applyChartImagesToElements(page.elements, imagesById),
    })),
  };
}

/** Returns all repeater elements from the template body pages (header/footer excluded). */
export function collectRepeaters(template: Template): RepeaterElement[] {
  const repeaters: RepeaterElement[] = [];
  for (const page of template.pages) {
    for (const el of page.elements) {
      if (el.type === "repeater") repeaters.push(el);
    }
  }
  return repeaters;
}

function applyRepeaterItemsToElements(
  elements: TemplateElement[],
  itemsById: Map<string, RepeaterItem[]>
): TemplateElement[] {
  return elements.map((el) => {
    if (el.type === "repeater" && itemsById.has(el.id)) {
      return { ...el, items: itemsById.get(el.id)! };
    }
    return el;
  });
}

/** Returns a deep copy of the template with repeater items injected from the provided map. */
export function applyRepeaterItems(
  template: Template,
  itemsById: Map<string, RepeaterItem[]>
): Template {
  return {
    ...template,
    pages: template.pages.map((page) => ({
      ...page,
      elements: applyRepeaterItemsToElements(page.elements, itemsById),
    })),
  };
}

/** Returns a deep copy of the template with all placeholders replaced by the given values. */
export function applyValues(template: Template, values: Record<string, string>): Template {
  return {
    ...template,
    pages: template.pages.map((page) => ({
      ...page,
      header: page.header
        ? { ...page.header, elements: applyValuesToElements(page.header.elements, values) }
        : undefined,
      footer: page.footer
        ? { ...page.footer, elements: applyValuesToElements(page.footer.elements, values) }
        : undefined,
      elements: applyValuesToElements(page.elements, values),
    })),
  };
}
