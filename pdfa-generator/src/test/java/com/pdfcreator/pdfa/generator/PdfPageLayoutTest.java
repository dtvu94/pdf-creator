package com.pdfcreator.pdfa.generator;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class PdfPageLayoutTest {

    private PDDocument document;
    private PdfElementRenderer renderer;
    private PdfFontManager fontManager;

    @BeforeEach
    void setUp() throws IOException {
        document = new PDDocument();
        fontManager = new PdfFontManager(document, "/nonexistent", null);
        fontManager.registerFonts(null);
        renderer = new PdfElementRenderer(document, fontManager, "Roboto");
    }

    @AfterEach
    void tearDown() throws IOException {
        document.close();
    }

    // ─── getPageDimensions ───────────────────────────────────────────────────

    @Test
    void getPageDimensions_a4() {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");
        PDRectangle dims = layout.getPageDimensions();
        assertEquals(PDRectangle.A4.getWidth(), dims.getWidth());
        assertEquals(PDRectangle.A4.getHeight(), dims.getHeight());
    }

    @Test
    void getPageDimensions_a3() {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A3");
        PDRectangle dims = layout.getPageDimensions();
        assertEquals(PDRectangle.A3.getWidth(), dims.getWidth());
    }

    @Test
    void getPageDimensions_a5() {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A5");
        PDRectangle dims = layout.getPageDimensions();
        assertEquals(PDRectangle.A5.getWidth(), dims.getWidth());
    }

    @Test
    void getPageDimensions_unknown_defaultsToA4() {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "Letter");
        PDRectangle dims = layout.getPageDimensions();
        assertEquals(PDRectangle.A4.getWidth(), dims.getWidth());
    }

    // ─── renderPage - simple absolute layout ────────────────────────────────

    @Test
    void renderPage_simpleAbsoluteLayout_addsOnePage() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        JsonArray elements = new JsonArray();
        JsonObject textEl = new JsonObject();
        textEl.addProperty("type", "text");
        textEl.addProperty("x", 50);
        textEl.addProperty("y", 50);
        textEl.addProperty("width", 200);
        textEl.addProperty("content", "Hello");
        elements.add(textEl);
        page.add("elements", elements);

        layout.renderPage(page, 1, 1, null);
        assertEquals(1, document.getNumberOfPages());
    }

    @Test
    void renderPage_emptyElements() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        page.add("elements", new JsonArray());

        layout.renderPage(page, 1, 1, null);
        assertEquals(1, document.getNumberOfPages());
    }

    @Test
    void renderPage_nullElements() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        // no "elements" key

        layout.renderPage(page, 1, 1, null);
        assertEquals(1, document.getNumberOfPages());
    }

    // ─── renderPage - flow layout with header/footer ────────────────────────

    @Test
    void renderPage_withHeaderFooter_usesFlowLayout() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();

        JsonObject header = new JsonObject();
        header.addProperty("height", 50);
        JsonArray headerElements = new JsonArray();
        JsonObject headerText = new JsonObject();
        headerText.addProperty("type", "text");
        headerText.addProperty("x", 10);
        headerText.addProperty("y", 10);
        headerText.addProperty("width", 200);
        headerText.addProperty("content", "Header");
        headerElements.add(headerText);
        header.add("elements", headerElements);
        page.add("header", header);

        JsonObject footer = new JsonObject();
        footer.addProperty("height", 30);
        JsonArray footerElements = new JsonArray();
        JsonObject footerText = new JsonObject();
        footerText.addProperty("type", "text");
        footerText.addProperty("x", 10);
        footerText.addProperty("y", 5);
        footerText.addProperty("width", 200);
        footerText.addProperty("content", "Footer");
        footerElements.add(footerText);
        footer.add("elements", footerElements);
        page.add("footer", footer);

        page.add("elements", new JsonArray());

        layout.renderPage(page, 1, 1, null);
        assertTrue(document.getNumberOfPages() >= 1);
    }

    @Test
    void renderPage_withAutoTable_usesFlowLayout() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        JsonArray elements = new JsonArray();

        JsonObject table = new JsonObject();
        table.addProperty("type", "table");
        table.addProperty("mode", "auto");
        table.addProperty("x", 50);
        table.addProperty("y", 50);
        table.addProperty("width", 400);
        table.addProperty("fontSize", 10);
        JsonArray headers = new JsonArray();
        headers.add("Col1");
        headers.add("Col2");
        table.add("headers", headers);
        JsonArray rows = new JsonArray();
        for (int i = 0; i < 5; i++) {
            JsonArray row = new JsonArray();
            row.add("A" + i);
            row.add("B" + i);
            rows.add(row);
        }
        table.add("rows", rows);
        elements.add(table);

        // Add header to trigger flow layout
        JsonObject header = new JsonObject();
        header.addProperty("height", 30);
        header.add("elements", new JsonArray());
        page.add("header", header);

        page.add("elements", elements);

        layout.renderPage(page, 1, 1, null);
        assertTrue(document.getNumberOfPages() >= 1);
    }

    @Test
    void renderPage_withRepeater_usesFlowLayout() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        JsonArray elements = new JsonArray();

        JsonObject repeater = new JsonObject();
        repeater.addProperty("type", "repeater");
        repeater.addProperty("x", 50);
        repeater.addProperty("y", 50);
        repeater.addProperty("cardWidth", 150);
        repeater.addProperty("cardHeight", 100);
        repeater.addProperty("itemsPerRow", 2);
        repeater.addProperty("gap", 10);
        repeater.addProperty("dataKey", "items");
        repeater.add("items", new JsonArray());
        repeater.add("cardElements", new JsonArray());
        elements.add(repeater);

        JsonObject header = new JsonObject();
        header.addProperty("height", 30);
        header.add("elements", new JsonArray());
        page.add("header", header);

        page.add("elements", elements);

        layout.renderPage(page, 1, 1, null);
        assertTrue(document.getNumberOfPages() >= 1);
    }

    // ─── Watermark rendering ─────────────────────────────────────────────────

    @Test
    void renderPage_withDisabledWatermark_noError() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        page.add("elements", new JsonArray());

        JsonObject watermark = new JsonObject();
        watermark.addProperty("enabled", false);

        layout.renderPage(page, 1, 1, watermark);
        assertEquals(1, document.getNumberOfPages());
    }

    @Test
    void renderPage_withEnabledWatermark_allPages() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        page.add("elements", new JsonArray());

        JsonObject watermark = new JsonObject();
        watermark.addProperty("enabled", true);
        watermark.addProperty("pages", "all");
        watermark.addProperty("src", "data:image/png;base64,invalid");
        watermark.addProperty("x", 100);
        watermark.addProperty("y", 100);
        watermark.addProperty("width", 200);
        watermark.addProperty("height", 200);

        layout.renderPage(page, 1, 1, watermark);
        assertEquals(1, document.getNumberOfPages());
    }

    @Test
    void renderPage_withWatermark_specificPages_notMatching() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        page.add("elements", new JsonArray());

        JsonObject watermark = new JsonObject();
        watermark.addProperty("enabled", true);
        JsonArray wmPages = new JsonArray();
        wmPages.add(5); // page 5, but we're rendering page 1
        watermark.add("pages", wmPages);

        layout.renderPage(page, 1, 1, watermark);
        assertEquals(1, document.getNumberOfPages());
    }

    @Test
    void renderPage_withWatermark_specificPages_matching() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        page.add("elements", new JsonArray());

        JsonObject watermark = new JsonObject();
        watermark.addProperty("enabled", true);
        JsonArray wmPages = new JsonArray();
        wmPages.add(1);
        watermark.add("pages", wmPages);
        watermark.addProperty("src", "data:image/png;base64,invalid");

        layout.renderPage(page, 1, 1, watermark);
        assertEquals(1, document.getNumberOfPages());
    }

    @Test
    void renderPage_nullWatermark_noError() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        page.add("elements", new JsonArray());

        layout.renderPage(page, 1, 1, null);
        assertEquals(1, document.getNumberOfPages());
    }

    @Test
    void renderPage_flowLayout_absoluteAndFlowMixed() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        JsonArray elements = new JsonArray();

        // Absolute element (text)
        JsonObject textEl = new JsonObject();
        textEl.addProperty("type", "text");
        textEl.addProperty("x", 50);
        textEl.addProperty("y", 50);
        textEl.addProperty("width", 200);
        textEl.addProperty("content", "Absolute");
        elements.add(textEl);

        // Flow element (auto table)
        JsonObject table = new JsonObject();
        table.addProperty("type", "table");
        table.addProperty("mode", "auto");
        table.addProperty("x", 50);
        table.addProperty("y", 200);
        table.addProperty("width", 400);
        JsonArray headers = new JsonArray();
        headers.add("H1");
        table.add("headers", headers);
        table.add("rows", new JsonArray());
        elements.add(table);

        // Need header to trigger flow
        JsonObject header = new JsonObject();
        header.addProperty("height", 40);
        header.add("elements", new JsonArray());
        page.add("header", header);

        page.add("elements", elements);

        layout.renderPage(page, 1, 1, null);
        assertTrue(document.getNumberOfPages() >= 1);
    }

    @Test
    void renderPage_flowLayout_headerNullElements() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        JsonObject header = new JsonObject();
        header.addProperty("height", 40);
        // no elements key
        page.add("header", header);
        page.add("elements", new JsonArray());

        layout.renderPage(page, 1, 1, null);
        assertTrue(document.getNumberOfPages() >= 1);
    }

    @Test
    void renderPage_flowLayout_footerNullElements() throws IOException {
        PdfPageLayout layout = new PdfPageLayout(document, renderer, "A4");

        JsonObject page = new JsonObject();
        JsonObject footer = new JsonObject();
        footer.addProperty("height", 30);
        // no elements key
        page.add("footer", footer);
        page.add("elements", new JsonArray());

        layout.renderPage(page, 1, 1, null);
        assertTrue(document.getNumberOfPages() >= 1);
    }
}
