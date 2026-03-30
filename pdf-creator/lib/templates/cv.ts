import type { Template } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";

export const CV_TEMPLATE: Template = {
  name: "Professional CV",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#1E3A5F" },
  pages: [
    {
      id: makeId(),
      elements: [
        // ── Left column accent bar ──────────────────────────────────────
        { id: makeId(), type: "shape", x: 0, y: 0, shapeType: "rectangle", width: 200, height: 842, fillColor: "#1E3A5F", strokeColor: "#1E3A5F", strokeWidth: 0, borderRadius: 0, opacity: 1 },

        // ── Name & title (left column) ──────────────────────────────────
        { id: makeId(), type: "heading", x: 20, y: 35, content: "{{full_name}}", fontSize: 22, bold: true, italic: false, underline: false, color: "#FFFFFF", width: 165 },
        { id: makeId(), type: "text", x: 20, y: 68, content: "{{job_title}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#93C5FD", width: 165 },

        // ── Contact info (left column) ──────────────────────────────────
        { id: makeId(), type: "divider", x: 20, y: 92, color: "#3B82F6", width: 160, thickness: 1 },
        { id: makeId(), type: "heading", x: 20, y: 104, content: "Contact", fontSize: 11, bold: true, italic: false, underline: false, color: "#93C5FD", width: 160 },
        { id: makeId(), type: "text", x: 20, y: 122, content: "{{email}}\n{{phone}}\n{{location}}\n{{linkedin}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#E2E8F0", width: 160, lineHeight: 1.7 },

        // ── Skills (left column) ────────────────────────────────────────
        { id: makeId(), type: "divider", x: 20, y: 195, color: "#3B82F6", width: 160, thickness: 1 },
        { id: makeId(), type: "heading", x: 20, y: 207, content: "Skills", fontSize: 11, bold: true, italic: false, underline: false, color: "#93C5FD", width: 160 },
        { id: makeId(), type: "text", x: 20, y: 225, content: "{{skills}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#E2E8F0", width: 160, lineHeight: 1.7, listStyle: "bullet" },

        // ── Languages (left column) ─────────────────────────────────────
        { id: makeId(), type: "divider", x: 20, y: 340, color: "#3B82F6", width: 160, thickness: 1 },
        { id: makeId(), type: "heading", x: 20, y: 352, content: "Languages", fontSize: 11, bold: true, italic: false, underline: false, color: "#93C5FD", width: 160 },
        { id: makeId(), type: "text", x: 20, y: 370, content: "{{languages}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#E2E8F0", width: 160, lineHeight: 1.7 },

        // ── Education (left column) ─────────────────────────────────────
        { id: makeId(), type: "divider", x: 20, y: 430, color: "#3B82F6", width: 160, thickness: 1 },
        { id: makeId(), type: "heading", x: 20, y: 442, content: "Education", fontSize: 11, bold: true, italic: false, underline: false, color: "#93C5FD", width: 160 },
        { id: makeId(), type: "text", x: 20, y: 460, content: "{{degree}}\n{{university}}\n{{graduation_year}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#E2E8F0", width: 160, lineHeight: 1.6 },

        // ── Profile summary (right column) ──────────────────────────────
        { id: makeId(), type: "heading", x: 220, y: 35, content: "Profile", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E3A5F", width: 340 },
        { id: makeId(), type: "divider", x: 220, y: 56, color: "#1E3A5F", width: 340, thickness: 2 },
        { id: makeId(), type: "text", x: 220, y: 68, content: "{{profile_summary}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 340, lineHeight: 1.6 },

        // ── Work experience (right column) ──────────────────────────────
        { id: makeId(), type: "heading", x: 220, y: 140, content: "Work Experience", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E3A5F", width: 340 },
        { id: makeId(), type: "divider", x: 220, y: 161, color: "#1E3A5F", width: 340, thickness: 2 },

        // Job 1
        { id: makeId(), type: "text", x: 220, y: 175, content: "{{job1_title}}  —  {{job1_company}}", fontSize: 12, bold: true, italic: false, underline: false, color: "#1E293B", width: 340 },
        { id: makeId(), type: "text", x: 220, y: 192, content: "{{job1_dates}}", fontSize: 10, bold: false, italic: true, underline: false, color: "#64748B", width: 340 },
        { id: makeId(), type: "text", x: 220, y: 208, content: "{{job1_description}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 340, lineHeight: 1.5, listStyle: "bullet" },

        // Job 2
        { id: makeId(), type: "text", x: 220, y: 310, content: "{{job2_title}}  —  {{job2_company}}", fontSize: 12, bold: true, italic: false, underline: false, color: "#1E293B", width: 340 },
        { id: makeId(), type: "text", x: 220, y: 327, content: "{{job2_dates}}", fontSize: 10, bold: false, italic: true, underline: false, color: "#64748B", width: 340 },
        { id: makeId(), type: "text", x: 220, y: 343, content: "{{job2_description}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 340, lineHeight: 1.5, listStyle: "bullet" },

        // Job 3
        { id: makeId(), type: "text", x: 220, y: 445, content: "{{job3_title}}  —  {{job3_company}}", fontSize: 12, bold: true, italic: false, underline: false, color: "#1E293B", width: 340 },
        { id: makeId(), type: "text", x: 220, y: 462, content: "{{job3_dates}}", fontSize: 10, bold: false, italic: true, underline: false, color: "#64748B", width: 340 },
        { id: makeId(), type: "text", x: 220, y: 478, content: "{{job3_description}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 340, lineHeight: 1.5, listStyle: "bullet" },

        // ── Certifications (right column) ───────────────────────────────
        { id: makeId(), type: "heading", x: 220, y: 580, content: "Certifications", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E3A5F", width: 340 },
        { id: makeId(), type: "divider", x: 220, y: 601, color: "#1E3A5F", width: 340, thickness: 2 },
        { id: makeId(), type: "text", x: 220, y: 613, content: "{{certifications}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 340, lineHeight: 1.6, listStyle: "bullet" },

        // ── References (right column) ───────────────────────────────────
        { id: makeId(), type: "heading", x: 220, y: 700, content: "References", fontSize: 14, bold: true, italic: false, underline: false, color: "#1E3A5F", width: 340 },
        { id: makeId(), type: "divider", x: 220, y: 721, color: "#1E3A5F", width: 340, thickness: 2 },
        { id: makeId(), type: "text", x: 220, y: 733, content: "Available upon request.", fontSize: 10, bold: false, italic: true, underline: false, color: "#64748B", width: 340 },
      ],
    },
  ],
};
