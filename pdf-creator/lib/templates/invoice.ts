import type { Template } from "@/types/template";
import { makeId, SAMPLE_LOGO_SRC, BUNDLED_FONTS } from "./utils";

export const INVOICE_TEMPLATE: Template = {
  name: "Invoice Template",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "image",   x: 475, y: 22,  label: "Logo", width: 80, height: 50, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC },
        { id: makeId(), type: "heading", x: 40,  y: 28,  content: "Invoice  #{{invoice_number}}", fontSize: 26, bold: true,  italic: false, underline: false, color: "#1E40AF", width: 390 },
        { id: makeId(), type: "divider", x: 40,  y: 68,  color: "#1E40AF", width: 515, thickness: 2 },
        { id: makeId(), type: "text",    x: 40,  y: 82,  content: "Bill To:\n{{client_name}}\n{{client_address}}\n{{client_email}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#374151", width: 240 },
        { id: makeId(), type: "text",    x: 340, y: 82,  content: "From:\n{{from_company}}\n{{from_address}}\n{{from_email}}",       fontSize: 12, bold: false, italic: false, underline: false, color: "#374151", width: 215 },
        { id: makeId(), type: "text",    x: 340, y: 192, content: "Invoice Date: {{invoice_date}}\nDue Date:     {{due_date}}",       fontSize: 12, bold: false, italic: false, underline: false, color: "#374151", width: 215 },
        { id: makeId(), type: "divider", x: 40,  y: 242, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "table",   x: 40,  y: 254,
          headers: ["#", "Description", "Qty", "Unit Price", "Total"],
          rows: [
            ["1", "Premium Widget",   "2", "$10.00",  "$20.00"],
            ["2", "Monthly Service",  "1", "$50.00",  "$50.00"],
            ["3", "Standard Widget",  "3", "$8.00",   "$24.00"],
            ["4", "Consulting (hr)",  "2", "$75.00",  "$150.00"],
          ],
          headerColor: "#1E40AF", headerTextColor: "#ffffff", fontSize: 11, width: 515 },
        { id: makeId(), type: "divider", x: 40,  y: 376, color: "#E2E8F0", width: 515, thickness: 1 },
        { id: makeId(), type: "text",    x: 380, y: 388,
          content: "Subtotal:  {{subtotal}}\nTax (10%): {{tax}}\nTotal:     {{total}}",
          fontSize: 13, bold: true, italic: false, underline: false, color: "#1E293B", width: 175 },
        { id: makeId(), type: "divider", x: 40,  y: 466, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "text",    x: 40,  y: 478,
          content: "Payment Terms: {{payment_terms}}\nBank: {{bank_name}}  ·  Account: {{account_number}}",
          fontSize: 11, bold: false, italic: false, underline: false, color: "#64748B", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 532,
          content: "Notes: {{notes}}",
          fontSize: 11, bold: false, italic: true, underline: false, color: "#94A3B8", width: 515 },
      ],
    },
  ],
  styles: { primaryColor: "#1E40AF" },
};
