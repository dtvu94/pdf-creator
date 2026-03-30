import type { Template } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";
import { DEFAULT_TEMPLATE } from "./report";
import { INVOICE_TEMPLATE } from "./invoice";
import { EMPLOYEE_DIRECTORY_TEMPLATE } from "./employee-directory";
import { SENSOR_DASHBOARD_TEMPLATE } from "./sensor-dashboard";
import { CHART_SHOWCASE_TEMPLATE } from "./chart-showcase";
import { SENSOR_REPORT_TEMPLATE } from "./sensor-report";
import { CV_TEMPLATE } from "./cv";
import { COVER_LETTER_TEMPLATE } from "./cover-letter";
import { MEETING_MINUTES_TEMPLATE } from "./meeting-minutes";
import { PROJECT_PROPOSAL_TEMPLATE } from "./project-proposal";
import { PURCHASE_ORDER_TEMPLATE } from "./purchase-order";
import { QUOTATION_TEMPLATE } from "./quotation";
import { CERTIFICATE_TEMPLATE } from "./certificate";
import { NDA_TEMPLATE } from "./nda";
import { RESEARCH_PAPER_TEMPLATE } from "./research-paper";
import { LESSON_PLAN_TEMPLATE } from "./lesson-plan";
import { EVENT_INVITATION_TEMPLATE } from "./event-invitation";
import { TRAVEL_ITINERARY_TEMPLATE } from "./travel-itinerary";

export * from "./utils";
export { DEFAULT_TEMPLATE } from "./report";
export { INVOICE_TEMPLATE } from "./invoice";
export { EMPLOYEE_DIRECTORY_TEMPLATE } from "./employee-directory";
export { SENSOR_DASHBOARD_TEMPLATE } from "./sensor-dashboard";
export { CHART_SHOWCASE_TEMPLATE } from "./chart-showcase";
export { SENSOR_REPORT_TEMPLATE } from "./sensor-report";
export { CV_TEMPLATE } from "./cv";
export { COVER_LETTER_TEMPLATE } from "./cover-letter";
export { MEETING_MINUTES_TEMPLATE } from "./meeting-minutes";
export { PROJECT_PROPOSAL_TEMPLATE } from "./project-proposal";
export { PURCHASE_ORDER_TEMPLATE } from "./purchase-order";
export { QUOTATION_TEMPLATE } from "./quotation";
export { CERTIFICATE_TEMPLATE } from "./certificate";
export { NDA_TEMPLATE } from "./nda";
export { RESEARCH_PAPER_TEMPLATE } from "./research-paper";
export { LESSON_PLAN_TEMPLATE } from "./lesson-plan";
export { EVENT_INVITATION_TEMPLATE } from "./event-invitation";
export { TRAVEL_ITINERARY_TEMPLATE } from "./travel-itinerary";

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  accentColor: string;
}

export const TEMPLATE_REGISTRY: TemplateInfo[] = [
  {
    id: "report",
    name: "Annual Report",
    description: "5-page report with title, executive summary, two statistics pages, and a closing page.",
    accentColor: "#1E40AF",
  },
  {
    id: "invoice",
    name: "Invoice",
    description: "Single-page invoice with itemised billing, tax calculation, and payment details.",
    accentColor: "#0F766E",
  },
  {
    id: "employee-directory",
    name: "Employee Directory",
    description: "Staff listing with an auto table — upload a CSV at export time to populate all employee rows.",
    accentColor: "#065F46",
  },
  {
    id: "sensor-dashboard",
    name: "IoT Sensor Dashboard",
    description: "One-page sensor statistics dashboard with 8 metric cards — temperature, humidity, pressure, CO₂, and more.",
    accentColor: "#0EA5E9",
  },
  {
    id: "chart-showcase",
    name: "Chart Showcase",
    description: "2-page chart report. Page 1: line, bar, and pie charts with pre-configured data. Page 2: scatter and heatmap charts that prompt for an ECharts option at export time.",
    accentColor: "#3B82F6",
  },
  {
    id: "sensor-report",
    name: "Monthly Sensor Report",
    description: "6-page sensor report with a cover page and one repeating card section per sensor type — Temperature, Humidity, Pressure, CO₂, and Motion. Provide per-sensor data at export time.",
    accentColor: "#DC2626",
  },
  {
    id: "cv",
    name: "Professional CV",
    description: "Single-page résumé with a dark sidebar for contact, skills, languages, and education — and a main area for profile summary, work experience, certifications, and references.",
    accentColor: "#1E3A5F",
  },
  {
    id: "cover-letter",
    name: "Cover Letter",
    description: "Single-page cover letter matching the CV style — sender info, recipient address, greeting, body paragraphs, and sign-off.",
    accentColor: "#1E3A5F",
  },
  {
    id: "meeting-minutes",
    name: "Meeting Minutes",
    description: "Meeting record with date, attendees, agenda table, discussion notes, action items with owners and deadlines, and next meeting info.",
    accentColor: "#0F766E",
  },
  {
    id: "project-proposal",
    name: "Project Proposal",
    description: "3-page proposal with cover page, executive summary, problem statement, proposed solution, timeline table, and budget breakdown.",
    accentColor: "#0369A1",
  },
  {
    id: "purchase-order",
    name: "Purchase Order",
    description: "Buyer-initiated order form with vendor info, line items, shipping address, totals, and authorization signature.",
    accentColor: "#7C3AED",
  },
  {
    id: "quotation",
    name: "Quotation",
    description: "Price quote with validity period, itemised line items with discounts, terms & conditions, and client acceptance block.",
    accentColor: "#B45309",
  },
  {
    id: "certificate",
    name: "Certificate",
    description: "Achievement certificate with decorative borders, centred recipient name, description, dual signature blocks, and organization logo.",
    accentColor: "#92400E",
  },
  {
    id: "nda",
    name: "NDA / Contract",
    description: "2-page non-disclosure agreement with party details, five numbered clauses, and dual signature blocks.",
    accentColor: "#1F2937",
  },
  {
    id: "research-paper",
    name: "Research Paper",
    description: "3-page academic paper with title page, abstract, keywords, introduction, methodology, results, conclusion, and numbered references.",
    accentColor: "#1E40AF",
  },
  {
    id: "lesson-plan",
    name: "Lesson Plan",
    description: "Teacher's lesson plan with subject info, learning objectives, materials, phased procedure table, assessment, and homework sections.",
    accentColor: "#7C3AED",
  },
  {
    id: "event-invitation",
    name: "Event Invitation",
    description: "Elegant event invitation with decorative accents, date/time cards, venue details, dress code, and RSVP information.",
    accentColor: "#9333EA",
  },
  {
    id: "travel-itinerary",
    name: "Travel Itinerary",
    description: "2-page day-by-day travel schedule with activity tables, accommodation details, packing checklist, and emergency contacts.",
    accentColor: "#0E7490",
  },
];

const BLANK_TEMPLATE: Template = {
  name: "Untitled Template",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [{ id: makeId(), elements: [] }],
  styles: { primaryColor: "#1E40AF" },
};

export function getTemplateById(id: string): Template {
  if (id === "invoice")            return INVOICE_TEMPLATE;
  if (id === "employee-directory") return EMPLOYEE_DIRECTORY_TEMPLATE;
  if (id === "sensor-dashboard")   return SENSOR_DASHBOARD_TEMPLATE;
  if (id === "chart-showcase")     return CHART_SHOWCASE_TEMPLATE;
  if (id === "sensor-report")      return SENSOR_REPORT_TEMPLATE;
  if (id === "cv")                 return CV_TEMPLATE;
  if (id === "cover-letter")       return COVER_LETTER_TEMPLATE;
  if (id === "meeting-minutes")    return MEETING_MINUTES_TEMPLATE;
  if (id === "project-proposal")   return PROJECT_PROPOSAL_TEMPLATE;
  if (id === "purchase-order")     return PURCHASE_ORDER_TEMPLATE;
  if (id === "quotation")          return QUOTATION_TEMPLATE;
  if (id === "certificate")        return CERTIFICATE_TEMPLATE;
  if (id === "nda")                return NDA_TEMPLATE;
  if (id === "research-paper")     return RESEARCH_PAPER_TEMPLATE;
  if (id === "lesson-plan")        return LESSON_PLAN_TEMPLATE;
  if (id === "event-invitation")   return EVENT_INVITATION_TEMPLATE;
  if (id === "travel-itinerary")   return TRAVEL_ITINERARY_TEMPLATE;
  if (id === "blank")              return { ...BLANK_TEMPLATE, pages: [{ id: makeId(), elements: [] }] };
  return DEFAULT_TEMPLATE; // "report" or unknown
}
