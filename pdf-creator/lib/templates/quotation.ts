import type { Template } from "@/types/template";
import { makeId, SAMPLE_LOGO_SRC, BUNDLED_FONTS } from "./utils";

export const QUOTATION_TEMPLATE: Template = {
  name: "Quotation",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#B45309" },
  pages: [
    {
      id: makeId(),
      elements: [
        // ── Logo ───────────────────────────────────────────────────────
        { id: makeId(), type: "image", x: 475, y: 22, label: "Logo", width: 80, height: 50, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC },

        // ── Heading ────────────────────────────────────────────────────
        { id: makeId(), type: "heading", x: 40, y: 28, content: "Quotation  #{{quote_number}}", fontSize: 24, bold: true, italic: false, underline: false, color: "#B45309", width: 400 },

        // ── Top divider ────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 62, color: "#B45309", width: 515, thickness: 2 },

        // ── From ───────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 78, content: "From:\n{{from_company}}\n{{from_address}}\n{{from_email}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 280 },

        // ── To ─────────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 340, y: 78, content: "To:\n{{client_name}}\n{{client_company}}\n{{client_email}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 215 },

        // ── Dates ──────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 340, y: 170, content: "Quote Date: {{quote_date}}\nValid Until: {{valid_until}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 215 },

        // ── Divider ────────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 220, color: "#CBD5E1", width: 515, thickness: 1 },

        // ── Items table ────────────────────────────────────────────────
        { id: makeId(), type: "table", x: 40, y: 235,
          headers: ["#", "Description", "Qty", "Unit Price", "Discount", "Total"],
          rows: [
            ["1", "Web Design Package", "1", "$3,500.00", "0%", "$3,500.00"],
            ["2", "SEO Optimization", "1", "$1,200.00", "10%", "$1,080.00"],
            ["3", "Content Writing (page)", "10", "$150.00", "5%", "$1,425.00"],
            ["4", "Hosting (annual)", "1", "$480.00", "0%", "$480.00"],
          ],
          headerColor: "#B45309", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        // ── Divider ────────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 365, color: "#E2E8F0", width: 515, thickness: 1 },

        // ── Totals ─────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 380, y: 378, content: "Subtotal: {{subtotal}}\nDiscount: {{discount}}\nTax: {{tax}}\nTotal: {{total}}", fontSize: 12, bold: true, italic: false, underline: false, color: "#1E293B", width: 175 },

        // ── Terms heading ──────────────────────────────────────────────
        { id: makeId(), type: "heading", x: 40, y: 470, content: "Terms & Conditions", fontSize: 13, bold: true, italic: false, underline: false, color: "#B45309", width: 515 },

        // ── Terms text ─────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 492, content: "{{terms}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.5 },

        // ── Acceptance ─────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 640, content: "Accepted By: ____________________\nName: {{client_name}}\nDate: ____________________", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515 },
      ],
    },
  ],
};
