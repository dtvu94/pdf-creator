import type { Template } from "@/types/template";
import { makeId, BUNDLED_FONTS, SAMPLE_LOGO_SRC } from "./utils";

export const PROJECT_PROPOSAL_TEMPLATE: Template = {
  name: "Project Proposal",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#0369A1" },
  pages: [
    // ── Page 1: Cover ───────────────────────────────────────────────────────
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "shape", x: 0, y: 0, shapeType: "rectangle", width: 595, height: 320, fillColor: "#0369A1", strokeColor: "#0369A1", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "image", x: 460, y: 30, label: "Logo", width: 100, height: 60, bgColor: "#0284C7", src: SAMPLE_LOGO_SRC },
        { id: makeId(), type: "heading", x: 50, y: 100, content: "{{project_name}}", fontSize: 32, bold: true, italic: false, underline: false, color: "#FFFFFF", width: 495 },
        { id: makeId(), type: "text", x: 50, y: 160, content: "Project Proposal", fontSize: 18, bold: false, italic: false, underline: false, color: "#BAE6FD", width: 300 },
        { id: makeId(), type: "divider", x: 50, y: 195, color: "#38BDF8", width: 120, thickness: 3 },
        { id: makeId(), type: "text", x: 50, y: 220, content: "Prepared by: {{author}}\nDate: {{date}}\nVersion: {{version}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#E0F2FE", width: 300, lineHeight: 1.7 },
        { id: makeId(), type: "text", x: 50, y: 350, content: "Prepared for: {{client_name}}\n{{client_company}}", fontSize: 13, bold: false, italic: false, underline: false, color: "#374151", width: 300, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 50, y: 430, content: "Executive Summary", fontSize: 18, bold: true, italic: false, underline: false, color: "#0369A1", width: 495 },
        { id: makeId(), type: "divider", x: 50, y: 458, color: "#0369A1", width: 495, thickness: 2 },
        { id: makeId(), type: "text", x: 50, y: 475, content: "{{executive_summary}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 495, lineHeight: 1.6 },
      ],
    },
    // ── Page 2: Problem + Solution ──────────────────────────────────────────
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "heading", x: 40, y: 40, content: "Problem Statement", fontSize: 18, bold: true, italic: false, underline: false, color: "#0369A1", width: 515 },
        { id: makeId(), type: "divider", x: 40, y: 68, color: "#0369A1", width: 515, thickness: 2 },
        { id: makeId(), type: "text", x: 40, y: 85, content: "{{problem_statement}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40, y: 260, content: "Proposed Solution", fontSize: 18, bold: true, italic: false, underline: false, color: "#0369A1", width: 515 },
        { id: makeId(), type: "divider", x: 40, y: 288, color: "#0369A1", width: 515, thickness: 2 },
        { id: makeId(), type: "text", x: 40, y: 305, content: "{{proposed_solution}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40, y: 520, content: "Key Deliverables", fontSize: 14, bold: true, italic: false, underline: false, color: "#0369A1", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 545, content: "{{deliverables}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.5, listStyle: "bullet" },
      ],
    },
    // ── Page 3: Timeline + Budget ───────────────────────────────────────────
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "heading", x: 40, y: 40, content: "Project Timeline", fontSize: 18, bold: true, italic: false, underline: false, color: "#0369A1", width: 515 },
        { id: makeId(), type: "divider", x: 40, y: 68, color: "#0369A1", width: 515, thickness: 2 },
        { id: makeId(), type: "table", x: 40, y: 85,
          headers: ["Phase", "Description", "Start Date", "End Date", "Status"],
          rows: [
            ["1. Discovery", "Requirements gathering & research", "{{phase1_start}}", "{{phase1_end}}", "{{phase1_status}}"],
            ["2. Design", "Architecture & UI/UX design", "{{phase2_start}}", "{{phase2_end}}", "{{phase2_status}}"],
            ["3. Development", "Core implementation & integration", "{{phase3_start}}", "{{phase3_end}}", "{{phase3_status}}"],
            ["4. Testing", "QA, UAT, and bug fixes", "{{phase4_start}}", "{{phase4_end}}", "{{phase4_status}}"],
            ["5. Deployment", "Launch & handover", "{{phase5_start}}", "{{phase5_end}}", "{{phase5_status}}"],
          ],
          headerColor: "#0369A1", headerTextColor: "#ffffff", fontSize: 10, width: 515 },
        { id: makeId(), type: "heading", x: 40, y: 310, content: "Budget Breakdown", fontSize: 18, bold: true, italic: false, underline: false, color: "#0369A1", width: 515 },
        { id: makeId(), type: "divider", x: 40, y: 338, color: "#0369A1", width: 515, thickness: 2 },
        { id: makeId(), type: "table", x: 40, y: 355,
          headers: ["Category", "Description", "Estimated Cost"],
          rows: [
            ["Personnel", "Development team ({{team_size}} members)", "{{personnel_cost}}"],
            ["Infrastructure", "Servers, hosting, CI/CD", "{{infra_cost}}"],
            ["Licensing", "Third-party tools & APIs", "{{license_cost}}"],
            ["Contingency", "10% buffer", "{{contingency_cost}}"],
          ],
          headerColor: "#0369A1", headerTextColor: "#ffffff", fontSize: 11, width: 515 },
        { id: makeId(), type: "divider", x: 40, y: 490, color: "#E2E8F0", width: 515, thickness: 1 },
        { id: makeId(), type: "text", x: 350, y: 505, content: "Total Budget: {{total_budget}}", fontSize: 14, bold: true, italic: false, underline: false, color: "#0369A1", width: 205, textAlign: "right" },
        { id: makeId(), type: "heading", x: 40, y: 560, content: "Terms & Next Steps", fontSize: 14, bold: true, italic: false, underline: false, color: "#0369A1", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 585, content: "{{terms_and_next_steps}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
      ],
    },
  ],
};
