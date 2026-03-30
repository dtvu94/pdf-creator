import type { Template } from "@/types/template";
import { makeId, SAMPLE_LOGO_SRC, BUNDLED_FONTS } from "./utils";

export const EMPLOYEE_DIRECTORY_TEMPLATE: Template = {
  name: "Employee Directory",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [
    {
      id: makeId(),
      // Header section (height 100pt): logo, title, subtitle, divider
      header: {
        height: 100,
        elements: [
          { id: makeId(), type: "image",   x: 475, y: 22, label: "Logo",  width: 80,  height: 50,  bgColor: "#D1FAE5", src: SAMPLE_LOGO_SRC },
          { id: makeId(), type: "heading", x: 40,  y: 28, content: "Employee Directory", fontSize: 26, bold: true,  italic: false, underline: false, color: "#065F46", width: 390 },
          { id: makeId(), type: "text",    x: 40,  y: 66, content: "As of: {{date}}  ·  Department: {{department}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#6B7280", width: 390 },
          { id: makeId(), type: "divider", x: 40,  y: 86, color: "#059669", width: 515, thickness: 2 },
        ],
      },
      // Footer section (height 114pt = 842 - 728): divider + confidential text
      footer: {
        height: 114,
        elements: [
          { id: makeId(), type: "divider", x: 40, y: 0,  color: "#E5E7EB", width: 515, thickness: 1 },
          { id: makeId(), type: "text",    x: 40, y: 12, content: "Confidential · HR Department · {{company_name}}", fontSize: 9, bold: false, italic: true, underline: false, color: "#9CA3AF", width: 515 },
        ],
      },
      // Body: just the table, y:0 relative to body top (which is just below the header)
      elements: [
        {
          id: makeId(), type: "table", mode: "auto",
          x: 40, y: 0,
          headers: ["Name", "Department", "Role", "Email", "Status"],
          rows:    [["Alice Johnson", "Engineering", "Senior Engineer", "alice@company.com", "Active"]],
          headerColor: "#065F46", headerTextColor: "#ffffff", fontSize: 10, width: 515,
        },
      ],
    },
  ],
  styles: { primaryColor: "#065F46" },
};
