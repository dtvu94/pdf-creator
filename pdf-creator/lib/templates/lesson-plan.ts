import type { Template } from "@/types/template";
import { makeId, SAMPLE_LOGO_SRC, BUNDLED_FONTS } from "./utils";

export const LESSON_PLAN_TEMPLATE: Template = {
  name: "Lesson Plan",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  pages: [
    {
      id: makeId(),
      elements: [
        { id: makeId(), type: "image",   x: 475, y: 22,  label: "Logo", width: 80, height: 50, bgColor: "#DBEAFE", src: SAMPLE_LOGO_SRC },
        { id: makeId(), type: "heading", x: 40,  y: 28,  content: "Lesson Plan", fontSize: 24, bold: true, italic: false, underline: false, color: "#7C3AED", width: 390 },
        { id: makeId(), type: "divider", x: 40,  y: 62,  color: "#7C3AED", width: 515, thickness: 2 },
        { id: makeId(), type: "text",    x: 40,  y: 78,  content: "Subject: {{subject}}\nGrade Level: {{grade_level}}\nTeacher: {{teacher_name}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 280 },
        { id: makeId(), type: "text",    x: 340, y: 78,  content: "Date: {{lesson_date}}\nDuration: {{duration}}\nRoom: {{room}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 215 },
        { id: makeId(), type: "divider", x: 40,  y: 140, width: 515, thickness: 1, color: "#CBD5E1" },
        { id: makeId(), type: "heading", x: 40,  y: 155, content: "Learning Objectives", fontSize: 13, bold: true, italic: false, underline: false, color: "#7C3AED", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 175, content: "{{objectives}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.5, listStyle: "bullet" },
        { id: makeId(), type: "heading", x: 40,  y: 268, content: "Materials Needed", fontSize: 13, bold: true, italic: false, underline: false, color: "#7C3AED", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 288, content: "{{materials}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.5, listStyle: "bullet" },
        { id: makeId(), type: "heading", x: 40,  y: 370, content: "Lesson Procedure", fontSize: 13, bold: true, italic: false, underline: false, color: "#7C3AED", width: 515 },
        { id: makeId(), type: "table",   x: 40,  y: 393,
          headers: ["Phase", "Activity", "Time", "Notes"],
          rows: [
            ["Introduction", "Hook activity/warm-up", "10 min", ""],
            ["Presentation", "Direct instruction", "15 min", ""],
            ["Practice", "Guided practice activity", "15 min", ""],
            ["Application", "Independent work", "10 min", ""],
            ["Closure", "Review and wrap-up", "5 min", ""],
          ],
          headerColor: "#7C3AED", headerTextColor: "#ffffff", fontSize: 10, width: 515 },
        { id: makeId(), type: "divider", x: 40,  y: 540, width: 515, thickness: 1, color: "#CBD5E1" },
        { id: makeId(), type: "heading", x: 40,  y: 555, content: "Assessment", fontSize: 13, bold: true, italic: false, underline: false, color: "#7C3AED", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 575, content: "{{assessment}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.5 },
        { id: makeId(), type: "heading", x: 40,  y: 660, content: "Homework / Follow-up", fontSize: 13, bold: true, italic: false, underline: false, color: "#7C3AED", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 680, content: "{{homework}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515 },
        { id: makeId(), type: "text",    x: 40,  y: 730, content: "{{teacher_notes}}", fontSize: 11, bold: false, italic: true, underline: false, color: "#64748B", width: 515 },
      ],
    },
  ],
  styles: { primaryColor: "#7C3AED" },
};
