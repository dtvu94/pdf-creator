package com.pdfcreator.pdfa;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PdfTextExtractorTest {

    private PdfTextExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new PdfTextExtractor();
    }

    @Test
    void extractText_combined_returnsTextProperty() throws Exception {
        byte[] pdf = TestHelper.createPdfWithText("Hello World");
        JsonObject result = extractor.extractText(pdf, 0, 0, false);

        assertTrue(result.get("success").getAsBoolean());
        assertEquals(1, result.get("totalPages").getAsInt());
        assertTrue(result.has("text"));
        assertTrue(result.get("text").getAsString().contains("Hello World"));
    }

    @Test
    void extractText_perPage_returnsPagesArray() throws Exception {
        byte[] pdf = TestHelper.createPdfWithText("Hello World");
        JsonObject result = extractor.extractText(pdf, 0, 0, true);

        assertTrue(result.get("success").getAsBoolean());
        assertTrue(result.has("pages"));
        JsonArray pages = result.getAsJsonArray("pages");
        assertEquals(1, pages.size());

        JsonObject page = pages.get(0).getAsJsonObject();
        assertEquals(1, page.get("page").getAsInt());
        assertTrue(page.get("text").getAsString().contains("Hello World"));
    }

    @Test
    void extractText_startPageZero_defaultsToFirst() throws Exception {
        byte[] pdf = TestHelper.createPdfWithText("Test");
        JsonObject result = extractor.extractText(pdf, 0, 0, false);

        assertTrue(result.get("success").getAsBoolean());
    }

    @Test
    void extractText_negativeStartPage_defaultsToFirst() throws Exception {
        byte[] pdf = TestHelper.createPdfWithText("Test");
        JsonObject result = extractor.extractText(pdf, -5, -1, false);

        assertTrue(result.get("success").getAsBoolean());
    }

    @Test
    void extractText_endPageBeyondTotal_clampedToLast() throws Exception {
        byte[] pdf = TestHelper.createPdfWithText("Test");
        JsonObject result = extractor.extractText(pdf, 1, 999, false);

        assertTrue(result.get("success").getAsBoolean());
    }

    @Test
    void extractText_specificPageRange() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(3);
        JsonObject result = extractor.extractText(pdf, 1, 2, true);

        JsonArray pages = result.getAsJsonArray("pages");
        assertEquals(2, pages.size());
        assertEquals(1, pages.get(0).getAsJsonObject().get("page").getAsInt());
        assertEquals(2, pages.get(1).getAsJsonObject().get("page").getAsInt());
    }

    @Test
    void extractText_emptyPdf_returnsEmptyText() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        JsonObject result = extractor.extractText(pdf, 0, 0, false);

        assertTrue(result.get("success").getAsBoolean());
        assertEquals("", result.get("text").getAsString());
    }

    @Test
    void extractText_invalidBytes_throwsException() {
        assertThrows(Exception.class, () ->
                extractor.extractText(new byte[]{1, 2, 3}, 0, 0, false));
    }
}
