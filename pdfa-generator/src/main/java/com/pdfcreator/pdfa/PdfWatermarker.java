package com.pdfcreator.pdfa;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.util.Matrix;

import java.io.ByteArrayOutputStream;
import java.util.List;
public class PdfWatermarker {

    /**
     * Add a text watermark to a PDF.
     *
     * @param pdfBytes  the source PDF bytes
     * @param text      watermark text (e.g. "DRAFT", "CONFIDENTIAL")
     * @param fontSize  font size (default 60)
     * @param rotation  rotation in degrees (default 45)
     * @param opacity   opacity 0.0-1.0 (default 0.3)
     * @param colorHex  hex color string like "#FF0000" (default "#888888")
     * @param pages     specific pages to watermark (1-based). Null or empty = all pages.
     * @return watermarked PDF bytes
     */
    public byte[] addTextWatermark(byte[] pdfBytes, String text, float fontSize,
                                   float rotation, float opacity, String colorHex,
                                   List<Integer> pages) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            int totalPages = doc.getNumberOfPages();
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            float[] rgb = parseHexColor(colorHex);

            for (int i = 0; i < totalPages; i++) {
                int pageNum = i + 1;
                if (pages != null && !pages.isEmpty() && !pages.contains(pageNum)) {
                    continue;
                }

                PDPage page = doc.getPage(i);
                PDRectangle mediaBox = page.getMediaBox();
                float pageWidth = mediaBox.getWidth();
                float pageHeight = mediaBox.getHeight();

                try (PDPageContentStream cs = new PDPageContentStream(
                        doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

                    // Set transparency
                    PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
                    gs.setNonStrokingAlphaConstant(opacity);
                    gs.setStrokingAlphaConstant(opacity);
                    cs.setGraphicsStateParameters(gs);

                    cs.setNonStrokingColor(rgb[0], rgb[1], rgb[2]);

                    // Calculate text width for centering
                    float textWidth = font.getStringWidth(text) / 1000 * fontSize;
                    float textHeight = fontSize;

                    // Position at center of page, then rotate
                    float cx = pageWidth / 2;
                    float cy = pageHeight / 2;

                    cs.beginText();
                    Matrix matrix = Matrix.getRotateInstance(
                            Math.toRadians(rotation), cx, cy);
                    matrix.concatenate(Matrix.getTranslateInstance(-textWidth / 2, -textHeight / 2));
                    cs.setTextMatrix(matrix);
                    cs.setFont(font, fontSize);
                    cs.showText(text);
                    cs.endText();
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    /**
     * Add an image watermark to a PDF.
     *
     * @param pdfBytes  the source PDF bytes
     * @param imageBytes watermark image bytes (PNG, JPEG, etc.)
     * @param x         x position in PDF points from left (default: center)
     * @param y         y position in PDF points from top (default: center)
     * @param width     image width in PDF points (0 = use original)
     * @param height    image height in PDF points (0 = use original)
     * @param opacity   opacity 0.0-1.0 (default 0.3)
     * @param pages     specific pages to watermark (1-based). Null or empty = all pages.
     * @return watermarked PDF bytes
     */
    public byte[] addImageWatermark(byte[] pdfBytes, byte[] imageBytes,
                                    float x, float y, float width, float height,
                                    float opacity, List<Integer> pages) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDImageXObject image = PDImageXObject.createFromByteArray(doc, imageBytes, "watermark");

            int totalPages = doc.getNumberOfPages();

            for (int i = 0; i < totalPages; i++) {
                int pageNum = i + 1;
                if (pages != null && !pages.isEmpty() && !pages.contains(pageNum)) {
                    continue;
                }

                PDPage page = doc.getPage(i);
                PDRectangle mediaBox = page.getMediaBox();
                float pageWidth = mediaBox.getWidth();
                float pageHeight = mediaBox.getHeight();

                // Resolve dimensions — use original image size if not specified
                float drawW = width > 0 ? width : image.getWidth();
                float drawH = height > 0 ? height : image.getHeight();

                // Resolve position — center if negative
                float drawX = x >= 0 ? x : (pageWidth - drawW) / 2;
                // Convert from top-origin (template convention) to bottom-origin (PDF convention)
                float drawY = y >= 0 ? (pageHeight - y - drawH) : (pageHeight - drawH) / 2;

                try (PDPageContentStream cs = new PDPageContentStream(
                        doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

                    PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
                    gs.setNonStrokingAlphaConstant(opacity);
                    gs.setStrokingAlphaConstant(opacity);
                    cs.setGraphicsStateParameters(gs);

                    cs.drawImage(image, drawX, drawY, drawW, drawH);
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private float[] parseHexColor(String hex) {
        if (hex == null || hex.isEmpty()) hex = "#888888";
        hex = hex.replace("#", "");
        if (hex.length() != 6) hex = "888888";

        float r = Integer.parseInt(hex.substring(0, 2), 16) / 255f;
        float g = Integer.parseInt(hex.substring(2, 4), 16) / 255f;
        float b = Integer.parseInt(hex.substring(4, 6), 16) / 255f;
        return new float[]{r, g, b};
    }
}
