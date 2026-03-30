import type { Template } from "@/types/template";
import { makeId, BUNDLED_FONTS } from "./utils";

export const TRAVEL_ITINERARY_TEMPLATE: Template = {
  name: "Travel Itinerary",
  pageSize: "A4",
  fonts: BUNDLED_FONTS,
  styles: { primaryColor: "#0E7490" },
  pages: [
    // ── Page 1: Cover + Day 1-2 ─────────────────────────────────────────────
    {
      id: makeId(),
      elements: [
        // Header accent
        { id: makeId(), type: "shape", x: 0, y: 0, shapeType: "rectangle", width: 595, height: 120, fillColor: "#0E7490", strokeColor: "#0E7490", strokeWidth: 0, borderRadius: 0 },
        { id: makeId(), type: "heading", x: 40, y: 25, content: "Travel Itinerary", fontSize: 28, bold: true, italic: false, underline: false, color: "#FFFFFF", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 62, content: "{{trip_name}}", fontSize: 16, bold: false, italic: false, underline: false, color: "#CFFAFE", width: 300 },
        { id: makeId(), type: "text", x: 40, y: 88, content: "{{travel_dates}}  •  {{traveler_name}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#A5F3FC", width: 400 },

        // Trip overview
        { id: makeId(), type: "text", x: 40, y: 140, content: "Destination: {{destination}}\nAccommodation: {{hotel_name}}\nBooking Ref: {{booking_ref}}\nEmergency Contact: {{emergency_contact}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.7 },

        // Day 1
        { id: makeId(), type: "divider", x: 40, y: 240, color: "#0E7490", width: 515, thickness: 2 },
        { id: makeId(), type: "heading", x: 40, y: 252, content: "Day 1 — {{day1_date}}", fontSize: 15, bold: true, italic: false, underline: false, color: "#0E7490", width: 515 },
        { id: makeId(), type: "table", x: 40, y: 278,
          headers: ["Time", "Activity", "Location", "Notes"],
          rows: [
            ["{{d1_time1}}", "{{d1_activity1}}", "{{d1_location1}}", "{{d1_notes1}}"],
            ["{{d1_time2}}", "{{d1_activity2}}", "{{d1_location2}}", "{{d1_notes2}}"],
            ["{{d1_time3}}", "{{d1_activity3}}", "{{d1_location3}}", "{{d1_notes3}}"],
            ["{{d1_time4}}", "{{d1_activity4}}", "{{d1_location4}}", "{{d1_notes4}}"],
          ],
          headerColor: "#0E7490", headerTextColor: "#ffffff", fontSize: 10, width: 515 },

        // Day 2
        { id: makeId(), type: "divider", x: 40, y: 445, color: "#0E7490", width: 515, thickness: 2 },
        { id: makeId(), type: "heading", x: 40, y: 457, content: "Day 2 — {{day2_date}}", fontSize: 15, bold: true, italic: false, underline: false, color: "#0E7490", width: 515 },
        { id: makeId(), type: "table", x: 40, y: 483,
          headers: ["Time", "Activity", "Location", "Notes"],
          rows: [
            ["{{d2_time1}}", "{{d2_activity1}}", "{{d2_location1}}", "{{d2_notes1}}"],
            ["{{d2_time2}}", "{{d2_activity2}}", "{{d2_location2}}", "{{d2_notes2}}"],
            ["{{d2_time3}}", "{{d2_activity3}}", "{{d2_location3}}", "{{d2_notes3}}"],
            ["{{d2_time4}}", "{{d2_activity4}}", "{{d2_location4}}", "{{d2_notes4}}"],
          ],
          headerColor: "#0E7490", headerTextColor: "#ffffff", fontSize: 10, width: 515 },

        // Notes
        { id: makeId(), type: "divider", x: 40, y: 650, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "heading", x: 40, y: 665, content: "Important Notes", fontSize: 12, bold: true, italic: false, underline: false, color: "#0E7490", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 685, content: "{{important_notes}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.5 },
      ],
    },
    // ── Page 2: Day 3-4 + Packing ───────────────────────────────────────────
    {
      id: makeId(),
      elements: [
        // Day 3
        { id: makeId(), type: "divider", x: 40, y: 30, color: "#0E7490", width: 515, thickness: 2 },
        { id: makeId(), type: "heading", x: 40, y: 42, content: "Day 3 — {{day3_date}}", fontSize: 15, bold: true, italic: false, underline: false, color: "#0E7490", width: 515 },
        { id: makeId(), type: "table", x: 40, y: 68,
          headers: ["Time", "Activity", "Location", "Notes"],
          rows: [
            ["{{d3_time1}}", "{{d3_activity1}}", "{{d3_location1}}", "{{d3_notes1}}"],
            ["{{d3_time2}}", "{{d3_activity2}}", "{{d3_location2}}", "{{d3_notes2}}"],
            ["{{d3_time3}}", "{{d3_activity3}}", "{{d3_location3}}", "{{d3_notes3}}"],
          ],
          headerColor: "#0E7490", headerTextColor: "#ffffff", fontSize: 10, width: 515 },

        // Day 4
        { id: makeId(), type: "divider", x: 40, y: 215, color: "#0E7490", width: 515, thickness: 2 },
        { id: makeId(), type: "heading", x: 40, y: 227, content: "Day 4 — {{day4_date}}", fontSize: 15, bold: true, italic: false, underline: false, color: "#0E7490", width: 515 },
        { id: makeId(), type: "table", x: 40, y: 253,
          headers: ["Time", "Activity", "Location", "Notes"],
          rows: [
            ["{{d4_time1}}", "{{d4_activity1}}", "{{d4_location1}}", "{{d4_notes1}}"],
            ["{{d4_time2}}", "{{d4_activity2}}", "{{d4_location2}}", "{{d4_notes2}}"],
            ["{{d4_time3}}", "{{d4_activity3}}", "{{d4_location3}}", "{{d4_notes3}}"],
          ],
          headerColor: "#0E7490", headerTextColor: "#ffffff", fontSize: 10, width: 515 },

        // Packing checklist
        { id: makeId(), type: "divider", x: 40, y: 410, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "heading", x: 40, y: 425, content: "Packing Checklist", fontSize: 15, bold: true, italic: false, underline: false, color: "#0E7490", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 450, content: "{{packing_list}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 240, lineHeight: 1.5, listStyle: "bullet" },
        { id: makeId(), type: "text", x: 315, y: 450, content: "{{packing_list_2}}", fontSize: 11, bold: false, italic: false, underline: false, color: "#374151", width: 240, lineHeight: 1.5, listStyle: "bullet" },

        // Contact info
        { id: makeId(), type: "divider", x: 40, y: 640, color: "#CBD5E1", width: 515, thickness: 1 },
        { id: makeId(), type: "heading", x: 40, y: 655, content: "Emergency Contacts & Useful Numbers", fontSize: 12, bold: true, italic: false, underline: false, color: "#0E7490", width: 515 },
        { id: makeId(), type: "text", x: 40, y: 678, content: "Hotel: {{hotel_phone}}\nAirline: {{airline_phone}}\nEmbassy: {{embassy_phone}}\nTravel Insurance: {{insurance_phone}}", fontSize: 10, bold: false, italic: false, underline: false, color: "#374151", width: 515, lineHeight: 1.7 },
      ],
    },
  ],
};
