package com.pdfcreator.pdfa.generator;

import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PdfTextLayoutTest {

    private static PDType1Font font;

    @BeforeAll
    static void setUp() {
        font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    }

    // ─── measureText ─────────────────────────────────────────────────────────

    @Test
    void measureText_normalString_returnsPositiveWidth() throws IOException {
        float w = PdfTextLayout.measureText(font, 12, "Hello World");
        assertTrue(w > 0);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void measureText_nullOrEmpty_returnsZero(String text) throws IOException {
        float w = PdfTextLayout.measureText(font, 12, text);
        assertEquals(0, w);
    }

    @Test
    void measureText_largerFontSize_returnsWiderText() throws IOException {
        float w12 = PdfTextLayout.measureText(font, 12, "Test");
        float w24 = PdfTextLayout.measureText(font, 24, "Test");
        assertTrue(w24 > w12);
    }

    // ─── sanitizeText ────────────────────────────────────────────────────────

    @Test
    void sanitizeText_nullInput_returnsEmpty() {
        assertEquals("", PdfTextLayout.sanitizeText(font, null));
    }

    @Test
    void sanitizeText_normalText_unchanged() {
        assertEquals("Hello", PdfTextLayout.sanitizeText(font, "Hello"));
    }

    @Test
    void sanitizeText_preservesControlChars() {
        String input = "line1\nline2\ttab\rreturn";
        String result = PdfTextLayout.sanitizeText(font, input);
        assertTrue(result.contains("\n"));
        assertTrue(result.contains("\t"));
        assertTrue(result.contains("\r"));
    }

    // ─── wrapText ────────────────────────────────────────────────────────────

    @Test
    void wrapText_shortText_singleLine() throws IOException {
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, 12, "Hi", 500);
        assertEquals(1, lines.size());
        assertEquals("Hi", lines.get(0).text);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void wrapText_nullOrEmpty_singleEmptyLine(String text) throws IOException {
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, 12, text, 500);
        assertEquals(1, lines.size());
        assertEquals("", lines.get(0).text);
    }

    @Test
    void wrapText_longText_wrapsToMultipleLines() throws IOException {
        String longText = "This is a very long sentence that should wrap to multiple lines when given a narrow width";
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, 12, longText, 100);
        assertTrue(lines.size() > 1);
    }

    @Test
    void wrapText_explicitNewlines_respected() throws IOException {
        String text = "Line1\nLine2\nLine3";
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, 12, text, 500);
        assertEquals(3, lines.size());
        assertEquals("Line1", lines.get(0).text);
        assertEquals("Line2", lines.get(1).text);
        assertEquals("Line3", lines.get(2).text);
    }

    @Test
    void wrapText_emptyParagraph_producesEmptyLine() throws IOException {
        String text = "Line1\n\nLine3";
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, 12, text, 500);
        assertEquals(3, lines.size());
        assertEquals("", lines.get(1).text);
    }

    @Test
    void wrapText_singleLongWord_placedOnOwnLine() throws IOException {
        String text = "Short Superlongwordthatcannotfit";
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, 12, text, 80);
        assertTrue(lines.size() >= 2);
    }

    // ─── calculateTextHeight ─────────────────────────────────────────────────

    @Test
    void calculateTextHeight_positiveLines() {
        float h = PdfTextLayout.calculateTextHeight(3, 12, 1.5f);
        assertEquals(3 * 12 * 1.5f, h, 0.01f);
    }

    @Test
    void calculateTextHeight_zeroLines_returnsZero() {
        assertEquals(0, PdfTextLayout.calculateTextHeight(0, 12, 1.5f));
    }

    @Test
    void calculateTextHeight_negativeLines_returnsZero() {
        assertEquals(0, PdfTextLayout.calculateTextHeight(-1, 12, 1.5f));
    }

    // ─── getAlignmentOffset ──────────────────────────────────────────────────

    @ParameterizedTest
    @CsvSource({
            "left, 50, 200, 0",
            "center, 50, 200, 75",
            "right, 50, 200, 150"
    })
    void getAlignmentOffset_allAlignments(String align, float lineWidth, float maxWidth, float expected) {
        float offset = PdfTextLayout.getAlignmentOffset(align, lineWidth, maxWidth);
        assertEquals(expected, offset, 0.01f);
    }

    @Test
    void getAlignmentOffset_null_defaultsToLeft() {
        assertEquals(0, PdfTextLayout.getAlignmentOffset(null, 50, 200));
    }

    @Test
    void getAlignmentOffset_justify_defaultsToLeft() {
        assertEquals(0, PdfTextLayout.getAlignmentOffset("justify", 50, 200));
    }

    // ─── getListPrefix ───────────────────────────────────────────────────────

    @Test
    void getListPrefix_bullet() {
        assertEquals("\u2022 ", PdfTextLayout.getListPrefix("bullet", 0));
        assertEquals("\u2022 ", PdfTextLayout.getListPrefix("bullet", 5));
    }

    @Test
    void getListPrefix_numbered() {
        assertEquals("1. ", PdfTextLayout.getListPrefix("numbered", 0));
        assertEquals("3. ", PdfTextLayout.getListPrefix("numbered", 2));
    }

    @Test
    void getListPrefix_none() {
        assertEquals("", PdfTextLayout.getListPrefix("none", 0));
        assertEquals("", PdfTextLayout.getListPrefix(null, 0));
    }

    @Test
    void sanitizeText_unsupportedCharacter_replacedWithQuestionMark() {
        // Helvetica (Type1) cannot encode many unicode characters
        // CJK character should be replaced with '?'
        String result = PdfTextLayout.sanitizeText(font, "Hello\u4e16");
        assertTrue(result.contains("?") || result.equals("Hello?"));
    }

    @Test
    void measureText_withUnsupportedChars_fallbackMeasurement() throws IOException {
        // Helvetica can't encode CJK, so measureText should use char-by-char fallback
        float w = PdfTextLayout.measureText(font, 12, "A\u4e16B");
        assertTrue(w >= 0); // should not throw, gracefully handles
    }

    @Test
    void wrapText_singleWord_widerThanMaxWidth() throws IOException {
        // Very long single word with very narrow width
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, 12, "Superlongword", 10);
        assertEquals(1, lines.size());
        assertEquals("Superlongword", lines.get(0).text);
    }

    @Test
    void wrapText_multipleSpaces_treatedAsOneDelimiter() throws IOException {
        List<PdfTextLayout.WrappedLine> lines = PdfTextLayout.wrapText(font, 12, "A   B   C", 500);
        assertEquals(1, lines.size());
        assertEquals("A B C", lines.get(0).text);
    }

    @Test
    void calculateTextHeight_singleLine() {
        float h = PdfTextLayout.calculateTextHeight(1, 14, 1.2f);
        assertEquals(14 * 1.2f, h, 0.01f);
    }
}
