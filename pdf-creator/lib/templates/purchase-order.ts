import type { Template } from "@/types/template";
import { makeId, SAMPLE_LOGO_SRC, BUNDLED_FONTS } from "./utils";

export const PURCHASE_ORDER_TEMPLATE: Template = {
  name: "Purchase Order",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#7C3AED" },
  pages: [
    {
      id: makeId(),
      elements: [
        // ── Logo ───────────────────────────────────────────────────────
        { id: makeId(), type: "image", x: 475, y: 22, label: "Logo", width: 80, height: 50, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC },

        // ── Heading ────────────────────────────────────────────────────
        { id: makeId(), type: "heading", x: 40, y: 28, content: "Purchase Order  #{{po_number}}", fontSize: 24, bold: true, italic: false, underline: false, color: "#7C3AED", width: 400 },

        // ── Top divider ────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 62, color: "#7C3AED", width: 515, thickness: 2 },

        // ── Buyer info ─────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 78, content: "Buyer:\n{{buyer_company}}\n{{buyer_address}}\n{{buyer_email}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 280 },

        // ── Vendor info ────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 340, y: 78, content: "Vendor:\n{{vendor_company}}\n{{vendor_address}}\n{{vendor_email}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 215 },

        // ── Dates ──────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 340, y: 170, content: "PO Date: {{po_date}}\nDelivery Date: {{delivery_date}}\nPayment Terms: {{payment_terms}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 215 },

        // ── Divider ────────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 240, color: "#CBD5E1", width: 515, thickness: 1 },

        // ── Items table ────────────────────────────────────────────────
        { id: makeId(), type: "table", x: 40, y: 255,
          headers: ["#", "Item Description", "Qty", "Unit Price", "Total"],
          rows: [
            ["1", "Office Desk - Standing", "2", "$450.00", "$900.00"],
            ["2", "Ergonomic Chair", "4", "$320.00", "$1,280.00"],
            ["3", "Monitor Arm Mount", "4", "$85.00", "$340.00"],
            ["4", "Keyboard & Mouse Set", "4", "$65.00", "$260.00"],
          ],
          headerColor: "#7C3AED", headerTextColor: "#ffffff", fontSize: 11, width: 515 },

        // ── Divider ────────────────────────────────────────────────────
        { id: makeId(), type: "divider", x: 40, y: 380, color: "#E2E8F0", width: 515, thickness: 1 },

        // ── Totals ─────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 380, y: 392, content: "Subtotal: {{subtotal}}\nShipping: {{shipping}}\nTax: {{tax}}\nTotal: {{total}}", fontSize: 12, bold: true, italic: false, underline: false, color: "#1E293B", width: 175 },

        // ── Shipping info ──────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 480, content: "Ship To:\n{{ship_to_address}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 300 },

        // ── Notes ──────────────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 560, content: "Notes:\n{{notes}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515 },

        // ── Authorization ──────────────────────────────────────────────
        { id: makeId(), type: "text", x: 40, y: 680, content: "Authorized By: {{authorized_by}}\nSignature: ____________________\nDate: {{authorization_date}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515 },
      ],
    },
  ],
};
