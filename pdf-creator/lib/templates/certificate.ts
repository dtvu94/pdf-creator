import type { Template } from "@/types/template";
import { makeId, SAMPLE_LOGO_SRC, BUNDLED_FONTS } from "./utils";

export const CERTIFICATE_TEMPLATE: Template = {
  name: "Certificate of Achievement",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "shape",   x: 40,  y: 30,  shapeType: "rectangle", width: 515, height: 6, fillColor: "#92400E", strokeColor: "#92400E", strokeWidth: 0, borderRadius: 3 },
        { id: makeId(), type: "heading", x: 40,  y: 80,  content: "Certificate of Achievement", fontSize: 28, bold: true, italic: false, underline: false, color: "#92400E", width: 515, textAlign: "center" },
        { id: makeId(), type: "text",    x: 40,  y: 130, content: "This is to certify that", fontSize: 13, bold: false, italic: false, underline: false, color: "#64748B", width: 515, textAlign: "center" },
        { id: makeId(), type: "heading", x: 40,  y: 165, content: "{{recipient_name}}", fontSize: 32, bold: true, italic: true, underline: false, color: "#1E293B", width: 515, textAlign: "center" },
        { id: makeId(), type: "divider", x: 180, y: 210, width: 235, thickness: 1, color: "#92400E" },
        { id: makeId(), type: "text",    x: 60,  y: 235, content: "{{achievement_description}}", fontSize: 13, bold: false, italic: false, underline: false, color: "#374151", width: 475, textAlign: "center", lineHeight: 1.6 },
        { id: makeId(), type: "text",    x: 80,  y: 340, content: "Date: {{issue_date}}\n\n\n____________________\n{{issuer_name}}\n{{issuer_title}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#374151", width: 200 },
        { id: makeId(), type: "text",    x: 315, y: 340, content: "Organization:\n{{organization}}\n\n____________________\n{{signatory_name}}\n{{signatory_title}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#374151", width: 200 },
        { id: makeId(), type: "image",   x: 247, y: 480, label: "Logo", width: 100, height: 60, bgColor: "#F1F5F9", src: SAMPLE_LOGO_SRC },
        { id: makeId(), type: "shape",   x: 40,  y: 570, shapeType: "rectangle", width: 515, height: 6, fillColor: "#92400E", strokeColor: "#92400E", strokeWidth: 0, borderRadius: 3 },
        { id: makeId(), type: "text",    x: 40,  y: 590, content: "Certificate ID: {{certificate_id}}", fontSize: 9, bold: false, italic: false, underline: false, color: "#94A3B8", width: 515, textAlign: "center" },
      ],
    },
  ],
  styles: { primaryColor: "#92400E" },
};
