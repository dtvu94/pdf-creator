package com.pdfcreator.pdfa.generator;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;

import java.awt.Color;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class PdfShapeRendererTest {

    // ─── parseColor tests ────────────────────────────────────────────────────

    @Test
    void parseColor_6digitHex() {
        Color c = PdfShapeRenderer.parseColor("#FF0000");
        assertEquals(255, c.getRed());
        assertEquals(0, c.getGreen());
        assertEquals(0, c.getBlue());
    }

    @Test
    void parseColor_6digitWithoutHash() {
        Color c = PdfShapeRenderer.parseColor("00FF00");
        assertEquals(0, c.getRed());
        assertEquals(255, c.getGreen());
        assertEquals(0, c.getBlue());
    }

    @Test
    void parseColor_3digitShortForm() {
        Color c = PdfShapeRenderer.parseColor("#F00");
        assertEquals(255, c.getRed());
        assertEquals(0, c.getGreen());
        assertEquals(0, c.getBlue());
    }

    @Test
    void parseColor_8digitWithAlpha() {
        Color c = PdfShapeRenderer.parseColor("#FF000080");
        assertEquals(255, c.getRed());
        assertEquals(0, c.getGreen());
        assertEquals(0, c.getBlue());
        assertEquals(128, c.getAlpha());
    }

    @ParameterizedTest
    @NullAndEmptySource
    void parseColor_nullOrEmpty_returnsBlack(String input) {
        Color c = PdfShapeRenderer.parseColor(input);
        assertEquals(Color.BLACK, c);
    }

    @Test
    void parseColor_invalidLength_returnsBlack() {
        Color c = PdfShapeRenderer.parseColor("#12345");
        assertEquals(Color.BLACK, c);
    }

    // ─── parseCssColor tests ─────────────────────────────────────────────────

    @Test
    void parseCssColor_hex() {
        Color c = PdfShapeRenderer.parseCssColor("#0000FF");
        assertEquals(0, c.getRed());
        assertEquals(0, c.getGreen());
        assertEquals(255, c.getBlue());
    }

    @Test
    void parseCssColor_rgb() {
        Color c = PdfShapeRenderer.parseCssColor("rgb(100, 200, 50)");
        assertEquals(100, c.getRed());
        assertEquals(200, c.getGreen());
        assertEquals(50, c.getBlue());
    }

    @Test
    void parseCssColor_rgba() {
        Color c = PdfShapeRenderer.parseCssColor("rgba(100, 200, 50, 0.5)");
        assertEquals(100, c.getRed());
        assertEquals(200, c.getGreen());
        assertEquals(50, c.getBlue());
        assertEquals(128, c.getAlpha());
    }

    @ParameterizedTest
    @CsvSource({
            "white, 255, 255, 255",
            "black, 0, 0, 0",
            "red, 255, 0, 0",
            "green, 0, 255, 0",
            "blue, 0, 0, 255",
            "gray, 128, 128, 128",
            "grey, 128, 128, 128"
    })
    void parseCssColor_namedColors(String name, int r, int g, int b) {
        Color c = PdfShapeRenderer.parseCssColor(name);
        assertEquals(r, c.getRed());
        assertEquals(g, c.getGreen());
        assertEquals(b, c.getBlue());
    }

    @Test
    void parseCssColor_transparent() {
        Color c = PdfShapeRenderer.parseCssColor("transparent");
        assertEquals(0, c.getAlpha());
    }

    @Test
    void parseCssColor_none() {
        Color c = PdfShapeRenderer.parseCssColor("none");
        assertEquals(0, c.getAlpha());
    }

    @ParameterizedTest
    @NullAndEmptySource
    void parseCssColor_nullOrEmpty_returnsBlack(String input) {
        Color c = PdfShapeRenderer.parseCssColor(input);
        assertEquals(Color.BLACK, c);
    }

    @Test
    void parseCssColor_unknownName_delegatesToParseColor() {
        Color c = PdfShapeRenderer.parseCssColor("FF8800");
        assertEquals(255, c.getRed());
        assertEquals(136, c.getGreen());
        assertEquals(0, c.getBlue());
    }

    // ─── renderShape tests (integration with content stream) ─────────────────

    @ParameterizedTest
    @ValueSource(strings = {"rectangle", "circle", "line", "triangle", "diamond", "arrow", "heart"})
    void renderShape_allShapeTypes_noException(String shapeType) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                assertDoesNotThrow(() ->
                        PdfShapeRenderer.renderShape(cs, shapeType, 10, 10, 100, 80,
                                Color.BLUE, Color.BLACK, 2, 0, 1f));
            }
        }
    }

    @Test
    void renderShape_rectangle_withBorderRadius() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                assertDoesNotThrow(() ->
                        PdfShapeRenderer.renderShape(cs, "rectangle", 10, 10, 100, 80,
                                Color.RED, Color.BLACK, 1, 10, 1f));
            }
        }
    }

    @Test
    void renderShape_withOpacity() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                assertDoesNotThrow(() ->
                        PdfShapeRenderer.renderShape(cs, "circle", 10, 10, 50, 50,
                                Color.GREEN, null, 0, 0, 0.5f));
            }
        }
    }

    @Test
    void renderShape_fillOnly_noStroke() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                assertDoesNotThrow(() ->
                        PdfShapeRenderer.renderShape(cs, "triangle", 10, 10, 100, 80,
                                Color.YELLOW, null, 0, 0, 1f));
            }
        }
    }

    @Test
    void renderShape_strokeOnly_noFill() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                assertDoesNotThrow(() ->
                        PdfShapeRenderer.renderShape(cs, "diamond", 10, 10, 80, 80,
                                new Color(0, 0, 0, 0), Color.RED, 2, 0, 1f));
            }
        }
    }

    @Test
    void renderShape_unknownType_defaultsToRectangle() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                assertDoesNotThrow(() ->
                        PdfShapeRenderer.renderShape(cs, "unknown", 10, 10, 50, 50,
                                Color.CYAN, Color.BLACK, 1, 0, 1f));
            }
        }
    }

    @Test
    void renderShape_borderRadiusClamped() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                // borderRadius larger than half of min(w,h) should still work
                assertDoesNotThrow(() ->
                        PdfShapeRenderer.renderShape(cs, "rectangle", 10, 10, 20, 40,
                                Color.BLUE, Color.RED, 1, 100, 1f));
            }
        }
    }

    @Test
    void parseCssColor_rgbWithLessThan3Parts_throwsOrFallsThrough() {
        // rgb() with insufficient parts falls through to parseColor default path
        // which may throw NumberFormatException for malformed input
        assertThrows(NumberFormatException.class, () ->
                PdfShapeRenderer.parseCssColor("rgb(100)"));
    }

    @Test
    void parseCssColor_rgbaWithLessThan4Parts_fallsThrough() {
        // rgba with only 3 parts: the rgba branch checks parts.length >= 4,
        // so it skips and falls through. "rgba(" doesn't start with "rgb(" exactly
        // but the code checks startsWith("rgba(") first, then startsWith("rgb(").
        // With 3 parts, the rgba branch is skipped, then rgb( is not matched,
        // so it falls to named colors → default parseColor.
        // "rgba(100, 200, 50)" with 3 parts in rgba → skip → rgb( not matched → parseColor
        // parseColor gets "rgba(100, 200, 50)" which is not valid hex → returns BLACK
        Color c = PdfShapeRenderer.parseCssColor("rgba(100, 200, 50)");
        assertEquals(Color.BLACK, c);
    }
}
