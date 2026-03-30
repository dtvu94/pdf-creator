import type { Template } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";

export const EVENT_INVITATION_TEMPLATE: Template = {
  name: "Event Invitation",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#9333EA" },
  pages: [
    {
      id: makeId(),
      elements: [
        // Decorative top accent
        { id: makeId(), type: "shape", x: 0, y: 0, shapeType: "rectangle", width: 595, height: 8, fillColor: "#9333EA", strokeColor: "#9333EA", strokeWidth: 0, borderRadius: 0 },

        // Top decorative diamond
        { id: makeId(), type: "shape", x: 272, y: 50, shapeType: "diamond", width: 50, height: 50, fillColor: "#F3E8FF", strokeColor: "#9333EA", strokeWidth: 1.5, borderRadius: 0 },

        // "You're Invited" heading
        { id: makeId(), type: "heading", x: 40, y: 120, content: "You\u2019re Invited", fontSize: 36, bold: true, italic: false, underline: false, color: "#9333EA", width: 515, textAlign: "center" },

        // Event name
        { id: makeId(), type: "heading", x: 40, y: 180, content: "{{event_name}}", fontSize: 24, bold: true, italic: false, underline: false, color: "#1E293B", width: 515, textAlign: "center" },

        // Decorative divider
        { id: makeId(), type: "divider", x: 200, y: 225, color: "#9333EA", width: 195, thickness: 2 },

        // Event description
        { id: makeId(), type: "text", x: 80, y: 250, content: "{{event_description}}", fontSize: 13, bold: false, italic: false, underline: false, color: "#374151", width: 435, textAlign: "center", lineHeight: 1.6 },

        // Details cards
        { id: makeId(), type: "card", x: 60, y: 340, title: "DATE", value: "{{event_date}}", unit: "", subtitle: "{{event_day}}", accentColor: "#9333EA", bgColor: "#FFFFFF", borderColor: "#E9D5FF", width: 220, height: 95 },
        { id: makeId(), type: "card", x: 315, y: 340, title: "TIME", value: "{{event_time}}", unit: "", subtitle: "{{event_duration}}", accentColor: "#9333EA", bgColor: "#FFFFFF", borderColor: "#E9D5FF", width: 220, height: 95 },

        // Venue
        { id: makeId(), type: "heading", x: 40, y: 470, content: "Venue", fontSize: 14, bold: true, italic: false, underline: false, color: "#9333EA", width: 515, textAlign: "center" },
        { id: makeId(), type: "text", x: 80, y: 495, content: "{{venue_name}}\n{{venue_address}}", fontSize: 13, bold: false, italic: false, underline: false, color: "#374151", width: 435, textAlign: "center", lineHeight: 1.5 },

        // Divider
        { id: makeId(), type: "divider", x: 200, y: 555, color: "#E9D5FF", width: 195, thickness: 1 },

        // Dress code / special notes
        { id: makeId(), type: "text", x: 80, y: 575, content: "Dress Code: {{dress_code}}", fontSize: 12, bold: false, italic: true, underline: false, color: "#64748B", width: 435, textAlign: "center" },

        // RSVP section
        { id: makeId(), type: "heading", x: 40, y: 620, content: "RSVP", fontSize: 16, bold: true, italic: false, underline: false, color: "#9333EA", width: 515, textAlign: "center" },
        { id: makeId(), type: "text", x: 80, y: 650, content: "Please respond by {{rsvp_date}}\n{{rsvp_email}} | {{rsvp_phone}}", fontSize: 12, bold: false, italic: false, underline: false, color: "#374151", width: 435, textAlign: "center", lineHeight: 1.6 },

        // Host
        { id: makeId(), type: "text", x: 80, y: 730, content: "Hosted by {{host_name}}", fontSize: 11, bold: false, italic: true, underline: false, color: "#64748B", width: 435, textAlign: "center" },

        // Decorative bottom accent
        { id: makeId(), type: "shape", x: 0, y: 834, shapeType: "rectangle", width: 595, height: 8, fillColor: "#9333EA", strokeColor: "#9333EA", strokeWidth: 0, borderRadius: 0 },
      ],
    },
  ],
};
