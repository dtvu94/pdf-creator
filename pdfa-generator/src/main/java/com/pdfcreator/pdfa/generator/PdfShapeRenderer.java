package com.pdfcreator.pdfa.generator;

import org.apache.pdfbox.pdmodel.PDPageContentStream;

import java.awt.Color;
import java.io.IOException;

/**
 * Renders shape elements (rectangle, circle, line, triangle, diamond, arrow, heart)
 * using PDFBox content stream drawing operations.
 *
 * All coordinates use PDF coordinate system (origin at bottom-left, Y increases upward).
 * The caller must convert from template coordinates (origin top-left) before calling.
 */
public class PdfShapeRenderer {

    /**
     * Render a shape element at the given PDF coordinates.
     *
     * @param cs        content stream to draw on
     * @param shapeType one of: rectangle, circle, line, triangle, diamond, arrow, heart
     * @param x         left edge in PDF coords
     * @param y         bottom edge in PDF coords
     * @param w         width
     * @param h         height
     * @param fillColor fill color
     * @param strokeColor stroke color
     * @param strokeWidth stroke width (0 = no stroke)
     * @param borderRadius border radius (for rectangle)
     * @param opacity   opacity 0-1
     */
    public static void renderShape(PDPageContentStream cs, String shapeType,
                                   float x, float y, float w, float h,
                                   Color fillColor, Color strokeColor,
                                   float strokeWidth, float borderRadius,
                                   float opacity) throws IOException {

        cs.saveGraphicsState();
        setOpacity(cs, opacity);

        switch (shapeType) {
            case "line" -> renderLine(cs, x, y, w, h, strokeColor, strokeWidth);
            case "circle" -> renderCircle(cs, x, y, w, h, fillColor, strokeColor, strokeWidth);
            case "triangle" -> renderTriangle(cs, x, y, w, h, fillColor, strokeColor, strokeWidth);
            case "diamond" -> renderDiamond(cs, x, y, w, h, fillColor, strokeColor, strokeWidth);
            case "arrow" -> renderArrow(cs, x, y, w, h, fillColor, strokeColor, strokeWidth);
            case "heart" -> renderHeart(cs, x, y, w, h, fillColor, strokeColor, strokeWidth);
            default -> renderRectangle(cs, x, y, w, h, fillColor, strokeColor, strokeWidth, borderRadius);
        }

        cs.restoreGraphicsState();
    }

    private static void renderRectangle(PDPageContentStream cs, float x, float y,
                                        float w, float h, Color fill, Color stroke,
                                        float sw, float br) throws IOException {
        if (br > 0) {
            float r = Math.min(br, Math.min(w, h) / 2);
            addRoundedRect(cs, x, y, w, h, r);
        } else {
            cs.addRect(x, y, w, h);
        }
        fillAndStroke(cs, fill, stroke, sw);
    }

    private static void renderCircle(PDPageContentStream cs, float x, float y,
                                     float w, float h, Color fill, Color stroke,
                                     float sw) throws IOException {
        float cx = x + w / 2;
        float cy = y + h / 2;
        float rx = w / 2;
        float ry = h / 2;
        addEllipse(cs, cx, cy, rx, ry);
        fillAndStroke(cs, fill, stroke, sw);
    }

    private static void renderLine(PDPageContentStream cs, float x, float y,
                                   float w, float h, Color stroke, float sw) throws IOException {
        float lineY = y + h / 2;
        cs.setLineWidth(Math.max(1, sw));
        cs.setStrokingColor(stroke);
        cs.moveTo(x, lineY);
        cs.lineTo(x + w, lineY);
        cs.stroke();
    }

    private static void renderTriangle(PDPageContentStream cs, float x, float y,
                                       float w, float h, Color fill, Color stroke,
                                       float sw) throws IOException {
        // Triangle: top-center, bottom-right, bottom-left
        cs.moveTo(x + w / 2, y + h);  // top center
        cs.lineTo(x + w, y);           // bottom right
        cs.lineTo(x, y);               // bottom left
        cs.closePath();
        fillAndStroke(cs, fill, stroke, sw);
    }

    private static void renderDiamond(PDPageContentStream cs, float x, float y,
                                      float w, float h, Color fill, Color stroke,
                                      float sw) throws IOException {
        cs.moveTo(x + w / 2, y + h);  // top
        cs.lineTo(x + w, y + h / 2);  // right
        cs.lineTo(x + w / 2, y);      // bottom
        cs.lineTo(x, y + h / 2);      // left
        cs.closePath();
        fillAndStroke(cs, fill, stroke, sw);
    }

    private static void renderArrow(PDPageContentStream cs, float x, float y,
                                    float w, float h, Color fill, Color stroke,
                                    float sw) throws IOException {
        float headW = w * 0.4f;
        float bodyH = h * 0.4f;
        float bodyTop = y + (h + bodyH) / 2;
        float bodyBottom = y + (h - bodyH) / 2;

        cs.moveTo(x, bodyTop);
        cs.lineTo(x + w - headW, bodyTop);
        cs.lineTo(x + w - headW, y + h);
        cs.lineTo(x + w, y + h / 2);
        cs.lineTo(x + w - headW, y);
        cs.lineTo(x + w - headW, bodyBottom);
        cs.lineTo(x, bodyBottom);
        cs.closePath();
        fillAndStroke(cs, fill, stroke, sw);
    }

    private static void renderHeart(PDPageContentStream cs, float x, float y,
                                    float w, float h, Color fill, Color stroke,
                                    float sw) throws IOException {
        // Approximate heart shape with bezier curves
        // Scale to fit within w x h
        float cx = x + w / 2;

        // Bottom point
        cs.moveTo(cx, y);

        // Right side curve
        cs.curveTo(
                cx + w * 0.25f, y + h * 0.15f,
                x + w, y + h * 0.5f,
                x + w, y + h * 0.7f
        );
        // Right top curve
        cs.curveTo(
                x + w, y + h * 0.95f,
                cx + w * 0.1f, y + h,
                cx, y + h * 0.7f
        );
        // Left top curve
        cs.curveTo(
                cx - w * 0.1f, y + h,
                x, y + h * 0.95f,
                x, y + h * 0.7f
        );
        // Left side curve
        cs.curveTo(
                x, y + h * 0.5f,
                cx - w * 0.25f, y + h * 0.15f,
                cx, y
        );
        cs.closePath();
        fillAndStroke(cs, fill, stroke, sw);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static void fillAndStroke(PDPageContentStream cs, Color fill, Color stroke,
                                      float sw) throws IOException {
        boolean hasFill = fill != null && fill.getAlpha() > 0;
        boolean hasStroke = stroke != null && sw > 0;

        if (hasFill) cs.setNonStrokingColor(fill);
        if (hasStroke) {
            cs.setStrokingColor(stroke);
            cs.setLineWidth(sw);
        }

        if (hasFill && hasStroke) {
            cs.fillAndStroke();
        } else if (hasFill) {
            cs.fill();
        } else if (hasStroke) {
            cs.stroke();
        }
    }

    private static void setOpacity(PDPageContentStream cs, float opacity) throws IOException {
        if (opacity < 1.0f) {
            var gs = new org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState();
            gs.setNonStrokingAlphaConstant(opacity);
            gs.setStrokingAlphaConstant(opacity);
            cs.setGraphicsStateParameters(gs);
        }
    }

    /**
     * Add an ellipse path using four bezier curves.
     */
    private static void addEllipse(PDPageContentStream cs, float cx, float cy,
                                   float rx, float ry) throws IOException {
        // Magic number for bezier approximation of a circle: 4/3 * (sqrt(2) - 1) ≈ 0.5523
        float k = 0.5523f;
        float kx = k * rx;
        float ky = k * ry;

        cs.moveTo(cx + rx, cy);
        cs.curveTo(cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry);
        cs.curveTo(cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy);
        cs.curveTo(cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry);
        cs.curveTo(cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy);
        cs.closePath();
    }

    /**
     * Add a rounded rectangle path.
     */
    private static void addRoundedRect(PDPageContentStream cs, float x, float y,
                                       float w, float h, float r) throws IOException {
        float k = 0.5523f * r;

        cs.moveTo(x + r, y);
        cs.lineTo(x + w - r, y);
        cs.curveTo(x + w - r + k, y, x + w, y + r - k, x + w, y + r);
        cs.lineTo(x + w, y + h - r);
        cs.curveTo(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h);
        cs.lineTo(x + r, y + h);
        cs.curveTo(x + r - k, y + h, x, y + h - r + k, x, y + h - r);
        cs.lineTo(x, y + r);
        cs.curveTo(x, y + r - k, x + r - k, y, x + r, y);
        cs.closePath();
    }

    /**
     * Parse a hex color string like "#FF0000" or "#ff0000" to a Color.
     */
    public static Color parseColor(String hex) {
        if (hex == null || hex.isEmpty()) return Color.BLACK;
        hex = hex.replace("#", "");
        if (hex.length() == 3) {
            // Short form: #RGB → #RRGGBB
            hex = "" + hex.charAt(0) + hex.charAt(0)
                    + hex.charAt(1) + hex.charAt(1)
                    + hex.charAt(2) + hex.charAt(2);
        }
        if (hex.length() == 8) {
            // RGBA
            int r = Integer.parseInt(hex.substring(0, 2), 16);
            int g = Integer.parseInt(hex.substring(2, 4), 16);
            int b = Integer.parseInt(hex.substring(4, 6), 16);
            int a = Integer.parseInt(hex.substring(6, 8), 16);
            return new Color(r, g, b, a);
        }
        if (hex.length() == 6) {
            int r = Integer.parseInt(hex.substring(0, 2), 16);
            int g = Integer.parseInt(hex.substring(2, 4), 16);
            int b = Integer.parseInt(hex.substring(4, 6), 16);
            return new Color(r, g, b);
        }
        return Color.BLACK;
    }

    /**
     * Parse CSS-like color values: hex, rgb(), rgba(), or named colors.
     */
    public static Color parseCssColor(String value) {
        if (value == null || value.isEmpty()) return Color.BLACK;
        value = value.trim();

        if (value.startsWith("#")) return parseColor(value);

        if (value.startsWith("rgba(")) {
            String inner = value.substring(5, value.length() - 1);
            String[] parts = inner.split(",");
            if (parts.length >= 4) {
                int r = Integer.parseInt(parts[0].trim());
                int g = Integer.parseInt(parts[1].trim());
                int b = Integer.parseInt(parts[2].trim());
                float a = Float.parseFloat(parts[3].trim());
                return new Color(r, g, b, Math.round(a * 255));
            }
        }

        if (value.startsWith("rgb(")) {
            String inner = value.substring(4, value.length() - 1);
            String[] parts = inner.split(",");
            if (parts.length >= 3) {
                int r = Integer.parseInt(parts[0].trim());
                int g = Integer.parseInt(parts[1].trim());
                int b = Integer.parseInt(parts[2].trim());
                return new Color(r, g, b);
            }
        }

        // Named colors
        return switch (value.toLowerCase()) {
            case "white" -> Color.WHITE;
            case "black" -> Color.BLACK;
            case "red" -> Color.RED;
            case "green" -> Color.GREEN;
            case "blue" -> Color.BLUE;
            case "gray", "grey" -> Color.GRAY;
            case "transparent" -> new Color(0, 0, 0, 0);
            case "none" -> new Color(0, 0, 0, 0);
            default -> parseColor(value);
        };
    }
}
