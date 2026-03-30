package com.pdfcreator.pdfa.generator;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.util.Base64;
import java.util.Iterator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Renders individual template elements onto a PDFBox content stream.
 *
 * All methods receive template coordinates (origin top-left) and convert
 * to PDF coordinates (origin bottom-left) using the provided pageHeight.
 */
public class PdfElementRenderer {

    private static final Pattern PLACEHOLDER_RE = Pattern.compile("\\{\\{([^}]+)}}");

    private final PDDocument document;
    private final PdfFontManager fontManager;
    private final String defaultFontFamily;
    /** JPEG quality 1-100 for image compression. 0 = no re-encoding. */
    private int imageQuality = 0;

    public PdfElementRenderer(PDDocument document, PdfFontManager fontManager, String defaultFontFamily) {
        this.document = document;
        this.fontManager = fontManager;
        this.defaultFontFamily = defaultFontFamily;
    }

    /**
     * Set image compression quality. When > 0 and < 90, images are re-encoded
     * as JPEG at this quality level to reduce file size.
     */
    public void setImageQuality(int quality) {
        this.imageQuality = quality;
    }

    /**
     * Render a single element. Dispatches based on element type.
     *
     * @param cs         content stream
     * @param el         element JSON
     * @param pageHeight page height for coordinate conversion
     * @param offsetX    additional X offset (for sections, repeater cards)
     * @param offsetY    additional Y offset (for sections, repeater cards)
     * @param pageNumber current page number (1-based)
     * @param totalPages total page count
     */
    public void renderElement(PDPageContentStream cs, JsonObject el, float pageHeight,
                              float offsetX, float offsetY,
                              int pageNumber, int totalPages) throws IOException {
        float rotation = getFloat(el, "rotation", 0);
        if (rotation != 0) {
            // Apply rotation around the element's center
            float x = getFloat(el, "x", 0) + offsetX;
            float y = getFloat(el, "y", 0) + offsetY;
            float w = getFloat(el, "width", 0);
            float h = getFloat(el, "height", 0);
            float cx = x + w / 2;
            float cy = pageHeight - (y + h / 2);
            cs.saveGraphicsState();
            cs.transform(org.apache.pdfbox.util.Matrix.getTranslateInstance(cx, cy));
            cs.transform(org.apache.pdfbox.util.Matrix.getRotateInstance(
                    Math.toRadians(-rotation), 0, 0));
            cs.transform(org.apache.pdfbox.util.Matrix.getTranslateInstance(-cx, -cy));
        }

        String type = el.get("type").getAsString();
        switch (type) {
            case "text", "heading" -> renderText(cs, el, pageHeight, offsetX, offsetY, pageNumber, totalPages);
            case "link" -> renderLink(cs, el, pageHeight, offsetX, offsetY, pageNumber, totalPages);
            case "divider" -> renderDivider(cs, el, pageHeight, offsetX, offsetY);
            case "table" -> renderTable(cs, el, pageHeight, offsetX, offsetY);
            case "image" -> renderImage(cs, el, pageHeight, offsetX, offsetY);
            case "card" -> renderCard(cs, el, pageHeight, offsetX, offsetY);
            case "chart" -> renderChart(cs, el, pageHeight, offsetX, offsetY);
            case "shape" -> renderShape(cs, el, pageHeight, offsetX, offsetY);
            case "repeater" -> renderRepeater(cs, el, pageHeight, offsetX, offsetY, pageNumber, totalPages);
        }

        if (rotation != 0) {
            cs.restoreGraphicsState();
        }
    }

    // ─── Text / Heading ──────────────────────────────────────────────────────

    private void renderText(PDPageContentStream cs, JsonObject el, float pageHeight,
                            float offsetX, float offsetY,
                            int pageNumber, int totalPages) throws IOException {
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float width = getFloat(el, "width", 200);
        float fontSize = getFloat(el, "fontSize", 12);
        boolean bold = getBool(el, "bold", false);
        boolean italic = getBool(el, "italic", false);
        boolean underline = getBool(el, "underline", false);
        boolean strikethrough = getBool(el, "strikethrough", false);
        boolean superscript = getBool(el, "superscript", false);
        boolean subscript = getBool(el, "subscript", false);
        String color = getString(el, "color", "#000000");
        String textAlign = getString(el, "textAlign", "left");
        float lineHeight = getFloat(el, "lineHeight", 1.5f);
        String listStyle = getString(el, "listStyle", "none");
        float opacity = getFloat(el, "opacity", 1f);

        String content = getString(el, "content", "");
        // Resolve special placeholders
        content = content.replace("{{page_number}}", String.valueOf(pageNumber));
        content = content.replace("{{total_pages}}", String.valueOf(totalPages));

        // Adjust for superscript/subscript
        if (superscript || subscript) {
            fontSize = fontSize * 0.6f;
            if (superscript) y -= getFloat(el, "fontSize", 12) * 0.3f;
            if (subscript) y += getFloat(el, "fontSize", 12) * 0.15f;
        }

        PDFont font = fontManager.getFont(defaultFontFamily, bold, italic);
        Color textColor = PdfShapeRenderer.parseCssColor(color);

        cs.saveGraphicsState();
        if (opacity < 1f) {
            var gs = new org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState();
            gs.setNonStrokingAlphaConstant(opacity);
            cs.setGraphicsStateParameters(gs);
        }

        if (!"none".equals(listStyle)) {
            renderListText(cs, content, font, fontSize, lineHeight, textColor, underline,
                    strikethrough, listStyle, x, y, width, pageHeight, textAlign);
        } else {
            renderWrappedText(cs, content, font, fontSize, lineHeight, textColor, underline,
                    strikethrough, x, y, width, pageHeight, textAlign);
        }

        cs.restoreGraphicsState();
    }

    private void renderWrappedText(PDPageContentStream cs, String content, PDFont font,
                                   float fontSize, float lineHeight, Color color,
                                   boolean underline, boolean strikethrough,
                                   float x, float y, float maxWidth,
                                   float pageHeight, String textAlign) throws IOException {
        String sanitized = PdfTextLayout.sanitizeText(font, content);
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, fontSize, sanitized, maxWidth);

        float lineStep = fontSize * lineHeight;
        float currentY = y;

        cs.setNonStrokingColor(color);

        for (PdfTextLayout.WrappedLine line : lines) {
            float xOffset = PdfTextLayout.getAlignmentOffset(textAlign, line.width, maxWidth);
            float pdfX = x + xOffset;
            float pdfY = pageHeight - currentY - fontSize;

            cs.beginText();
            cs.setFont(font, fontSize);
            cs.newLineAtOffset(pdfX, pdfY);
            cs.showText(line.text);
            cs.endText();

            if (underline && !line.text.isEmpty()) {
                float underlineY = pdfY - fontSize * 0.15f;
                cs.setStrokingColor(color);
                cs.setLineWidth(fontSize * 0.05f);
                cs.moveTo(pdfX, underlineY);
                cs.lineTo(pdfX + line.width, underlineY);
                cs.stroke();
            }

            if (strikethrough && !line.text.isEmpty()) {
                float strikeY = pdfY + fontSize * 0.3f;
                cs.setStrokingColor(color);
                cs.setLineWidth(fontSize * 0.05f);
                cs.moveTo(pdfX, strikeY);
                cs.lineTo(pdfX + line.width, strikeY);
                cs.stroke();
            }

            currentY += lineStep;
        }
    }

    private void renderListText(PDPageContentStream cs, String content, PDFont font,
                                float fontSize, float lineHeight, Color color,
                                boolean underline, boolean strikethrough,
                                String listStyle,
                                float x, float y, float maxWidth, float pageHeight,
                                String textAlign) throws IOException {
        String[] lines = content.split("\n");
        float lineStep = fontSize * lineHeight;
        float currentY = y;
        float prefixWidth = fontSize; // approximate width for bullet/number

        cs.setNonStrokingColor(color);

        for (int i = 0; i < lines.length; i++) {
            String prefix = PdfTextLayout.getListPrefix(listStyle, i);
            float pdfY = pageHeight - currentY - fontSize;

            // Render prefix
            String sanitizedPrefix = PdfTextLayout.sanitizeText(font, prefix);
            cs.beginText();
            cs.setFont(font, fontSize);
            cs.newLineAtOffset(x, pdfY);
            cs.showText(sanitizedPrefix);
            cs.endText();

            // Render line text with wrapping
            String sanitized = PdfTextLayout.sanitizeText(font, lines[i]);
            List<PdfTextLayout.WrappedLine> wrapped = PdfTextLayout.wrapText(
                    font, fontSize, sanitized, maxWidth - prefixWidth);

            for (PdfTextLayout.WrappedLine wl : wrapped) {
                float xOffset = PdfTextLayout.getAlignmentOffset(textAlign, wl.width, maxWidth - prefixWidth);
                float pdfX = x + prefixWidth + xOffset;
                float linePdfY = pageHeight - currentY - fontSize;

                cs.beginText();
                cs.setFont(font, fontSize);
                cs.newLineAtOffset(pdfX, linePdfY);
                cs.showText(wl.text);
                cs.endText();

                if (underline && !wl.text.isEmpty()) {
                    float underlineY = linePdfY - fontSize * 0.15f;
                    cs.setStrokingColor(color);
                    cs.setLineWidth(fontSize * 0.05f);
                    cs.moveTo(pdfX, underlineY);
                    cs.lineTo(pdfX + wl.width, underlineY);
                    cs.stroke();
                }

                if (strikethrough && !wl.text.isEmpty()) {
                    float strikeY = linePdfY + fontSize * 0.3f;
                    cs.setStrokingColor(color);
                    cs.setLineWidth(fontSize * 0.05f);
                    cs.moveTo(pdfX, strikeY);
                    cs.lineTo(pdfX + wl.width, strikeY);
                    cs.stroke();
                }

                currentY += lineStep;
            }
        }
    }

    // ─── Link ────────────────────────────────────────────────────────────────

    private void renderLink(PDPageContentStream cs, JsonObject el, float pageHeight,
                            float offsetX, float offsetY,
                            int pageNumber, int totalPages) throws IOException {
        // Render link as colored, optionally underlined text
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float fontSize = getFloat(el, "fontSize", 12);
        String color = getString(el, "color", "#2563EB");
        boolean underline = getBool(el, "underline", true);
        float opacity = getFloat(el, "opacity", 1f);
        float width = getFloat(el, "width", 200);
        String content = getString(el, "content", "");

        PDFont font = fontManager.getFont(defaultFontFamily, false, false);
        Color textColor = PdfShapeRenderer.parseCssColor(color);

        cs.saveGraphicsState();
        if (opacity < 1f) {
            var gs = new org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState();
            gs.setNonStrokingAlphaConstant(opacity);
            cs.setGraphicsStateParameters(gs);
        }

        renderWrappedText(cs, content, font, fontSize, 1.5f, textColor, underline,
                false, x, y, width, pageHeight, "left");

        cs.restoreGraphicsState();
        // Note: actual PDF link annotations would need to be added to the page,
        // not the content stream. For visual fidelity, we render the text styled as a link.
    }

    // ─── Divider ─────────────────────────────────────────────────────────────

    private void renderDivider(PDPageContentStream cs, JsonObject el, float pageHeight,
                               float offsetX, float offsetY) throws IOException {
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float width = getFloat(el, "width", 200);
        float thickness = getFloat(el, "thickness", 1);
        String color = getString(el, "color", "#000000");

        float pdfY = pageHeight - y - thickness / 2;

        cs.saveGraphicsState();
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor(color));
        cs.addRect(x, pdfY, width, Math.max(1, thickness));
        cs.fill();
        cs.restoreGraphicsState();
    }

    // ─── Table ───────────────────────────────────────────────────────────────

    public void renderTable(PDPageContentStream cs, JsonObject el, float pageHeight,
                            float offsetX, float offsetY) throws IOException {
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float width = getFloat(el, "width", 400);
        float fontSize = getFloat(el, "fontSize", 10);
        String headerColor = getString(el, "headerColor", "#1E293B");
        String headerTextColor = getString(el, "headerTextColor", "#FFFFFF");

        JsonArray headers = el.getAsJsonArray("headers");
        JsonArray rows = el.getAsJsonArray("rows");

        if (headers == null || headers.isEmpty()) return;

        int colCount = headers.size();
        float colWidth = width / colCount;
        float cellPadding = 4;
        float rowHeight = fontSize + cellPadding * 2 + 4;

        PDFont boldFont = fontManager.getFont(defaultFontFamily, true, false);
        PDFont regularFont = fontManager.getFont(defaultFontFamily, false, false);

        float currentY = y;

        // ── Header row ──
        float pdfHeaderY = pageHeight - currentY - rowHeight;
        cs.saveGraphicsState();
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor(headerColor));
        cs.addRect(x, pdfHeaderY, width, rowHeight);
        cs.fill();
        cs.restoreGraphicsState();

        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor(headerTextColor));
        for (int i = 0; i < colCount; i++) {
            String text = PdfTextLayout.sanitizeText(boldFont, headers.get(i).getAsString());
            float cellX = x + i * colWidth + cellPadding + 2;
            float cellY = pdfHeaderY + cellPadding + 2;

            // Truncate if needed
            text = truncateToFit(boldFont, fontSize, text, colWidth - cellPadding * 2 - 4);

            cs.beginText();
            cs.setFont(boldFont, fontSize);
            cs.newLineAtOffset(cellX, cellY);
            cs.showText(text);
            cs.endText();
        }

        currentY += rowHeight;

        // ── Data rows ──
        if (rows != null) {
            Color evenBg = PdfShapeRenderer.parseCssColor("#F8FAFC");
            Color oddBg = PdfShapeRenderer.parseCssColor("#FFFFFF");
            Color borderColor = PdfShapeRenderer.parseCssColor("#E2E8F0");
            Color cellTextColor = PdfShapeRenderer.parseCssColor("#374151");

            for (int rowIdx = 0; rowIdx < rows.size(); rowIdx++) {
                JsonArray row = rows.get(rowIdx).getAsJsonArray();
                float pdfRowY = pageHeight - currentY - rowHeight;

                // Row background
                cs.saveGraphicsState();
                cs.setNonStrokingColor(rowIdx % 2 == 0 ? evenBg : oddBg);
                cs.addRect(x, pdfRowY, width, rowHeight);
                cs.fill();
                cs.restoreGraphicsState();

                // Bottom border
                cs.saveGraphicsState();
                cs.setStrokingColor(borderColor);
                cs.setLineWidth(0.5f);
                cs.moveTo(x, pdfRowY);
                cs.lineTo(x + width, pdfRowY);
                cs.stroke();
                cs.restoreGraphicsState();

                // Cell text
                cs.setNonStrokingColor(cellTextColor);
                for (int cellIdx = 0; cellIdx < Math.min(row.size(), colCount); cellIdx++) {
                    String text = PdfTextLayout.sanitizeText(regularFont, row.get(cellIdx).getAsString());
                    float cellX = x + cellIdx * colWidth + cellPadding + 2;
                    float cellPdfY = pdfRowY + cellPadding + 2;

                    text = truncateToFit(regularFont, fontSize, text, colWidth - cellPadding * 2 - 4);

                    cs.beginText();
                    cs.setFont(regularFont, fontSize);
                    cs.newLineAtOffset(cellX, cellPdfY);
                    cs.showText(text);
                    cs.endText();

                    // Column separator
                    if (cellIdx < colCount - 1) {
                        cs.saveGraphicsState();
                        cs.setStrokingColor(borderColor);
                        cs.setLineWidth(0.5f);
                        float sepX = x + (cellIdx + 1) * colWidth;
                        cs.moveTo(sepX, pdfRowY);
                        cs.lineTo(sepX, pdfRowY + rowHeight);
                        cs.stroke();
                        cs.restoreGraphicsState();
                    }
                }

                currentY += rowHeight;
            }
        }
    }

    /**
     * Calculate the total height of a table element.
     */
    public float calculateTableHeight(JsonObject el) {
        float fontSize = getFloat(el, "fontSize", 10);
        float cellPadding = 4;
        float rowHeight = fontSize + cellPadding * 2 + 4;

        int rowCount = 1; // header
        JsonArray rows = el.getAsJsonArray("rows");
        if (rows != null) rowCount += rows.size();

        return rowCount * rowHeight;
    }

    // ─── Image ───────────────────────────────────────────────────────────────

    private void renderImage(PDPageContentStream cs, JsonObject el, float pageHeight,
                             float offsetX, float offsetY) throws IOException {
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float width = getFloat(el, "width", 100);
        float height = getFloat(el, "height", 100);
        String src = getString(el, "src", null);
        String bgColor = getString(el, "bgColor", "#E2E8F0");
        String label = getString(el, "label", "Image");

        float pdfY = pageHeight - y - height;

        if (src != null && !src.isEmpty()) {
            try {
                PDImageXObject image = loadImage(src);
                if (image != null) {
                    cs.drawImage(image, x, pdfY, width, height);
                    return;
                }
            } catch (Exception e) {
                // Fall through to placeholder
            }
        }

        // Render placeholder box
        cs.saveGraphicsState();
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor(bgColor));
        cs.addRect(x, pdfY, width, height);
        cs.fill();

        // Border
        cs.setStrokingColor(PdfShapeRenderer.parseCssColor("#94A3B8"));
        cs.setLineWidth(0.5f);
        cs.addRect(x, pdfY, width, height);
        cs.stroke();

        // Label
        PDFont font = fontManager.getFont(defaultFontFamily, false, false);
        String sanitized = PdfTextLayout.sanitizeText(font, label);
        float textWidth = PdfTextLayout.measureText(font, 10, sanitized);
        float textX = x + (width - textWidth) / 2;
        float textY = pdfY + height / 2 - 5;

        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor("#64748B"));
        cs.beginText();
        cs.setFont(font, 10);
        cs.newLineAtOffset(textX, textY);
        cs.showText(sanitized);
        cs.endText();

        cs.restoreGraphicsState();
    }

    // ─── Chart ───────────────────────────────────────────────────────────────

    private void renderChart(PDPageContentStream cs, JsonObject el, float pageHeight,
                             float offsetX, float offsetY) throws IOException {
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float width = getFloat(el, "width", 200);
        float height = getFloat(el, "height", 150);
        String renderedImage = getString(el, "renderedImage", null);

        float pdfY = pageHeight - y - height;

        if (renderedImage != null && !renderedImage.isEmpty()) {
            try {
                PDImageXObject image = loadImage(renderedImage);
                if (image != null) {
                    cs.drawImage(image, x, pdfY, width, height);
                    return;
                }
            } catch (Exception e) {
                // Fall through to placeholder
            }
        }

        // Placeholder
        cs.saveGraphicsState();
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor("#F1F5F9"));
        cs.addRect(x, pdfY, width, height);
        cs.fill();

        cs.setStrokingColor(PdfShapeRenderer.parseCssColor("#94A3B8"));
        cs.setLineWidth(1f);
        float dash = 4f;
        cs.setLineDashPattern(new float[]{dash, dash}, 0);
        cs.addRect(x, pdfY, width, height);
        cs.stroke();
        cs.setLineDashPattern(new float[]{}, 0);

        PDFont font = fontManager.getFont(defaultFontFamily, false, false);
        String text = "Chart (not rendered)";
        String sanitized = PdfTextLayout.sanitizeText(font, text);
        float textWidth = PdfTextLayout.measureText(font, 10, sanitized);

        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor("#64748B"));
        cs.beginText();
        cs.setFont(font, 10);
        cs.newLineAtOffset(x + (width - textWidth) / 2, pdfY + height / 2 - 5);
        cs.showText(sanitized);
        cs.endText();

        cs.restoreGraphicsState();
    }

    // ─── Card ────────────────────────────────────────────────────────────────

    private void renderCard(PDPageContentStream cs, JsonObject el, float pageHeight,
                            float offsetX, float offsetY) throws IOException {
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float width = getFloat(el, "width", 150);
        float height = getFloat(el, "height", 100);
        String title = getString(el, "title", "").toUpperCase();
        String value = getString(el, "value", "");
        String unit = getString(el, "unit", "");
        String subtitle = getString(el, "subtitle", "");
        String accentColor = getString(el, "accentColor", "#6366F1");
        String bgColor = getString(el, "bgColor", "#FFFFFF");
        String borderColor = getString(el, "borderColor", "#E2E8F0");

        float pdfY = pageHeight - y - height;

        cs.saveGraphicsState();

        // Background with border
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor(bgColor));
        PdfShapeRenderer.renderShape(cs, "rectangle", x, pdfY, width, height,
                PdfShapeRenderer.parseCssColor(bgColor),
                PdfShapeRenderer.parseCssColor(borderColor),
                1, 6, 1f);

        // Accent top bar
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor(accentColor));
        cs.addRect(x, pdfY + height - 4, width, 4);
        cs.fill();

        float padding = 10;
        float contentTop = y + 4 + 8; // after accent bar + padding

        // Title
        PDFont boldFont = fontManager.getFont(defaultFontFamily, true, false);
        PDFont regularFont = fontManager.getFont(defaultFontFamily, false, false);

        String sanitizedTitle = PdfTextLayout.sanitizeText(boldFont, title);
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor(accentColor));
        cs.beginText();
        cs.setFont(boldFont, 7);
        cs.newLineAtOffset(x + padding, pageHeight - contentTop - 7);
        cs.showText(sanitizedTitle);
        cs.endText();

        // Value + Unit
        float valueY = contentTop + 20;
        String sanitizedValue = PdfTextLayout.sanitizeText(boldFont, value);
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor("#1E293B"));
        cs.beginText();
        cs.setFont(boldFont, 22);
        cs.newLineAtOffset(x + padding, pageHeight - valueY - 22);
        cs.showText(sanitizedValue);
        cs.endText();

        if (!unit.isEmpty()) {
            float valueWidth = PdfTextLayout.measureText(boldFont, 22, sanitizedValue);
            String sanitizedUnit = PdfTextLayout.sanitizeText(regularFont, unit);
            cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor("#64748B"));
            cs.beginText();
            cs.setFont(regularFont, 9);
            cs.newLineAtOffset(x + padding + valueWidth + 3, pageHeight - valueY - 20);
            cs.showText(sanitizedUnit);
            cs.endText();
        }

        // Subtitle
        float subtitleY = y + height - padding - 2;
        String sanitizedSubtitle = PdfTextLayout.sanitizeText(regularFont, subtitle);
        cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor("#94A3B8"));
        cs.beginText();
        cs.setFont(regularFont, 7);
        cs.newLineAtOffset(x + padding, pageHeight - subtitleY);
        cs.showText(sanitizedSubtitle);
        cs.endText();

        cs.restoreGraphicsState();
    }

    // ─── Shape ───────────────────────────────────────────────────────────────

    private void renderShape(PDPageContentStream cs, JsonObject el, float pageHeight,
                             float offsetX, float offsetY) throws IOException {
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float w = getFloat(el, "width", 100);
        float h = getFloat(el, "height", 100);
        String shapeType = getString(el, "shapeType", "rectangle");
        String fillColor = getString(el, "fillColor", "#3B82F6");
        String strokeColor = getString(el, "strokeColor", "#000000");
        float strokeWidth = getFloat(el, "strokeWidth", 0);
        float borderRadius = getFloat(el, "borderRadius", 0);
        float opacity = getFloat(el, "opacity", 1f);

        float pdfY = pageHeight - y - h;

        PdfShapeRenderer.renderShape(cs, shapeType, x, pdfY, w, h,
                PdfShapeRenderer.parseCssColor(fillColor),
                PdfShapeRenderer.parseCssColor(strokeColor),
                strokeWidth, borderRadius, opacity);
    }

    // ─── Repeater ────────────────────────────────────────────────────────────

    private void renderRepeater(PDPageContentStream cs, JsonObject el, float pageHeight,
                                float offsetX, float offsetY,
                                int pageNumber, int totalPages) throws IOException {
        float x = getFloat(el, "x", 0) + offsetX;
        float y = getFloat(el, "y", 0) + offsetY;
        float cardWidth = getFloat(el, "cardWidth", 150);
        float cardHeight = getFloat(el, "cardHeight", 100);
        int itemsPerRow = getInt(el, "itemsPerRow", 3);
        float gap = getFloat(el, "gap", 10);
        String dataKey = getString(el, "dataKey", "");

        JsonArray items = el.getAsJsonArray("items");
        JsonArray cardElements = el.getAsJsonArray("cardElements");

        if (items == null || items.isEmpty() || cardElements == null) {
            // Render placeholder
            float pdfY = pageHeight - y - 30;
            cs.saveGraphicsState();
            cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor("#EEF2FF"));
            cs.addRect(x, pdfY, 300, 30);
            cs.fill();
            cs.setStrokingColor(PdfShapeRenderer.parseCssColor("#6366F1"));
            cs.setLineWidth(1);
            cs.setLineDashPattern(new float[]{4, 4}, 0);
            cs.addRect(x, pdfY, 300, 30);
            cs.stroke();
            cs.setLineDashPattern(new float[]{}, 0);

            PDFont font = fontManager.getFont(defaultFontFamily, false, false);
            String text = "Repeater \"" + dataKey + "\" - no items provided";
            String sanitized = PdfTextLayout.sanitizeText(font, text);
            cs.setNonStrokingColor(PdfShapeRenderer.parseCssColor("#4338CA"));
            cs.beginText();
            cs.setFont(font, 9);
            cs.newLineAtOffset(x + 10, pdfY + 10);
            cs.showText(sanitized);
            cs.endText();
            cs.restoreGraphicsState();
            return;
        }

        float currentY = y;
        int itemIndex = 0;

        while (itemIndex < items.size()) {
            float rowX = x;

            for (int col = 0; col < itemsPerRow && itemIndex < items.size(); col++) {
                JsonObject item = items.get(itemIndex).getAsJsonObject();
                JsonObject fields = item.has("fields") ? item.getAsJsonObject("fields") : new JsonObject();
                JsonObject chartImages = item.has("chartImages") ? item.getAsJsonObject("chartImages") : new JsonObject();

                // Render each card element with item substitution
                for (JsonElement ceEl : cardElements) {
                    JsonObject cardEl = ceEl.getAsJsonObject().deepCopy();
                    substituteItem(cardEl, fields, chartImages);
                    renderElement(cs, cardEl, pageHeight, rowX, currentY, pageNumber, totalPages);
                }

                rowX += cardWidth + gap;
                itemIndex++;
            }

            currentY += cardHeight + gap;
        }
    }

    /**
     * Calculate the total height of a repeater element.
     */
    public float calculateRepeaterHeight(JsonObject el) {
        float cardHeight = getFloat(el, "cardHeight", 100);
        int itemsPerRow = getInt(el, "itemsPerRow", 3);
        float gap = getFloat(el, "gap", 10);

        JsonArray items = el.getAsJsonArray("items");
        if (items == null || items.isEmpty()) return 30;

        int rowCount = (int) Math.ceil((double) items.size() / itemsPerRow);
        return rowCount * cardHeight + (rowCount - 1) * gap;
    }

    // ─── Watermark ───────────────────────────────────────────────────────────

    public void renderImageWatermark(PDPageContentStream cs, JsonObject wm, float pageHeight) throws IOException {
        String src = getString(wm, "src", null);
        if (src == null || src.isEmpty()) return;

        float x = getFloat(wm, "x", 0);
        float y = getFloat(wm, "y", 0);
        float width = getFloat(wm, "width", 100);
        float height = getFloat(wm, "height", 100);
        float opacity = getFloat(wm, "opacity", 0.3f);

        float pdfY = pageHeight - y - height;

        try {
            PDImageXObject image = loadImage(src);
            if (image != null) {
                cs.saveGraphicsState();
                var gs = new org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState();
                gs.setNonStrokingAlphaConstant(opacity);
                cs.setGraphicsStateParameters(gs);
                cs.drawImage(image, x, pdfY, width, height);
                cs.restoreGraphicsState();
            }
        } catch (Exception e) {
            // Skip watermark if image fails to load
        }
    }

    // ─── Item Substitution (for Repeater) ────────────────────────────────────

    private void substituteItem(JsonObject el, JsonObject fields, JsonObject chartImages) {
        String type = getString(el, "type", "");

        switch (type) {
            case "text", "heading" -> {
                String content = getString(el, "content", "");
                el.addProperty("content", replacePlaceholders(content, fields));
            }
            case "card" -> {
                el.addProperty("title", replacePlaceholders(getString(el, "title", ""), fields));
                el.addProperty("value", replacePlaceholders(getString(el, "value", ""), fields));
                el.addProperty("subtitle", replacePlaceholders(getString(el, "subtitle", ""), fields));
            }
            case "chart" -> {
                String id = getString(el, "id", "");
                if (chartImages.has(id)) {
                    el.addProperty("renderedImage", chartImages.get(id).getAsString());
                }
            }
            case "table" -> {
                JsonArray headers = el.getAsJsonArray("headers");
                if (headers != null) {
                    JsonArray newHeaders = new JsonArray();
                    for (JsonElement h : headers) {
                        newHeaders.add(replacePlaceholders(h.getAsString(), fields));
                    }
                    el.add("headers", newHeaders);
                }
                String rowsDataField = getString(el, "rowsDataField", null);
                if (rowsDataField != null && fields.has(rowsDataField)) {
                    try {
                        JsonArray parsed = com.google.gson.JsonParser.parseString(
                                fields.get(rowsDataField).getAsString()).getAsJsonArray();
                        el.add("rows", parsed);
                    } catch (Exception ignored) {
                    }
                }
            }
            case "image" -> {
                el.addProperty("label", replacePlaceholders(getString(el, "label", ""), fields));
                String srcField = getString(el, "srcField", null);
                if (srcField != null && fields.has(srcField)) {
                    el.addProperty("src", fields.get(srcField).getAsString());
                }
            }
        }
    }

    private String replacePlaceholders(String text, JsonObject fields) {
        if (text == null) return "";
        Matcher m = PLACEHOLDER_RE.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String key = m.group(1).trim();
            String replacement = fields.has(key) ? fields.get(key).getAsString() : m.group(0);
            m.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    // ─── Image Loading ───────────────────────────────────────────────────────

    private PDImageXObject loadImage(String src) throws IOException {
        if (src.startsWith("data:")) {
            // base64 data URI
            int commaIdx = src.indexOf(',');
            if (commaIdx < 0) return null;
            String base64 = src.substring(commaIdx + 1);
            byte[] imageBytes = Base64.getDecoder().decode(base64);

            // Determine format from header
            String header = src.substring(0, commaIdx).toLowerCase();
            if (header.contains("png")) {
                return PDImageXObject.createFromByteArray(document, imageBytes, "image.png");
            } else if (header.contains("jpeg") || header.contains("jpg")) {
                return PDImageXObject.createFromByteArray(document, imageBytes, "image.jpg");
            } else {
                // Try to convert via ImageIO
                return createImageFromBytes(imageBytes);
            }
        } else if (src.startsWith("http://") || src.startsWith("https://")) {
            // Download from URL
            byte[] imageBytes = URI.create(src).toURL().openStream().readAllBytes();
            return createImageFromBytes(imageBytes);
        }
        return null;
    }

    private PDImageXObject createImageFromBytes(byte[] imageBytes) throws IOException {
        // When compression is requested, re-encode as JPEG at the given quality
        if (imageQuality > 0 && imageQuality < 90) {
            byte[] compressed = compressToJpeg(imageBytes);
            if (compressed != null) {
                return PDImageXObject.createFromByteArray(document, compressed, "image.jpg");
            }
        }

        // Try direct load first
        try {
            return PDImageXObject.createFromByteArray(document, imageBytes, "image");
        } catch (Exception e) {
            // Convert to PNG via BufferedImage
            BufferedImage buffered = ImageIO.read(new java.io.ByteArrayInputStream(imageBytes));
            if (buffered == null) return null;
            ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
            ImageIO.write(buffered, "PNG", pngOut);
            return PDImageXObject.createFromByteArray(document, pngOut.toByteArray(), "image.png");
        }
    }

    /**
     * Re-encode image bytes as JPEG with the configured quality level.
     * Returns null if the image cannot be decoded.
     */
    private byte[] compressToJpeg(byte[] imageBytes) {
        try {
            BufferedImage buffered = ImageIO.read(new java.io.ByteArrayInputStream(imageBytes));
            if (buffered == null) return null;

            // Ensure RGB (JPEG doesn't support alpha)
            if (buffered.getType() == BufferedImage.TYPE_4BYTE_ABGR ||
                    buffered.getType() == BufferedImage.TYPE_INT_ARGB) {
                BufferedImage rgb = new BufferedImage(
                        buffered.getWidth(), buffered.getHeight(), BufferedImage.TYPE_INT_RGB);
                rgb.createGraphics().drawImage(buffered, 0, 0, Color.WHITE, null);
                buffered = rgb;
            }

            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
            if (!writers.hasNext()) return null;
            ImageWriter writer = writers.next();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(imageQuality / 100f);

            writer.setOutput(ImageIO.createImageOutputStream(out));
            writer.write(null, new IIOImage(buffered, null, null), param);
            writer.dispose();
            return out.toByteArray();
        } catch (IOException e) {
            return null;
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String truncateToFit(PDFont font, float fontSize, String text, float maxWidth) throws IOException {
        float w = PdfTextLayout.measureText(font, fontSize, text);
        if (w <= maxWidth) return text;

        String ellipsis = "...";
        float ellipsisWidth = PdfTextLayout.measureText(font, fontSize, ellipsis);

        for (int i = text.length() - 1; i > 0; i--) {
            String truncated = text.substring(0, i);
            float truncW = PdfTextLayout.measureText(font, fontSize, truncated);
            if (truncW + ellipsisWidth <= maxWidth) {
                return truncated + ellipsis;
            }
        }
        return ellipsis;
    }

    static float getFloat(JsonObject obj, String key, float defaultValue) {
        if (obj.has(key) && !obj.get(key).isJsonNull()) {
            try {
                return obj.get(key).getAsFloat();
            } catch (Exception e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    static int getInt(JsonObject obj, String key, int defaultValue) {
        if (obj.has(key) && !obj.get(key).isJsonNull()) {
            try {
                return obj.get(key).getAsInt();
            } catch (Exception e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    static boolean getBool(JsonObject obj, String key, boolean defaultValue) {
        if (obj.has(key) && !obj.get(key).isJsonNull()) {
            try {
                return obj.get(key).getAsBoolean();
            } catch (Exception e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    static String getString(JsonObject obj, String key, String defaultValue) {
        if (obj.has(key) && !obj.get(key).isJsonNull()) {
            try {
                return obj.get(key).getAsString();
            } catch (Exception e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }
}
