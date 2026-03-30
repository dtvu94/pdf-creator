import { DEFAULT_TEMPLATE } from "@/lib/templates/report";
import { INVOICE_TEMPLATE } from "@/lib/templates/invoice";
import { EMPLOYEE_DIRECTORY_TEMPLATE } from "@/lib/templates/employee-directory";
import { SENSOR_DASHBOARD_TEMPLATE } from "@/lib/templates/sensor-dashboard";
import { CHART_SHOWCASE_TEMPLATE } from "@/lib/templates/chart-showcase";
import { SENSOR_REPORT_TEMPLATE } from "@/lib/templates/sensor-report";
import type { Template } from "@/types/template";

// ─── Template data validation ────────────────────────────────────────────────

const ALL_TEMPLATES: [string, Template][] = [
  ["report (DEFAULT_TEMPLATE)", DEFAULT_TEMPLATE],
  ["invoice", INVOICE_TEMPLATE],
  ["employee-directory", EMPLOYEE_DIRECTORY_TEMPLATE],
  ["sensor-dashboard", SENSOR_DASHBOARD_TEMPLATE],
  ["chart-showcase", CHART_SHOWCASE_TEMPLATE],
  ["sensor-report", SENSOR_REPORT_TEMPLATE],
];

describe.each(ALL_TEMPLATES)("%s template", (_name, template) => {
  it("has a non-empty name", () => {
    expect(typeof template.name).toBe("string");
    expect(template.name.length).toBeGreaterThan(0);
  });

  it("has a pages array with at least one page", () => {
    expect(Array.isArray(template.pages)).toBe(true);
    expect(template.pages.length).toBeGreaterThan(0);
  });

  it("each page has an id and elements array", () => {
    for (const page of template.pages) {
      expect(typeof page.id).toBe("string");
      expect(page.id.length).toBeGreaterThan(0);
      expect(Array.isArray(page.elements)).toBe(true);
    }
  });

  it("has a styles object with primaryColor", () => {
    expect(template.styles).toBeDefined();
    expect(typeof template.styles.primaryColor).toBe("string");
    expect(template.styles.primaryColor).toMatch(/^#/);
  });

  it("every element has id, x, y, and type", () => {
    for (const page of template.pages) {
      const allElements = [
        ...page.elements,
        ...(page.header?.elements ?? []),
        ...(page.footer?.elements ?? []),
      ];
      for (const el of allElements) {
        expect(typeof el.id).toBe("string");
        expect(el.id.length).toBeGreaterThan(0);
        expect(typeof el.x).toBe("number");
        expect(typeof el.y).toBe("number");
        expect(typeof el.type).toBe("string");
      }
    }
  });

  it("has pageSize set (or defaults to A4)", () => {
    if (template.pageSize) {
      expect(["A4", "A3", "A5"]).toContain(template.pageSize);
    }
  });

  it("has fonts array with bundled fonts when present", () => {
    if (template.fonts) {
      expect(Array.isArray(template.fonts)).toBe(true);
      expect(template.fonts.length).toBeGreaterThan(0);
      for (const font of template.fonts) {
        expect(typeof font.family).toBe("string");
        expect(Array.isArray(font.faces)).toBe(true);
      }
    }
  });
});

// ─── Specific template checks ────────────────────────────────────────────────

describe("specific template characteristics", () => {
  it("report template has multiple pages", () => {
    expect(DEFAULT_TEMPLATE.pages.length).toBeGreaterThanOrEqual(5);
  });

  it("invoice template has 1 page", () => {
    expect(INVOICE_TEMPLATE.pages.length).toBe(1);
  });

  it("employee-directory template has 1 page", () => {
    expect(EMPLOYEE_DIRECTORY_TEMPLATE.pages.length).toBe(1);
  });

  it("sensor-dashboard template has 1 page", () => {
    expect(SENSOR_DASHBOARD_TEMPLATE.pages.length).toBe(1);
  });

  it("chart-showcase template has multiple pages", () => {
    expect(CHART_SHOWCASE_TEMPLATE.pages.length).toBeGreaterThanOrEqual(2);
  });

  it("invoice template contains a table element", () => {
    const hasTable = INVOICE_TEMPLATE.pages[0].elements.some((el) => el.type === "table");
    expect(hasTable).toBe(true);
  });

  it("employee-directory template has a header section", () => {
    expect(EMPLOYEE_DIRECTORY_TEMPLATE.pages[0].header).toBeDefined();
    expect(EMPLOYEE_DIRECTORY_TEMPLATE.pages[0].header!.elements.length).toBeGreaterThan(0);
  });

  it("sensor-dashboard template contains card elements", () => {
    const hasCard = SENSOR_DASHBOARD_TEMPLATE.pages[0].elements.some((el) => el.type === "card");
    expect(hasCard).toBe(true);
  });

  it("chart-showcase template contains chart elements", () => {
    const hasChart = CHART_SHOWCASE_TEMPLATE.pages.some((page) =>
      page.elements.some((el) => el.type === "chart")
    );
    expect(hasChart).toBe(true);
  });

  it("sensor-report template contains repeater elements", () => {
    const hasRepeater = SENSOR_REPORT_TEMPLATE.pages.some((page) =>
      page.elements.some((el) => el.type === "repeater")
    );
    expect(hasRepeater).toBe(true);
  });
});
