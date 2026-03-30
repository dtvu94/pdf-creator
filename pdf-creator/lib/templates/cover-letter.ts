import type { Template } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";

export const COVER_LETTER_TEMPLATE: Template = {
  name: "Cover Letter",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#1E3A5F" },
  pages: [
    {
      id: makeId(),
      elements: [
        // ── Sender name heading ────────────────────────────────────────
        { id: makeId(), type: "heading", x: 40, y: 40, content: "{{full_name}}", fontSize: 22, bold: true, italic: false, underline: false, color: "#1E3A5F", width: 515 },

        // ── Contact line ───────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 70, content: "{{email}} | {{phone}} | {{location}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#64748B", width: 515 },

        // ── Divider ────────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 90, color: "#1E3A5F", width: 515, thickness: 2 },

        // ── Date ───────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 112, content: "{{date}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515 },

        // ── Recipient block ────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 138, content: "{{recipient_name}}\n{{recipient_title}}\n{{company_name}}\n{{company_address}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515 },

        // ── Greeting ───────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 220, content: "Dear {{recipient_name}},", fontSize: 11, bold: true, italic: false, underline: false, color: "#374151", width: 515 },

        // ── Body paragraphs ────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 248, content: "{{body}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },

        // ── Closing ────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 520, content: "Sincerely,\n\n\n{{full_name}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515 },
      ],
    },
  ],
};
