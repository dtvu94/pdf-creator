import {
  getTemplateById,
  TEMPLATE_REGISTRY,
  DEFAULT_TEMPLATE,
  INVOICE_TEMPLATE,
  EMPLOYEE_DIRECTORY_TEMPLATE,
  SENSOR_DASHBOARD_TEMPLATE,
  CHART_SHOWCASE_TEMPLATE,
  SENSOR_REPORT_TEMPLATE,
  CV_TEMPLATE,
  COVER_LETTER_TEMPLATE,
  MEETING_MINUTES_TEMPLATE,
  PROJECT_PROPOSAL_TEMPLATE,
  PURCHASE_ORDER_TEMPLATE,
  QUOTATION_TEMPLATE,
  CERTIFICATE_TEMPLATE,
  NDA_TEMPLATE,
  RESEARCH_PAPER_TEMPLATE,
  LESSON_PLAN_TEMPLATE,
  EVENT_INVITATION_TEMPLATE,
  TRAVEL_ITINERARY_TEMPLATE,
} from "@/lib/templates/index";

// ─── TEMPLATE_REGISTRY ───────────────────────────────────────────────────────

describe("TEMPLATE_REGISTRY", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(TEMPLATE_REGISTRY)).toBe(true);
    expect(TEMPLATE_REGISTRY.length).toBeGreaterThan(0);
  });

  it("each entry has id, name, description, and accentColor", () => {
    for (const entry of TEMPLATE_REGISTRY) {
      expect(typeof entry.id).toBe("string");
      expect(entry.id.length).toBeGreaterThan(0);
      expect(typeof entry.name).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe("string");
      expect(entry.description.length).toBeGreaterThan(0);
      expect(typeof entry.accentColor).toBe("string");
      expect(entry.accentColor).toMatch(/^#/);
    }
  });

  it("has unique IDs", () => {
    const ids = TEMPLATE_REGISTRY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains all expected template IDs", () => {
    const ids = TEMPLATE_REGISTRY.map((t) => t.id);
    expect(ids).toContain("report");
    expect(ids).toContain("invoice");
    expect(ids).toContain("employee-directory");
    expect(ids).toContain("sensor-dashboard");
    expect(ids).toContain("chart-showcase");
    expect(ids).toContain("sensor-report");
    expect(ids).toContain("cv");
    expect(ids).toContain("cover-letter");
    expect(ids).toContain("meeting-minutes");
    expect(ids).toContain("project-proposal");
    expect(ids).toContain("purchase-order");
    expect(ids).toContain("quotation");
    expect(ids).toContain("certificate");
    expect(ids).toContain("nda");
    expect(ids).toContain("research-paper");
    expect(ids).toContain("lesson-plan");
    expect(ids).toContain("event-invitation");
    expect(ids).toContain("travel-itinerary");
  });
});

// ─── getTemplateById ─────────────────────────────────────────────────────────

describe("getTemplateById", () => {
  const knownIds = [
    "report",
    "invoice",
    "employee-directory",
    "sensor-dashboard",
    "chart-showcase",
    "sensor-report",
    "cv",
    "cover-letter",
    "meeting-minutes",
    "project-proposal",
    "purchase-order",
    "quotation",
    "certificate",
    "nda",
    "research-paper",
    "lesson-plan",
    "event-invitation",
    "travel-itinerary",
  ];

  it.each(knownIds)("returns a valid template for '%s'", (id) => {
    const template = getTemplateById(id);
    expect(template).toBeDefined();
    expect(typeof template.name).toBe("string");
    expect(Array.isArray(template.pages)).toBe(true);
    expect(template.pages.length).toBeGreaterThan(0);
  });

  it("returns a blank template for 'blank'", () => {
    const template = getTemplateById("blank");
    expect(template.name).toBe("Untitled Template");
    expect(template.pages).toHaveLength(1);
    expect(template.pages[0].elements).toEqual([]);
  });

  it("blank template has pageSize A4", () => {
    const template = getTemplateById("blank");
    expect(template.pageSize).toBe("A4");
  });

  it("blank template has BUNDLED_FONTS", () => {
    const template = getTemplateById("blank");
    expect(template.fonts).toBeDefined();
    expect(template.fonts!.length).toBeGreaterThan(0);
  });

  it("returns the default (report) template for unknown IDs", () => {
    const unknown = getTemplateById("nonexistent-id");
    const report = getTemplateById("report");
    expect(unknown.name).toBe(report.name);
  });

  it("blank template generates a fresh page ID on each call", () => {
    const t1 = getTemplateById("blank");
    const t2 = getTemplateById("blank");
    expect(t1.pages[0].id).not.toBe(t2.pages[0].id);
  });
});

// ─── Re-exports ─────────────────────────────────────────────────────────────

describe("re-exports", () => {
  const templates = [
    { name: "DEFAULT_TEMPLATE", value: DEFAULT_TEMPLATE },
    { name: "INVOICE_TEMPLATE", value: INVOICE_TEMPLATE },
    { name: "EMPLOYEE_DIRECTORY_TEMPLATE", value: EMPLOYEE_DIRECTORY_TEMPLATE },
    { name: "SENSOR_DASHBOARD_TEMPLATE", value: SENSOR_DASHBOARD_TEMPLATE },
    { name: "CHART_SHOWCASE_TEMPLATE", value: CHART_SHOWCASE_TEMPLATE },
    { name: "SENSOR_REPORT_TEMPLATE", value: SENSOR_REPORT_TEMPLATE },
    { name: "CV_TEMPLATE", value: CV_TEMPLATE },
    { name: "COVER_LETTER_TEMPLATE", value: COVER_LETTER_TEMPLATE },
    { name: "MEETING_MINUTES_TEMPLATE", value: MEETING_MINUTES_TEMPLATE },
    { name: "PROJECT_PROPOSAL_TEMPLATE", value: PROJECT_PROPOSAL_TEMPLATE },
    { name: "PURCHASE_ORDER_TEMPLATE", value: PURCHASE_ORDER_TEMPLATE },
    { name: "QUOTATION_TEMPLATE", value: QUOTATION_TEMPLATE },
    { name: "CERTIFICATE_TEMPLATE", value: CERTIFICATE_TEMPLATE },
    { name: "NDA_TEMPLATE", value: NDA_TEMPLATE },
    { name: "RESEARCH_PAPER_TEMPLATE", value: RESEARCH_PAPER_TEMPLATE },
    { name: "LESSON_PLAN_TEMPLATE", value: LESSON_PLAN_TEMPLATE },
    { name: "EVENT_INVITATION_TEMPLATE", value: EVENT_INVITATION_TEMPLATE },
    { name: "TRAVEL_ITINERARY_TEMPLATE", value: TRAVEL_ITINERARY_TEMPLATE },
  ];

  it.each(templates)("re-exports $name with pages", ({ value }) => {
    expect(value).toBeDefined();
    expect(value.pages.length).toBeGreaterThan(0);
  });
});
