import type { Template, TemplateElement } from "@/types/template";
import { makeId, SAMPLE_LOGO_SRC, BUNDLED_FONTS } from "./utils";

/** Header for report content pages: logo + page title + rule. Height: 76pt. */
function reportHeader(title: string): NonNullable<import("@/types/template").TemplatePage["header"]> {
  return {
    height: 76,
    elements: [
      // Accent bar at the very top of the header
      { id: makeId(), type: "shape", x: 0, y: 0, shapeType: "rectangle", width: 595, height: 4, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
      { id: makeId(), type: "image",   x: 475, y: 22, label: "Logo", width: 80, height: 40, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC },
      { id: makeId(), type: "heading", x: 40,  y: 30, content: title, fontSize: 20, bold: true, italic: false, underline: false, color: "#1E40AF", width: 400 },
      { id: makeId(), type: "divider", x: 40,  y: 63, color: "#1E40AF", width: 515, thickness: 2 },
    ] satisfies TemplateElement[],
  };
}

/** Footer for report pages: rule + company/title + page number. Height: 66pt. */
function reportFooter(): NonNullable<import("@/types/template").TemplatePage["footer"]> {
  return {
    height: 66,
    elements: [
      { id: makeId(), type: "divider", x: 40,  y: 0,  color: "#CBD5E1", width: 515, thickness: 1 },
      { id: makeId(), type: "text",    x: 40,  y: 10, content: "{{company_name}} — {{report_title}}", fontSize: 9, bold: false, italic: false, underline: false, color: "#94A3B8", width: 435 },
      { id: makeId(), type: "text",    x: 520, y: 10, content: "Page {{page_number}}", fontSize: 9, bold: false, italic: false, underline: false, color: "#64748B", width: 35, textAlign: "right" },
      // Bottom accent bar
      { id: makeId(), type: "shape", x: 0, y: 54, shapeType: "rectangle", width: 595, height: 4, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
    ] satisfies TemplateElement[],
  };
}

export const DEFAULT_TEMPLATE: Template = {
  name: "Annual Report Template",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  includeMetadata: true,
  pages: [
    // ── Page 1 · Title ────────────────────────────────────────────────────────
    {
      id: makeId(),
      bookmark: "Title Page",
      elements: [
        // Full-width accent band at top
        { id: makeId(), type: "shape", x: 0, y: 0, shapeType: "rectangle", width: 595, height: 8, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        // Decorative background rectangle behind title area
        { id: makeId(), type: "shape", x: 0, y: 180, shapeType: "rectangle", width: 595, height: 200, fillColor: "#EFF6FF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0, opacity: 0.7 },
        // Vertical accent line
        { id: makeId(), type: "shape", x: 55, y: 225, shapeType: "rectangle", width: 5, height: 130, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 2 },

        { id: makeId(), type: "image",   x: 222, y: 60,  label: "Logo", width: 150, height: 95, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC },
        { id: makeId(), type: "divider", x: 40,  y: 195, color: "#1E40AF", width: 515, thickness: 4 },
        { id: makeId(), type: "heading", x: 72,  y: 218, content: "{{report_title}}", fontSize: 28, bold: true, italic: false, underline: false, color: "#1E293B", width: 450, textAlign: "center", lineHeight: 1.3 },
        { id: makeId(), type: "text",    x: 72,  y: 270, content: "{{report_subtitle}}", fontSize: 16, bold: false, italic: true, underline: false, color: "#475569", width: 450, textAlign: "center" },
        { id: makeId(), type: "divider", x: 40,  y: 320, color: "#CBD5E1", width: 515, thickness: 1 },

        // Info block with improved line height
        { id: makeId(), type: "text",    x: 97,  y: 345,
          content: "Period:       {{report_period}}\nPrepared by:  {{prepared_by}}\nDate:         {{report_date}}",
          fontSize: 13, bold: false, italic: false, underline: false, color: "#374151", width: 400, lineHeight: 1.8 },

        // Decorative circles
        { id: makeId(), type: "shape", x: 460, y: 450, shapeType: "circle", width: 80, height: 80, fillColor: "#DBEAFE", strokeColor: "#93C5FD", strokeWidth: 2, borderRadius: 0, opacity: 0.5 },
        { id: makeId(), type: "shape", x: 500, y: 510, shapeType: "circle", width: 50, height: 50, fillColor: "#BFDBFE", strokeColor: "#60A5FA", strokeWidth: 1, borderRadius: 0, opacity: 0.4 },

        { id: makeId(), type: "divider", x: 40,  y: 760, color: "#1E40AF", width: 515, thickness: 4 },
        { id: makeId(), type: "text",    x: 40,  y: 773, content: "{{company_name}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#64748B", width: 300 },
        { id: makeId(), type: "text",    x: 340, y: 773, content: "Confidential", fontSize: 10, bold: true, italic: false, underline: false, color: "#94A3B8", width: 215, textAlign: "right" },
        // Bottom accent band (A4 height is 841.89pt, so stay within bounds)
        { id: makeId(), type: "shape", x: 0, y: 834, shapeType: "rectangle", width: 595, height: 7, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
      ],
    },

    // ── Page 2 · Executive Summary ───────────────────────────────────────────
    {
      id: makeId(),
      bookmark: "Executive Summary",
      header: reportHeader("Executive Summary"),
      footer: reportFooter(),
      elements: [
        { id: makeId(), type: "text",    x: 40,  y: 2,
          content: "This report presents key findings and performance metrics for {{report_period}}.\nOrganization: {{company_name}} · Prepared by: {{prepared_by}}",
          fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.7 },

        { id: makeId(), type: "heading", x: 40,  y: 52,  content: "Key Findings", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 300 },
        { id: makeId(), type: "divider", x: 40,  y: 76,  color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "table",   x: 40,  y: 88,
          headers: ["Metric", "Target", "Actual", "Variance", "Status"],
          rows: [
            ["Total Revenue",  "$1,200,000", "$1,348,500", "+12.4%", "Achieved"],
            ["Operating Cost", "$800,000",   "$762,300",   "-4.7%",  "Achieved"],
            ["Net Profit",     "$400,000",   "$586,200",   "+46.6%", "Exceeded"],
            ["Customer Sat.",  "85%",        "91%",        "+6%",    "Exceeded"],
            ["Employee Count", "200",        "198",        "-1%",    "On Track"],
          ],
          headerColor: "#1E40AF", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        { id: makeId(), type: "heading", x: 40,  y: 232, content: "Highlights", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 300 },
        { id: makeId(), type: "divider", x: 40,  y: 256, color: "#CBD5E1", width: 515, thickness: 1 },

        // Highlight callout box with shape background
        { id: makeId(), type: "shape", x: 36, y: 264, shapeType: "rectangle", width: 523, height: 150, fillColor: "#F8FAFC", strokeColor: "#E2E8F0", strokeWidth: 1, borderRadius: 8 },
        // Left accent bar on callout
        { id: makeId(), type: "shape", x: 36, y: 264, shapeType: "rectangle", width: 4, height: 150, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 2 },

        { id: makeId(), type: "text",    x: 52,  y: 274,
          content: "• Revenue exceeded the annual target by 12.4%, driven by strong Q3 and Q4 performance.\n• Operating costs reduced by 4.7% through process optimisation and vendor renegotiations.\n• Net profit surpassed projections by 46.6%, reaching the highest figure in company history.\n• Customer satisfaction improved to 91%, reflecting consistent improvements in service delivery.",
          fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 495, lineHeight: 1.8 },
      ],
    },

    // ── Page 3 · KPI Dashboard ───────────────────────────────────────────────
    {
      id: makeId(),
      bookmark: "Key Performance Indicators",
      header: reportHeader("Key Performance Indicators"),
      footer: reportFooter(),
      elements: [
        { id: makeId(), type: "text", x: 40, y: 2,
          content: "Performance overview dashboard for {{report_period}}. All monetary values in USD.",
          fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },

        // ── KPI Row 1 ──
        // Revenue card background
        { id: makeId(), type: "shape", x: 40, y: 36, shapeType: "rectangle", width: 245, height: 100, fillColor: "#FFFFFF", strokeColor: "#DBEAFE", strokeWidth: 2, borderRadius: 10 },
        { id: makeId(), type: "shape", x: 40, y: 36, shapeType: "rectangle", width: 245, height: 5, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "text",  x: 56, y: 50, content: "TOTAL REVENUE", fontSize: 9, bold: true, italic: false, underline: false, color: "#64748B", width: 213, lineHeight: 1.2 },
        { id: makeId(), type: "heading", x: 56, y: 66, content: "$1,348,500", fontSize: 26, bold: true, italic: false, underline: false, color: "#1E293B", width: 213, lineHeight: 1.1 },
        { id: makeId(), type: "text",  x: 56, y: 100, content: "+12.4% vs target", fontSize: 10, bold: true, italic: false, underline: false, color: "#16A34A", width: 213 },

        // Profit card background
        { id: makeId(), type: "shape", x: 310, y: 36, shapeType: "rectangle", width: 245, height: 100, fillColor: "#FFFFFF", strokeColor: "#D1FAE5", strokeWidth: 2, borderRadius: 10 },
        { id: makeId(), type: "shape", x: 310, y: 36, shapeType: "rectangle", width: 245, height: 5, fillColor: "#059669", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "text",  x: 326, y: 50, content: "NET PROFIT", fontSize: 9, bold: true, italic: false, underline: false, color: "#64748B", width: 213, lineHeight: 1.2 },
        { id: makeId(), type: "heading", x: 326, y: 66, content: "$586,200", fontSize: 26, bold: true, italic: false, underline: false, color: "#1E293B", width: 213, lineHeight: 1.1 },
        { id: makeId(), type: "text",  x: 326, y: 100, content: "+46.6% vs target", fontSize: 10, bold: true, italic: false, underline: false, color: "#16A34A", width: 213 },

        // ── KPI Row 2 ──
        // Cost card
        { id: makeId(), type: "shape", x: 40, y: 156, shapeType: "rectangle", width: 245, height: 100, fillColor: "#FFFFFF", strokeColor: "#FEE2E2", strokeWidth: 2, borderRadius: 10 },
        { id: makeId(), type: "shape", x: 40, y: 156, shapeType: "rectangle", width: 245, height: 5, fillColor: "#DC2626", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "text",  x: 56, y: 170, content: "OPERATING COST", fontSize: 9, bold: true, italic: false, underline: false, color: "#64748B", width: 213, lineHeight: 1.2 },
        { id: makeId(), type: "heading", x: 56, y: 186, content: "$762,300", fontSize: 26, bold: true, italic: false, underline: false, color: "#1E293B", width: 213, lineHeight: 1.1 },
        { id: makeId(), type: "text",  x: 56, y: 220, content: "-4.7% vs budget", fontSize: 10, bold: true, italic: false, underline: false, color: "#16A34A", width: 213 },

        // Satisfaction card
        { id: makeId(), type: "shape", x: 310, y: 156, shapeType: "rectangle", width: 245, height: 100, fillColor: "#FFFFFF", strokeColor: "#E9D5FF", strokeWidth: 2, borderRadius: 10 },
        { id: makeId(), type: "shape", x: 310, y: 156, shapeType: "rectangle", width: 245, height: 5, fillColor: "#7C3AED", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "text",  x: 326, y: 170, content: "CUSTOMER SATISFACTION", fontSize: 9, bold: true, italic: false, underline: false, color: "#64748B", width: 213, lineHeight: 1.2 },
        { id: makeId(), type: "heading", x: 326, y: 186, content: "91%", fontSize: 26, bold: true, italic: false, underline: false, color: "#1E293B", width: 213, lineHeight: 1.1 },
        { id: makeId(), type: "text",  x: 326, y: 220, content: "+6% above target", fontSize: 10, bold: true, italic: false, underline: false, color: "#16A34A", width: 213 },

        // ── Commentary section ──
        { id: makeId(), type: "heading", x: 40, y: 286, content: "Quarterly Trend", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 300 },
        { id: makeId(), type: "divider", x: 40, y: 310, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "table",   x: 40, y: 322,
          headers: ["Quarter", "Revenue", "Costs", "Profit", "Margin"],
          rows: [
            ["Q1", "$315,000", "$204,100", "$110,900", "35.2%"],
            ["Q2", "$364,900", "$222,400", "$142,500", "39.1%"],
            ["Q3", "$426,900", "$244,000", "$182,900", "42.8%"],
            ["Q4", "$490,700", "$266,500", "$224,200", "45.7%"],
          ],
          headerColor: "#1E40AF", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        // Callout box
        { id: makeId(), type: "shape", x: 36, y: 454, shapeType: "rectangle", width: 523, height: 70, fillColor: "#EFF6FF", strokeColor: "#BFDBFE", strokeWidth: 1, borderRadius: 8 },
        { id: makeId(), type: "text",  x: 52, y: 464,
          content: "Profit margin improved steadily from 35.2% in Q1 to 45.7% in Q4, demonstrating effective cost management alongside accelerating revenue growth throughout the fiscal year.",
          fontSize: 11, bold: false, italic: true, underline: false, color: "#1E40AF", width: 495, lineHeight: 1.7, textAlign: "justify" },
      ],
    },

    // ── Page 4 · Performance Statistics ───────────────────────────────────────
    {
      id: makeId(),
      bookmark: "Monthly Performance",
      header: reportHeader("Monthly Performance"),
      footer: reportFooter(),
      elements: [
        { id: makeId(), type: "text",    x: 40,  y: 2,
          content: "Monthly breakdown for {{report_period}}. All figures in USD unless stated otherwise.",
          fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },

        { id: makeId(), type: "heading", x: 40,  y: 36,  content: "First Half (H1)", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 300 },
        { id: makeId(), type: "divider", x: 40,  y: 60,  color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "table",   x: 40,  y: 72,
          headers: ["Month", "Revenue", "Expenses", "Profit", "Growth"],
          rows: [
            ["January",  "$98,200",  "$65,100", "$33,100", "—"],
            ["February", "$104,500", "$67,800", "$36,700", "+10.9%"],
            ["March",    "$112,300", "$71,200", "$41,100", "+12.0%"],
            ["April",    "$108,700", "$69,500", "$39,200", "-4.6%"],
            ["May",      "$121,400", "$74,300", "$47,100", "+20.2%"],
            ["June",     "$134,800", "$78,600", "$56,200", "+19.3%"],
          ],
          headerColor: "#1E40AF", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        { id: makeId(), type: "heading", x: 40,  y: 242, content: "Second Half (H2)", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 300 },
        { id: makeId(), type: "divider", x: 40,  y: 266, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "table",   x: 40,  y: 278,
          headers: ["Month", "Revenue", "Expenses", "Profit", "Growth"],
          rows: [
            ["July",      "$128,900", "$76,400", "$52,500", "-6.6%"],
            ["August",    "$141,200", "$81,100", "$60,100", "+14.5%"],
            ["September", "$156,800", "$86,500", "$70,300", "+17.0%"],
            ["October",   "$148,300", "$83,700", "$64,600", "-8.1%"],
            ["November",  "$162,700", "$89,200", "$73,500", "+13.8%"],
            ["December",  "$179,700", "$93,600", "$86,100", "+17.1%"],
          ],
          headerColor: "#1E40AF", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        { id: makeId(), type: "heading", x: 40,  y: 448, content: "Trend Summary", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 300 },
        { id: makeId(), type: "divider", x: 40,  y: 472, color: "#CBD5E1", width: 515, thickness: 1 },

        // Trend callout with accent bar
        { id: makeId(), type: "shape", x: 36, y: 480, shapeType: "rectangle", width: 523, height: 70, fillColor: "#F8FAFC", strokeColor: "#E2E8F0", strokeWidth: 1, borderRadius: 8 },
        { id: makeId(), type: "shape", x: 36, y: 480, shapeType: "rectangle", width: 4, height: 70, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 2 },
        { id: makeId(), type: "text",    x: 52,  y: 490,
          content: "Revenue grew consistently throughout {{report_period}}, with H2 outperforming H1 by 28.4%. December recorded the highest single-month profit at $86,100, while January was the lowest at $33,100.",
          fontSize: 11, bold: false, italic: true, underline: false, color: "#475569", width: 495, lineHeight: 1.7, textAlign: "justify" },
      ],
    },

    // ── Page 5 · Regional Analysis ───────────────────────────────────────────
    {
      id: makeId(),
      bookmark: "Regional Analysis",
      header: reportHeader("Regional Analysis"),
      footer: reportFooter(),
      elements: [
        { id: makeId(), type: "text",    x: 40,  y: 2,
          content: "Revenue breakdown by region and department for {{report_period}}.",
          fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },

        { id: makeId(), type: "heading", x: 40,  y: 36,  content: "Revenue by Region", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 300 },
        { id: makeId(), type: "divider", x: 40,  y: 60,  color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "table",   x: 40,  y: 72,
          headers: ["Region", "Q1", "Q2", "Q3", "Q4", "Annual Total"],
          rows: [
            ["North America", "$182,400", "$211,300", "$243,600", "$274,100", "$911,400"],
            ["Europe",        "$98,700",  "$112,500", "$129,800", "$146,200", "$487,200"],
            ["Asia Pacific",  "$74,300",  "$88,600",  "$102,400", "$118,700", "$384,000"],
            ["Latin America", "$28,100",  "$34,200",  "$39,500",  "$44,600",  "$146,400"],
          ],
          headerColor: "#1E40AF", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        // Regional share visual - colored rectangles as a simple bar chart
        { id: makeId(), type: "heading", x: 40, y: 198, content: "Regional Share", fontSize: 12, bold: true, italic: false, underline: false, color: "#64748B", width: 300 },
        // NA bar (47.3%)
        { id: makeId(), type: "shape", x: 155, y: 198, shapeType: "rectangle", width: 244, height: 14, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 3 },
        { id: makeId(), type: "text",  x: 403, y: 198, content: "N. America 47.3%", fontSize: 9, bold: true, italic: false, underline: false, color: "#1E40AF", width: 150 },
        // EU bar (25.3%)
        { id: makeId(), type: "shape", x: 155, y: 218, shapeType: "rectangle", width: 130, height: 14, fillColor: "#3B82F6", strokeColor: "transparent", strokeWidth: 0, borderRadius: 3 },
        { id: makeId(), type: "text",  x: 290, y: 218, content: "Europe 25.3%", fontSize: 9, bold: true, italic: false, underline: false, color: "#3B82F6", width: 150 },
        // APAC bar (19.9%)
        { id: makeId(), type: "shape", x: 155, y: 238, shapeType: "rectangle", width: 103, height: 14, fillColor: "#60A5FA", strokeColor: "transparent", strokeWidth: 0, borderRadius: 3 },
        { id: makeId(), type: "text",  x: 262, y: 238, content: "Asia Pacific 19.9%", fontSize: 9, bold: true, italic: false, underline: false, color: "#60A5FA", width: 150 },
        // LATAM bar (7.6%)
        { id: makeId(), type: "shape", x: 155, y: 258, shapeType: "rectangle", width: 39, height: 14, fillColor: "#93C5FD", strokeColor: "transparent", strokeWidth: 0, borderRadius: 3 },
        { id: makeId(), type: "text",  x: 198, y: 258, content: "LATAM 7.6%", fontSize: 9, bold: true, italic: false, underline: false, color: "#93C5FD", width: 150 },

        { id: makeId(), type: "heading", x: 40,  y: 296, content: "Top Performers by Department", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 350 },
        { id: makeId(), type: "divider", x: 40,  y: 320, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "table",   x: 40,  y: 332,
          headers: ["Department", "Team Size", "Revenue", "Target", "Achievement"],
          rows: [
            ["Enterprise Sales", "18", "$428,700", "$380,000", "112.8%"],
            ["SMB Sales",        "24", "$312,400", "$290,000", "107.7%"],
            ["Partnerships",     "8",  "$198,600", "$175,000", "113.5%"],
            ["Online / Direct",  "12", "$174,300", "$160,000", "108.9%"],
            ["Public Sector",    "6",  "$134,500", "$130,000", "103.5%"],
          ],
          headerColor: "#1E40AF", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        // Commentary with accent box
        { id: makeId(), type: "shape", x: 36, y: 480, shapeType: "rectangle", width: 523, height: 55, fillColor: "#F8FAFC", strokeColor: "#E2E8F0", strokeWidth: 1, borderRadius: 8 },
        { id: makeId(), type: "shape", x: 36, y: 480, shapeType: "rectangle", width: 4, height: 55, fillColor: "#059669", strokeColor: "transparent", strokeWidth: 0, borderRadius: 2 },
        { id: makeId(), type: "text",    x: 52,  y: 488,
          content: "All regions and departments exceeded their annual targets. The Partnerships team recorded the highest achievement rate at 113.5%, closely followed by Enterprise Sales at 112.8%.",
          fontSize: 11, bold: false, italic: true, underline: false, color: "#475569", width: 495, lineHeight: 1.7, textAlign: "justify" },
      ],
    },

    // ── Page 6 · Strategic Outlook ───────────────────────────────────────────
    {
      id: makeId(),
      bookmark: "Strategic Outlook",
      header: reportHeader("Strategic Outlook"),
      footer: reportFooter(),
      elements: [
        { id: makeId(), type: "text", x: 40, y: 2,
          content: "Forward-looking priorities and investment areas for the upcoming fiscal year based on {{report_period}} performance.",
          fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.7 },

        // ── Priority 1 ──
        { id: makeId(), type: "shape", x: 36, y: 44, shapeType: "rectangle", width: 523, height: 100, fillColor: "#FFFFFF", strokeColor: "#DBEAFE", strokeWidth: 2, borderRadius: 10 },
        { id: makeId(), type: "shape", x: 46, y: 56, shapeType: "circle", width: 36, height: 36, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "text",  x: 52, y: 62, content: "01", fontSize: 16, bold: true, italic: false, underline: false, color: "#FFFFFF", width: 24, textAlign: "center" },
        { id: makeId(), type: "heading", x: 94, y: 56, content: "Market Expansion", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E293B", width: 440 },
        { id: makeId(), type: "text",  x: 94, y: 78, content: "Expand into Southeast Asian and Middle Eastern markets with dedicated regional teams. Target: additional $280,000 in annual revenue by end of next fiscal year.", fontSize: 10, bold: false, italic: false, underline: false, color: "#64748B", width: 450, lineHeight: 1.6 },

        // ── Priority 2 ──
        { id: makeId(), type: "shape", x: 36, y: 158, shapeType: "rectangle", width: 523, height: 100, fillColor: "#FFFFFF", strokeColor: "#D1FAE5", strokeWidth: 2, borderRadius: 10 },
        { id: makeId(), type: "shape", x: 46, y: 170, shapeType: "circle", width: 36, height: 36, fillColor: "#059669", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "text",  x: 52, y: 176, content: "02", fontSize: 16, bold: true, italic: false, underline: false, color: "#FFFFFF", width: 24, textAlign: "center" },
        { id: makeId(), type: "heading", x: 94, y: 170, content: "Product Innovation", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E293B", width: 440 },
        { id: makeId(), type: "text",  x: 94, y: 192, content: "Launch three new product lines aligned with customer feedback. R&D investment increasing by 18% to support accelerated development cycles and faster time-to-market.", fontSize: 10, bold: false, italic: false, underline: false, color: "#64748B", width: 450, lineHeight: 1.6 },

        // ── Priority 3 ──
        { id: makeId(), type: "shape", x: 36, y: 272, shapeType: "rectangle", width: 523, height: 100, fillColor: "#FFFFFF", strokeColor: "#E9D5FF", strokeWidth: 2, borderRadius: 10 },
        { id: makeId(), type: "shape", x: 46, y: 284, shapeType: "circle", width: 36, height: 36, fillColor: "#7C3AED", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "text",  x: 52, y: 290, content: "03", fontSize: 16, bold: true, italic: false, underline: false, color: "#FFFFFF", width: 24, textAlign: "center" },
        { id: makeId(), type: "heading", x: 94, y: 284, content: "Operational Excellence", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E293B", width: 440 },
        { id: makeId(), type: "text",  x: 94, y: 306, content: "Automate 40% of manual processes by Q3 through AI-driven workflow tools. Expected annual savings of $152,000 while improving delivery speed by 25%.", fontSize: 10, bold: false, italic: false, underline: false, color: "#64748B", width: 450, lineHeight: 1.6 },

        // ── Investment table ──
        { id: makeId(), type: "heading", x: 40, y: 398, content: "Planned Investment Allocation", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E40AF", width: 350 },
        { id: makeId(), type: "divider", x: 40, y: 422, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "table", x: 40, y: 434,
          headers: ["Initiative", "Budget", "Timeline", "Expected ROI"],
          rows: [
            ["Market Expansion",       "$420,000", "Q1–Q4", "2.1x in 18 months"],
            ["Product R&D",            "$385,000", "Q1–Q3", "3.4x in 24 months"],
            ["Process Automation",     "$210,000", "Q1–Q3", "1.8x in 12 months"],
            ["Talent Acquisition",     "$165,000", "Q1–Q2", "Operational enabler"],
            ["Customer Experience",    "$120,000", "Q2–Q4", "2.5x in 18 months"],
          ],
          headerColor: "#1E40AF", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        { id: makeId(), type: "shape", x: 36, y: 590, shapeType: "rectangle", width: 523, height: 50, fillColor: "#EFF6FF", strokeColor: "#BFDBFE", strokeWidth: 1, borderRadius: 8 },
        { id: makeId(), type: "text", x: 52, y: 598,
          content: "Total planned investment: $1,300,000 — a 22% increase over {{report_period}}, reflecting confidence in continued growth and strategic positioning for long-term market leadership.",
          fontSize: 11, bold: true, italic: false, underline: false, color: "#1E40AF", width: 495, lineHeight: 1.6, textAlign: "justify" },
      ],
    },

    // ── Page 7 · Thank You ───────────────────────────────────────────────────
    {
      id: makeId(),
      bookmark: "Contact",
      footer: reportFooter(),
      elements: [
        // Decorative background elements
        { id: makeId(), type: "shape", x: 0, y: 0, shapeType: "rectangle", width: 595, height: 8, fillColor: "#1E40AF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "shape", x: 0, y: 180, shapeType: "rectangle", width: 595, height: 280, fillColor: "#EFF6FF", strokeColor: "transparent", strokeWidth: 0, borderRadius: 0, opacity: 0.5 },

        // Decorative circles (top right)
        { id: makeId(), type: "shape", x: 440, y: 40, shapeType: "circle", width: 100, height: 100, fillColor: "#DBEAFE", strokeColor: "#93C5FD", strokeWidth: 2, borderRadius: 0, opacity: 0.3 },
        { id: makeId(), type: "shape", x: 480, y: 100, shapeType: "circle", width: 60, height: 60, fillColor: "#BFDBFE", strokeColor: "#60A5FA", strokeWidth: 1, borderRadius: 0, opacity: 0.25 },
        // Decorative circles (bottom left)
        { id: makeId(), type: "shape", x: 30, y: 580, shapeType: "circle", width: 80, height: 80, fillColor: "#DBEAFE", strokeColor: "#93C5FD", strokeWidth: 2, borderRadius: 0, opacity: 0.3 },
        { id: makeId(), type: "shape", x: 70, y: 640, shapeType: "circle", width: 50, height: 50, fillColor: "#BFDBFE", strokeColor: "#60A5FA", strokeWidth: 1, borderRadius: 0, opacity: 0.25 },

        { id: makeId(), type: "image",   x: 222, y: 210, label: "Logo", width: 150, height: 95, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC },

        // Centered heading
        { id: makeId(), type: "divider", x: 40,  y: 330, color: "#1E40AF", width: 515, thickness: 4 },
        { id: makeId(), type: "heading", x: 40,  y: 352, content: "Thank You", fontSize: 28, bold: true, italic: false, underline: false, color: "#1E293B", width: 515, textAlign: "center", lineHeight: 1.3 },
        { id: makeId(), type: "text",    x: 97,  y: 402,
          content: "We appreciate your time in reviewing this report.\nFor questions or further information, please contact:",
          fontSize: 13, bold: false, italic: false, underline: false, color: "#374151", width: 400, textAlign: "center", lineHeight: 1.7 },

        // Contact info with shape background
        { id: makeId(), type: "shape", x: 147, y: 455, shapeType: "rectangle", width: 300, height: 80, fillColor: "#FFFFFF", strokeColor: "#DBEAFE", strokeWidth: 2, borderRadius: 10 },
        { id: makeId(), type: "text",    x: 147,  y: 465,
          content: "{{company_name}}\n{{company_email}}\n{{company_phone}}",
          fontSize: 13, bold: true, italic: false, underline: false, color: "#1E40AF", width: 300, textAlign: "center", lineHeight: 1.7 },

        { id: makeId(), type: "divider", x: 40,  y: 555, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "text",    x: 40,  y: 568,
          content: "This document was prepared for {{report_period}} and contains confidential information intended solely for the addressed recipient.",
          fontSize: 10, bold: false, italic: true, underline: false, color: "#94A3B8", width: 515, textAlign: "center", lineHeight: 1.6 },
      ],
    },
  ],
  styles: { primaryColor: "#1E40AF" },
  watermark: {
    enabled: true,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMUAAAD/CAMAAAB2B+IJAAAAQlBMVEX////u7u7t7e23t7fAwMD39/fy8vL19fX7+/v29va8vLy6urq7u7u0tLTCwsLi4uLIyMjOzs7f39/m5ubW1taurq7mxevGAAASAklEQVR4nO1diZarqBaVQVQQHPv/f/Uxgyil5qYSUi+uu3q1KTy4Bc58oKrsRYC+YG3vW2h+IK4BsA1ae9+lDew9PKMIchTrM4qN+QE2OYpfFF8U91CAP4Hib4zF/wsKaK7Qp7l8C3sfoTAXSRtcpggSivUZxcbeN7sGxF6tuarG3jeV/SVt4O5r06DyDaqkgXugPqPouuzSBilF12WdNGh3w5qO2n6iwMcmCsxPPdugSyju5maWYg4FyKN4+nR3FFMUIG2QpfjAWHxRfFH8fRTXebIj+XQx4Ch2CcVdgyzFqrZXY68690N639n77qzBZYr1VYq7BlWKN/3Euy9YpOz2fWam+4fpUZ+AAvwJFH9jLP5fUEAA0z7hRhPVf05RwKTBRlWFOxT6n0dhfzhRfmEWRWXeWXZpNfTW82Z773lxroFn3mmDhyne7jLIi0+Q3acUv/bFF8UXxReFJwkfQ/F8H0iEwnp2gEfhvUeWJLANkgdInTQgOYrBe+RgZrrsTij6LncUA5ozMfA0++K6GLgty/6KHvUJKMCfQPE3xuKL4pNQFMdplwUkD+Q5rUH3k+zemXDHRuGJCQfzJpwzCiPZrX7gHPoGBxThhfjF2/UoiBFCcNvgth71disJc4SwhfGpOi1RIBC2MD4UhQGBhIXxmSiA0CAUCsyXT0VhQSAhYbDhQ6MwowWhxqJfrlD0XjVviTiPVRJbT2PtbefMqVyDJqG4a5DpcpSrmmJ1IcSG5oBil1Kowgc5nCh7OzPRQM4N0XtTjwjOsL0QGkhM8WP0KAkCeRR8IRuKH4NCLWwmHIhuS/EzUBgQDgUiIKH4GSigYbEGBQMfal9YOaFRSBBPtC9eGCl2coIJIXpyQDEvyzp7+ch47ofc/b83sHcCUdpTffU9Wpv6OsVSZLda2D2WgyCwUJYF4jhQPM+gSCfnu+wLuSZ64aWd1j9u+GkzKF6tDaqFnaBA+NNQaO6UouDrJ6FoiGGxCoWIUCC0fhCKzlh2iCoI6j8OhLCj8boozNaTc9BnVvmtLQg9FmjgEQpsRoOcUUxzeL3ZsNPhc2aDT/q93GBLsROImUsKCgarBVEWfkBrfYFiQHMmBn5HdoO551SYq+dsaSCZpZWkJYewcqP8KAxB3KwHtSSMUURma2AIw6lE+dpgBymnjsFao6iFPEIhYeTWbBkoyMyXGlIrJ7j7O6kAFwFFkBtFoiAAIz7I0dBTCpGoS8LV0kAJjCJRaF8sH0irXB7SnojFAERhLBBm67NQPN8HYo2iuaowVX6njTCDLMgNbGFcRgFCMP54LHysvbP3TdrgKkXvPFuqVnkAld0dNVhQhMKIvybpsvVdPt++SAXLsX0hpxMWdlkPKrKTZnmRQS5xsZEbt+2LX9ej5HRybif236AfSPJAyMBjuYFwedqgWhPeBTg0RygAIRu5gXCdo/gmFMIEWfTVG2F3lFmkOVXgVU78FYLCcCc7n4DlE0f5UYpTBRQ9LgiFC7Ko70xH8mOW10ZuSPHYFIPCBVm0TRRRPMxVg1x4jktFL45RvJ7TejkhQYwxxeN8WsLDWGDcHlEM18NS70wDSSkKyz/1RNELO/I2H1DUDNcIFoYNI3ipBnJIMZITKlLkKS4iZ6Abs0mtIQHIZra/TRuM5ARVlp2jSHq27obfUmwUp9IgLMU3ozAuGzM96OjkhKRIlO43ZSkOTDGCuks4z1tQWBAGheROkYNm1DNMZCkOcgDrMuwLgF0wXmjuFCgKqqeM8jBnKK6sLcNKcs4zNRaaxVqKoB615S2o8hTkKCoqBWR5uUiRTinQcsKECAhUpp5SwKnUv0fwjFr7+8H40/C+aQCoDsarr678ZUvjG3ivGsNovBPej7xq6UR5goczoWjEAJn0esAuyCItI/PnkTKn7PXjZqLsusx7OO+jyCygMz2KrCh2ifMFWBDYoeBzhmJBPnNYLdTAsO+sTG3FnQRL3E4lo5B9Ni5Jxbw1qVrFnSwKLn5wXJWEomr6OMjC4KTuLYqx+ZhaGEJjZ1lv5IRCwUfyQbX2CoZHYT01TE2n5im19i+62oX3NjRvwvPyrqd8aP+JapXi/e0MCjJzbKPz3oRDw/Envj1PXudtJrNluB4Fmt1EOaFYgjboKSpOJaLwhAXxWSiA4VQBhQ+2fhYKaZ/GQRZESkax1jkUW7lBefM0FBlV9XEfyMhHqX9nxGMTyQ2KzWicFlnmUTwYaz83REbEEJM4mmNDhPAQnMcUqRc57TKfFfw7slu5bJR6QenU1ORIDGi54WW3ZFTgF2rt/1GPUt4OY0xQNs7GGZZMlGZ1wXmjDQ6gNG2QBOeZ/NSczqTZL1pC+hgFX0rTzLWjwKYUiF6+IVrJAetpjNywVtJ/S1kojLfDJUZQ/aUljj1FDUN4i3UpCYV12URjYXDMZEdRKyMOBbNaYREonN/JKn1mLNRL9mwiKUUl/jwKYZK69j6QqyhC4bu9T4PxZ2EJT7IOwsysbo9CMSyFY/OScol7Tw7FTUxxF//PBjr89TTfIFiYsGKAIb3KhYj8UHx0rg4jBsgqBYtuLw1YSMqxL4RnoGDtd8m+EgeJKTbabFKTj6ef+K3a4IIsCvm+YKUhduS9BnhpA0UCNQiKjyNib9NphRsLvsh3nHGfoJCTR8xtWLQLV5GiOhuEew+KhTmRLAcDtO2sveJRgqm8YXSGxGbYVTOjoivOvhDezbRoiq16zRiFxsEnHRNTFCeV41EaCsmmrDCjxFJcEdugUFaSXOiQaIqNalRcrT1yKPjqBEu7hiiMduQIw7AWcrlQ46TWHuSlXlYEZcP7RHn5nU5LhZNR2oOzXeVOc7fB1u6sy7zUSyfKk/y0XLMipepBG4WZ9xxXL3NB+WAo/sNuP7+DgkzOSsJCN5CmHTtCoUYLZvOj3owCQPeSmM0GRFTYuZlRuHZdlodCDoZLH+eNBuFQ9NPKeUCBg/QrDwXQqYumCHJq51DYyaYKkJHbjDuqUoUKRkGEY0k9W635YEBIimQZNRPTIJ6B4rb2ezEKQ2Zmgyw9CoWddDIUJQ6qVNk6pvgPnpzbXjW/neSJD6xy0XgTb1GSgTFEQrRejtDSPOTIe3atPfyhPHFwlqsw7jPJYTkgUXh/GUJ+VDRRHvFwehSZ6f6zHtWReZXX0B70WeMIhVrJHN2c7i9C0Y2qIIdShka473PmGxQ9s+ItR/E9KJq5D2KArTtmRnCMohdWXSoLBZica8O8JU5RADMYBkU/7ZS8ElBsKuO1jBYpChKNxfhoccBT7ItspDhUxmPjw9CZZhvBAtbgyRE3w/txlwFFTpa5wPfdCvkR9T1jvQ/Bq+g7n+vtA60unteN0No+qSj/4IfHZDeAwvnCvOtPG6Jt8omHPjTYWY3pNPiHDIp0cl7To0Zf8bhBweaEYhsa+PSna3t5xdP9l7RBtbAdio1rQ6QU5z74aZsfKL4ehUnupUKvacZQSDDVU2pDkSDn+Q+DUQQKm6FsCh5H0MI17LzFYEpxon4saFMQChEUi35WfZLBJ16jHYqGB89/Xw6KMQRZemj61I4bpMVCOqPkYLh144Is2dzWvA8EHqK4UGv/QzDeXD1WRY/GKmi4yunVidfpAxXh7gHKyL1gfM602SUiBzQZ2b3l8qqSxeyfIno+Ac+0J8Or+NxEGzxbpj6ZpC5MqdlY8zdkdzr3ftSj1D6A1kGD0URCMJ5ZNxOU5gbZUgTaaav0wbUMnVZn7Xs3Uxc16A0KgbnybkxDTLGdDOyaJH2+CYXZVtIo2kPcYKKR9FNBFj4Dv8tyTTRTbl+i056igMaph+0OKgPxDRa9v6FHoStC+nGGjaVoXDaFoBg9Cm1O2GneVAvfu8JlK07HpSOKgc5IuWyKQAGBMaQdit7C6BYeJ8H7EjAVneTjAokchbE76vM3UJx7ciBZvENfokAahilIEJt1YcwiHRHjaFokscM+725F8wOKezyZIJ8pQI2+MYdAlwiV8WZM7I57fAmCZUexeopvMB3WEw2k8S+t9+ZZINpYSVik4Qm9IcDPE+UNehTxY6H3SaI+WUVqe+s6YpYGWXBDkj4LQCHZqkchYt5EtYOwW0LJsNkOqi7yFI9m2Lr8zFjw3vc5iIDiUjD+91D8sMed5lQJCo6XIFjIIDxLvhKMf5PFuvAEhQIRi4FaSkhuDdiXoDjntCpLv2lCOFvq1gO3zjLryZEgtio8aJYR9ZnK+F/gtJ6UuXwwvvaHszTLMI3jui5AYrGnuZCexiloyoGzO0BmGQdj27iXOz1AJm2QO0CmyVHMaCCEDCM1ZpwUw2KGxH4Q0odsP/lHUh0tIHJAEZxqIE+Pwkj1gnurSM//2csNFKHQMHLT/YkbEz6CgiybfWAMR6XeNxZ7mxWMMlEYz4bLAwobMg62z2Xj+e8JSfosA8UYZwjEFV2TbtCBIaBQPlprb5SFItpBZYNC/p+G0UEyRGPhzabfRAFOUVge7PoM29SnCrfdV7KzcsNmz6oozEqOxMBjRZYaxWWr4fhsx3pEvrzRFcJjE31XwRc+EvMAkM1Yb51mKtLS3jhOst10eXCcZPpAlqLNA0rmntqmPsTakXbPCFvxaBLpJlt22fHIvhC6fvBZ58JsYmuPnAujtqn3052LaZr87vuu5mOyD3QooDBL5vZ0/x1tUHMnz3pGJcFJI4UHi1DYUnlFIEKBlUO5CBQ63OWFmdsuTPW50ggFYvaJdohQUNwVgiLapp6OTdyn3nXHo5hsn2DwURhlFBWBIg7G6x1U4j4bHmo+KO9sn9Zs0gnvRxTfYF9EwXi9Xdi2QR17cibbJwSLTaDT3bzjXHvPi3UlfCttGxWKV3H2nrWqAn7bgCBm/q7EA9EV8upvC2KUcn8fHoh+uH9cfe5+R7GK8RKIuTfhONLOsOQLktltsUIltyW+wULV/rKHX/AVstv3qSaaXBO+Po0O24pHO1fBZGtbpLQTUYOVzoVog8q17zMvbSZQioIQFLwGQ9SgK0MzN/aEHws5X45QwGqiroCNDz/1+aax6JYYBeJje4SirZFdF2WikH+nPEpSUcVRR1levgES5LUowCkKrcsSyrDfWEsxoT3JtppiFM8+9ekxH4jT0F3kfGRh8TIJg1TbBqRVsUisk3zR2Cjn0HGs3XuP6rTBjqK9r5MGWYrdjmLKcjsrvHsdD5J2z06QqtoKpH2DerflQs+1NzBsBTmadgyUOA0Es+XGRHmxTgv1t9YolPk21ul0D57/ulgU1krqnTdNc6qoz3by5dvjYZ+FoCAKhkehbOy4Tx9LskdblooCkO0hd1qK+z5DETqri0YhxThzzgJs5Ybr09cOUrv5fhEoMtpvjajeMMz6yie3x+HEfGW8cH0mnBae8cVf4LQpKW9x+L0/bTmRfmzkCDtf4QyuvVxqX1x/ucwXvpPl1USHomLB1BInY9ispBdXw9hv9vyPkedfib96cjvCq/1lr+4+/fYozBj2J8aCr1PYEf5OMP7NKIx/zUdhoopHCeItZ6mDh1AoZcTXlNtL39Wlngh/2KeEgQ9Q6IyPIsfikC9KnarHadqTcZ79+rn2dzhtMH62log1fqp2RGbHAqeRMLTExk+VN36qrfFzak51ZxTrhKI3p87zQAiO5YZc5bOpeHyeIXqeZ35G8UI2Sx0c+4o7Lc2zp/tLcnJgyyK50T7qFHh7ZhGh3O4IH1XGfwKKbZZXo7XAbWX8J6BIs7xUTTnVReVForjGk4E+ZWZTGf88h/4TojBnkY7G7EVcNZwv9a3YSfczxbpNH3g8XFOleLN1rMtMNh/k+WdGf9KOx2+vIvmi+KLwKMCfQHE+FjadJ+4TbjRR/ecUBUwabFRVuEOh/3kU9oeflF/1L4uiMu8su7ycSZU2SHOzdslbtyne7jLIi9s8+Q2y+107Ht+a7u/J+f8cFD/UX3wQir8xFn8exYN29/N9IBEK69k5rdQAyQOhOMQ7h5IGvs+EYrY4JOz9mKFYJxTPozC/d679S6Mwn6lHfVF8UXzti7+K4qM57W2eXKRvMB3WgvSoGxpIwSi+9sVfGosvijeg+AROe33HY2+JOI9VElu/fY7Ybg/l+8cP5yg+e8fjK4bo22vtwcfpUV8Ur0IB/gSKvzEWD9sXOy5fZKT4cmT8NBh/udLxaV36B/4H/x2wAD045OoAAAAASUVORK5CYII=",
    pages: [2, 3],
    width: 197,
    height: 255,
    x: 199,
    y: 315,
    opacity: 0.15,
  },
};
