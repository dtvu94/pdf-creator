package com.pdfcreator.pdfa.generator;

import org.apache.pdfbox.pdmodel.font.PDFont;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Text measurement and word-wrapping engine for PDFBox.
 * PDFBox has no built-in text layout — this class handles:
 * - Measuring text width for a given font/size
 * - Word wrapping within a max width
 * - Line height calculation
 * - List rendering (bullet/numbered) prefix generation
 */
public class PdfTextLayout {

    /**
     * A single wrapped line of text with its measured width.
     */
    public static class WrappedLine {
        public final String text;
        public final float width;

        public WrappedLine(String text, float width) {
            this.text = text;
            this.width = width;
        }
    }

    /**
     * Measure the width of a string in points for a given font and size.
     */
    public static float measureText(PDFont font, float fontSize, String text) throws IOException {
        if (text == null || text.isEmpty()) return 0;
        try {
            return font.getStringWidth(text) / 1000f * fontSize;
        } catch (IllegalArgumentException e) {
            // Character not supported by font — measure char by char, skip unsupported
            float width = 0;
            for (int i = 0; i < text.length(); i++) {
                try {
                    width += font.getStringWidth(String.valueOf(text.charAt(i))) / 1000f * fontSize;
                } catch (IllegalArgumentException | IOException ignored) {
                    // Skip unsupported characters
                }
            }
            return width;
        }
    }

    /**
     * Encode text for PDFBox, replacing unsupported characters with '?'.
     */
    public static String sanitizeText(PDFont font, String text) {
        if (text == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            // Preserve control characters that have structural meaning
            if (c == '\n' || c == '\r' || c == '\t') {
                sb.append(c);
                continue;
            }
            try {
                font.encode(String.valueOf(c));
                sb.append(c);
            } catch (Exception e) {
                sb.append('?');
            }
        }
        return sb.toString();
    }

    /**
     * Word-wrap text to fit within maxWidth.
     * Splits on whitespace. If a single word is too long, it is placed on its own line.
     */
    public static List<WrappedLine> wrapText(PDFont font, float fontSize, String text, float maxWidth) throws IOException {
        List<WrappedLine> lines = new ArrayList<>();

        if (text == null || text.isEmpty()) {
            lines.add(new WrappedLine("", 0));
            return lines;
        }

        // Handle explicit newlines
        String[] paragraphs = text.split("\n", -1);

        for (String paragraph : paragraphs) {
            if (paragraph.isEmpty()) {
                lines.add(new WrappedLine("", 0));
                continue;
            }

            String[] words = paragraph.split("\\s+");
            StringBuilder currentLine = new StringBuilder();
            float currentWidth = 0;
            float spaceWidth = measureText(font, fontSize, " ");

            for (String word : words) {
                if (word.isEmpty()) continue;

                float wordWidth = measureText(font, fontSize, word);

                if (currentLine.length() == 0) {
                    // First word on line
                    currentLine.append(word);
                    currentWidth = wordWidth;
                } else if (currentWidth + spaceWidth + wordWidth <= maxWidth) {
                    // Fits on current line
                    currentLine.append(" ").append(word);
                    currentWidth += spaceWidth + wordWidth;
                } else {
                    // Start new line
                    lines.add(new WrappedLine(currentLine.toString(), currentWidth));
                    currentLine = new StringBuilder(word);
                    currentWidth = wordWidth;
                }
            }

            // Add remaining text
            lines.add(new WrappedLine(currentLine.toString(), currentWidth));
        }

        return lines;
    }

    /**
     * Calculate the total height of wrapped text.
     *
     * @param lineCount  number of lines
     * @param fontSize   font size in points
     * @param lineHeight line height multiplier (e.g. 1.5)
     */
    public static float calculateTextHeight(int lineCount, float fontSize, float lineHeight) {
        if (lineCount <= 0) return 0;
        return lineCount * fontSize * lineHeight;
    }

    /**
     * Calculate X offset for text alignment.
     *
     * @param textAlign  "left", "center", "right", or "justify"
     * @param lineWidth  actual width of the text line
     * @param maxWidth   available width
     */
    public static float getAlignmentOffset(String textAlign, float lineWidth, float maxWidth) {
        if (textAlign == null) textAlign = "left";
        return switch (textAlign) {
            case "center" -> (maxWidth - lineWidth) / 2;
            case "right" -> maxWidth - lineWidth;
            default -> 0;
        };
    }

    /**
     * Get the bullet/number prefix for a list item.
     */
    public static String getListPrefix(String listStyle, int index) {
        if ("bullet".equals(listStyle)) return "\u2022 ";
        if ("numbered".equals(listStyle)) return (index + 1) + ". ";
        return "";
    }
}
