import type { Template } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";

export const NDA_TEMPLATE: Template = {
  name: "Non-Disclosure Agreement",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "heading", x: 40,  y: 40,  content: "Non-Disclosure Agreement", fontSize: 22, bold: true, italic: false, underline: false, color: "#1F2937", width: 515, textAlign: "center" },
        { id: makeId(), type: "divider", x: 40,  y: 72,  width: 515, thickness: 2, color: "#1F2937" },
        { id: makeId(), type: "text",    x: 40,  y: 95,  content: "This Non-Disclosure Agreement (\"Agreement\") is entered into as of {{effective_date}} by and between:\n\nDisclosing Party: {{disclosing_party_name}}, located at {{disclosing_party_address}}\n\nReceiving Party: {{receiving_party_name}}, located at {{receiving_party_address}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40,  y: 230, content: "1. Definition of Confidential Information", fontSize: 13, bold: true, italic: false, underline: false, color: "#1F2937", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 250, content: "{{section1_text}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40,  y: 350, content: "2. Obligations of Receiving Party", fontSize: 13, bold: true, italic: false, underline: false, color: "#1F2937", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 370, content: "{{section2_text}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40,  y: 470, content: "3. Term and Duration", fontSize: 13, bold: true, italic: false, underline: false, color: "#1F2937", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 490, content: "{{section3_text}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "heading", x: 40,  y: 570, content: "4. Remedies", fontSize: 13, bold: true, italic: false, underline: false, color: "#1F2937", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 590, content: "{{section4_text}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
      ],
    },
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "heading", x: 40,  y: 40,  content: "5. General Provisions", fontSize: 13, bold: true, italic: false, underline: false, color: "#1F2937", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 60,  content: "{{section5_text}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.6 },
        { id: makeId(), type: "text",    x: 40,  y: 160, content: "Amendment: Clause 3.1 previously stated a 2-year term.", fontSize: 10, bold: false, italic: false, underline: false, strikethrough: true, color: "#94A3B8", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 178, content: "Revised: The term of this Agreement shall be 5 years from the effective date.", fontSize: 10, bold: false, italic: true, underline: false, color: "#1F2937", width: 515 },
        { id: makeId(), type: "divider", x: 40,  y: 200, width: 515, thickness: 1, color: "#CBD5E1" },
        { id: makeId(), type: "text",    x: 40,  y: 220, content: "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.", fontSize: 11, bold: true, italic: false, underline: false, color: "#374151", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 280, content: "Disclosing Party:\n\n\n____________________\nName: {{disclosing_party_signatory}}\nTitle: {{disclosing_party_title}}\nDate: {{signing_date}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 240 },
        { id: makeId(), type: "text",    x: 320, y: 280, content: "Receiving Party:\n\n\n____________________\nName: {{receiving_party_signatory}}\nTitle: {{receiving_party_title}}\nDate: {{signing_date}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 240 },
      ],
    },
  ],
  styles: { primaryColor: "#1F2937" },
};
