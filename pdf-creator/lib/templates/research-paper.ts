import type { Template } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";

export const RESEARCH_PAPER_TEMPLATE: Template = {
  name: "Research Paper",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "heading", x: 40,  y: 200, content: "{{paper_title}}", fontSize: 26, bold: true, italic: false, underline: false, color: "#1E40AF", width: 515, textAlign: "center" },
        { id: makeId(), type: "text",    x: 40,  y: 260, content: "{{author_name}}", fontSize: 14, bold: false, italic: false, underline: false, color: "#374151", width: 515, textAlign: "center" },
        { id: makeId(), type: "text",    x: 40,  y: 285, content: "{{affiliation}}", fontSize: 12, bold: false, italic: true, underline: false, color: "#64748B", width: 515, textAlign: "center" },
        { id: makeId(), type: "text",    x: 40,  y: 320, content: "{{submission_date}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#64748B", width: 515, textAlign: "center" },
        { id: makeId(), type: "divider", x: 200, y: 350, width: 195, thickness: 1, color: "#CBD5E1" },
        { id: makeId(), type: "text",    x: 40,  y: 370, content: "{{author_email}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#64748B", width: 515, textAlign: "center" },
      ],
    },
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "heading", x: 40,  y: 40,  content: "Abstract", fontSize: 16, bold: true, italic: false, underline: false, color: "#1E40AF", width: 515 },
        { id: makeId(), type: "divider", x: 40,  y: 62,  width: 515, thickness: 1, color: "#1E40AF" },
        { id: makeId(), type: "text",    x: 40,  y: 78,  content: "{{abstract}}", fontSize: 11, bold: false, italic: true, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "text",    x: 40,  y: 185, content: "[1]", fontSize: 11, bold: false, italic: false, underline: false, color: "#1E40AF", width: 30, superscript: true },
        { id: makeId(), type: "text",    x: 40,  y: 200, content: "Keywords: {{keywords}}", fontSize: 11, bold: true, italic: false, underline: false, color: "#374151", width: 515 },
        { id: makeId(), type: "divider", x: 40,  y: 225, width: 515, thickness: 1, color: "#CBD5E1" },
        { id: makeId(), type: "heading", x: 40,  y: 245, content: "1. Introduction", fontSize: 16, bold: true, italic: false, underline: false, color: "#1E40AF", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 270, content: "{{introduction}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40,  y: 490, content: "2. Methodology", fontSize: 16, bold: true, italic: false, underline: false, color: "#1E40AF", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 515, content: "{{methodology}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
      ],
    },
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "heading", x: 40,  y: 40,  content: "3. Results", fontSize: 16, bold: true, italic: false, underline: false, color: "#1E40AF", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 65,  content: "{{results}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40,  y: 300, content: "4. Conclusion", fontSize: 16, bold: true, italic: false, underline: false, color: "#1E40AF", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 325, content: "{{conclusion}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40,  y: 520, content: "References", fontSize: 16, bold: true, italic: false, underline: false, color: "#1E40AF", width: 515 },
        { id: makeId(), type: "divider", x: 40,  y: 542, width: 515, thickness: 1, color: "#1E40AF" },
        { id: makeId(), type: "text",    x: 40,  y: 558, content: "{{references}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6, listStyle: "numbered" },
      ],
    },
  ],
  styles: { primaryColor: "#1E40AF" },
};
