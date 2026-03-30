import type { Template } from "@/types/template";
import { makeId, SAMPLE_LOGO_SRC, BUNDLED_FONTS } from "./utils";

export const MEETING_MINUTES_TEMPLATE: Template = {
  name: "Meeting Minutes",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#0F766E" },
  pages: [
    {
      id: makeId(),
      elements: [
        // ── Logo ───────────────────────────────────────────────────────
        { id: makeId(), type: "image", x: 475, y: 20, label: "Logo", width: 80, height: 50, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC },

        // ── Heading ────────────────────────────────────────────────────
        { id: makeId(), type: "heading", x: 40, y: 28, content: "Meeting Minutes", fontSize: 24, bold: true, italic: false, underline: false, color: "#0F766E", width: 400 },

        // ── Top divider ────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 62, color: "#0F766E", width: 515, thickness: 2 },

        // ── Info block ─────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 78, content: "Date: {{meeting_date}}\nTime: {{meeting_time}}\nLocation: {{location}}\nFacilitator: {{facilitator}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 250 },

        // ── Attendees ──────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 300, y: 78, content: "Attendees:\n{{attendees}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 255 },

        // ── Divider ────────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 160, color: "#CBD5E1", width: 515, thickness: 1 },

        // ── Agenda heading ─────────────────────────────────────────────
        { id: makeId(), type: "heading", x: 40, y: 175, content: "Agenda", fontSize: 14, bold: true, italic: false, underline: false, color: "#0F766E", width: 515 },

        // ── Agenda table ───────────────────────────────────────────────
        { id: makeId(), type: "table", x: 40, y: 198,
          headers: ["#", "Topic", "Presenter", "Duration"],
          rows: [
            ["1", "Project status update", "{{presenter_1}}", "15 min"],
            ["2", "Budget review", "{{presenter_2}}", "20 min"],
            ["3", "Next steps & action items", "{{presenter_3}}", "10 min"],
          ],
          headerColor: "#0F766E", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        // ── Divider ────────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 320, color: "#CBD5E1", width: 515, thickness: 1 },

        // ── Discussion Notes heading ───────────────────────────────────
        { id: makeId(), type: "heading", x: 40, y: 335, content: "Discussion Notes", fontSize: 14, bold: true, italic: false, underline: false, color: "#0F766E", width: 515 },

        // ── Discussion notes text ──────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 358, content: "{{discussion_notes}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },

        // ── Divider ────────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 520, color: "#CBD5E1", width: 515, thickness: 1 },

        // ── Action Items heading ───────────────────────────────────────
        { id: makeId(), type: "heading", x: 40, y: 535, content: "Action Items", fontSize: 14, bold: true, italic: false, underline: false, color: "#0F766E", width: 515 },

        // ── Action items table ─────────────────────────────────────────
        { id: makeId(), type: "table", x: 40, y: 558,
          headers: ["Action Item", "Owner", "Due Date", "Status"],
          rows: [
            ["{{action_1}}", "{{owner_1}}", "{{due_1}}", "Pending"],
            ["{{action_2}}", "{{owner_2}}", "{{due_2}}", "In Progress"],
            ["{{action_3}}", "{{owner_3}}", "{{due_3}}", "Pending"],
          ],
          headerColor: "#0F766E", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        // ── Next Meeting ───────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 700, content: "Next Meeting: {{next_meeting_date}} at {{next_meeting_time}}", fontSize: 11, bold: true, italic: false, underline: false, color: "#374151", width: 515 },
      ],
    },
  ],
};
