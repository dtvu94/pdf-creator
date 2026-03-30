package com.pdfcreator.pdfa.generator;

import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class PdfElementRendererTest {

    private PDDocument document;
    private PdfFontManager fontManager;
    private PdfElementRenderer renderer;

    @BeforeEach
    void setUp() throws IOException {
        document = new PDDocument();
        fontManager = new PdfFontManager(document, "/nonexistent", null);
        fontManager.registerFonts(null); // will use Helvetica fallback
        renderer = new PdfElementRenderer(document, fontManager, "Roboto");
    }

    @AfterEach
    void tearDown() throws IOException {
        document.close();
    }

    private PDPageContentStream createContentStream() throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);
        return new PDPageContentStream(document, page);
    }

    // ─── renderElement dispatch ──────────────────────────────────────────────

    @Test
    void renderElement_text() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "text");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "Hello World");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_heading() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "heading");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "Title");
            el.addProperty("bold", true);
            el.addProperty("fontSize", 24);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_textWithPagePlaceholders() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "text");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "Page {{page_number}} of {{total_pages}}");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 3, 10));
        }
    }

    @Test
    void renderElement_textWithBulletList() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "text");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "Item 1\nItem 2\nItem 3");
            el.addProperty("listStyle", "bullet");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_textWithNumberedList() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "text");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "First\nSecond");
            el.addProperty("listStyle", "numbered");
            el.addProperty("underline", true);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_textWithOpacity() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "text");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "Faded");
            el.addProperty("opacity", 0.5f);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_textWithUnderline() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "text");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "Underlined");
            el.addProperty("underline", true);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_textCenterAligned() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "text");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "Centered");
            el.addProperty("textAlign", "center");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_link() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "link");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("content", "Click here");
            el.addProperty("underline", true);
            el.addProperty("opacity", 0.8f);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_divider() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "divider");
            el.addProperty("x", 50);
            el.addProperty("y", 100);
            el.addProperty("width", 400);
            el.addProperty("thickness", 2);
            el.addProperty("color", "#CCCCCC");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_table() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "table");
            el.addProperty("x", 50);
            el.addProperty("y", 100);
            el.addProperty("width", 400);
            JsonArray headers = new JsonArray();
            headers.add("Name");
            headers.add("Value");
            el.add("headers", headers);
            JsonArray rows = new JsonArray();
            JsonArray row1 = new JsonArray();
            row1.add("Alice");
            row1.add("100");
            rows.add(row1);
            JsonArray row2 = new JsonArray();
            row2.add("Bob");
            row2.add("200");
            rows.add(row2);
            el.add("rows", rows);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_table_emptyHeaders_skips() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "table");
            el.addProperty("x", 50);
            el.addProperty("y", 100);
            el.addProperty("width", 400);
            el.add("headers", new JsonArray());
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_table_noRows() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "table");
            el.addProperty("x", 50);
            el.addProperty("y", 100);
            el.addProperty("width", 400);
            JsonArray headers = new JsonArray();
            headers.add("Col1");
            el.add("headers", headers);
            // no rows
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_image_noSrc_showsPlaceholder() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "image");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 100);
            el.addProperty("height", 100);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_image_invalidSrc_showsPlaceholder() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "image");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 100);
            el.addProperty("height", 100);
            el.addProperty("src", "data:image/png;base64,invalidbase64!!!");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_chart_noRenderedImage_showsPlaceholder() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "chart");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("height", 150);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_card() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "card");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 150);
            el.addProperty("height", 100);
            el.addProperty("title", "Revenue");
            el.addProperty("value", "1234");
            el.addProperty("unit", "USD");
            el.addProperty("subtitle", "This month");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_card_noUnit() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "card");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 150);
            el.addProperty("height", 100);
            el.addProperty("title", "Count");
            el.addProperty("value", "42");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_shape() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "shape");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 100);
            el.addProperty("height", 80);
            el.addProperty("shapeType", "circle");
            el.addProperty("fillColor", "#FF0000");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_repeater_noItems_showsPlaceholder() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "repeater");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("dataKey", "products");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_repeater_withItems() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "repeater");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("cardWidth", 150);
            el.addProperty("cardHeight", 100);
            el.addProperty("itemsPerRow", 2);
            el.addProperty("gap", 10);

            JsonArray items = new JsonArray();
            for (int i = 0; i < 3; i++) {
                JsonObject item = new JsonObject();
                JsonObject fields = new JsonObject();
                fields.addProperty("name", "Item " + i);
                item.add("fields", fields);
                items.add(item);
            }
            el.add("items", items);

            JsonArray cardElements = new JsonArray();
            JsonObject textEl = new JsonObject();
            textEl.addProperty("type", "text");
            textEl.addProperty("x", 5);
            textEl.addProperty("y", 5);
            textEl.addProperty("width", 140);
            textEl.addProperty("content", "{{name}}");
            cardElements.add(textEl);
            el.add("cardElements", cardElements);

            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_repeater_withChartImages() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "repeater");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("cardWidth", 200);
            el.addProperty("cardHeight", 150);
            el.addProperty("itemsPerRow", 1);

            JsonArray items = new JsonArray();
            JsonObject item = new JsonObject();
            item.add("fields", new JsonObject());
            JsonObject chartImages = new JsonObject();
            chartImages.addProperty("chart1", "data:image/png;base64,invalid");
            item.add("chartImages", chartImages);
            items.add(item);
            el.add("items", items);

            JsonArray cardElements = new JsonArray();
            JsonObject chartEl = new JsonObject();
            chartEl.addProperty("type", "chart");
            chartEl.addProperty("id", "chart1");
            chartEl.addProperty("x", 5);
            chartEl.addProperty("y", 5);
            chartEl.addProperty("width", 190);
            chartEl.addProperty("height", 140);
            cardElements.add(chartEl);
            el.add("cardElements", cardElements);

            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_repeater_withImageSrcField() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "repeater");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("cardWidth", 200);
            el.addProperty("cardHeight", 150);
            el.addProperty("itemsPerRow", 1);

            JsonArray items = new JsonArray();
            JsonObject item = new JsonObject();
            JsonObject fields = new JsonObject();
            fields.addProperty("imageUrl", "data:image/png;base64,invalid");
            fields.addProperty("caption", "Photo");
            item.add("fields", fields);
            items.add(item);
            el.add("items", items);

            JsonArray cardElements = new JsonArray();
            JsonObject imgEl = new JsonObject();
            imgEl.addProperty("type", "image");
            imgEl.addProperty("x", 5);
            imgEl.addProperty("y", 5);
            imgEl.addProperty("width", 100);
            imgEl.addProperty("height", 80);
            imgEl.addProperty("srcField", "imageUrl");
            imgEl.addProperty("label", "{{caption}}");
            cardElements.add(imgEl);
            el.add("cardElements", cardElements);

            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_repeater_withTableInCard() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "repeater");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("cardWidth", 300);
            el.addProperty("cardHeight", 200);
            el.addProperty("itemsPerRow", 1);

            JsonArray items = new JsonArray();
            JsonObject item = new JsonObject();
            JsonObject fields = new JsonObject();
            fields.addProperty("header1", "Name");
            fields.addProperty("tableData", "[[\"Alice\",\"30\"],[\"Bob\",\"25\"]]");
            item.add("fields", fields);
            items.add(item);
            el.add("items", items);

            JsonArray cardElements = new JsonArray();
            JsonObject tableEl = new JsonObject();
            tableEl.addProperty("type", "table");
            tableEl.addProperty("x", 5);
            tableEl.addProperty("y", 5);
            tableEl.addProperty("width", 290);
            JsonArray headers = new JsonArray();
            headers.add("{{header1}}");
            headers.add("Age");
            tableEl.add("headers", headers);
            tableEl.addProperty("rowsDataField", "tableData");
            cardElements.add(tableEl);
            el.add("cardElements", cardElements);

            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    // ─── calculateTableHeight ────────────────────────────────────────────────

    @Test
    void calculateTableHeight_headerOnly() {
        JsonObject el = new JsonObject();
        el.addProperty("fontSize", 10);
        // no rows
        float h = renderer.calculateTableHeight(el);
        assertEquals(10 + 4 * 2 + 4, h); // one header row
    }

    @Test
    void calculateTableHeight_withRows() {
        JsonObject el = new JsonObject();
        el.addProperty("fontSize", 10);
        JsonArray rows = new JsonArray();
        rows.add(new JsonArray());
        rows.add(new JsonArray());
        el.add("rows", rows);

        float rowHeight = 10 + 4 * 2 + 4;
        assertEquals(3 * rowHeight, renderer.calculateTableHeight(el));
    }

    // ─── calculateRepeaterHeight ─────────────────────────────────────────────

    @Test
    void calculateRepeaterHeight_noItems() {
        JsonObject el = new JsonObject();
        assertEquals(30, renderer.calculateRepeaterHeight(el));
    }

    @Test
    void calculateRepeaterHeight_withItems() {
        JsonObject el = new JsonObject();
        el.addProperty("cardHeight", 100);
        el.addProperty("itemsPerRow", 2);
        el.addProperty("gap", 10);
        JsonArray items = new JsonArray();
        for (int i = 0; i < 5; i++) items.add(new JsonObject());
        el.add("items", items);

        // 5 items, 2 per row = 3 rows
        // 3 * 100 + 2 * 10 = 320
        assertEquals(320, renderer.calculateRepeaterHeight(el));
    }

    // ─── Helper method tests ─────────────────────────────────────────────────

    @Test
    void getFloat_present_returnsValue() {
        JsonObject obj = new JsonObject();
        obj.addProperty("x", 42.5f);
        assertEquals(42.5f, PdfElementRenderer.getFloat(obj, "x", 0));
    }

    @Test
    void getFloat_absent_returnsDefault() {
        assertEquals(99f, PdfElementRenderer.getFloat(new JsonObject(), "x", 99));
    }

    @Test
    void getFloat_null_returnsDefault() {
        JsonObject obj = new JsonObject();
        obj.add("x", JsonNull.INSTANCE);
        assertEquals(10f, PdfElementRenderer.getFloat(obj, "x", 10));
    }

    @Test
    void getFloat_nonNumeric_returnsDefault() {
        JsonObject obj = new JsonObject();
        obj.addProperty("x", "notanumber");
        assertEquals(5f, PdfElementRenderer.getFloat(obj, "x", 5));
    }

    @Test
    void getInt_present_returnsValue() {
        JsonObject obj = new JsonObject();
        obj.addProperty("count", 7);
        assertEquals(7, PdfElementRenderer.getInt(obj, "count", 0));
    }

    @Test
    void getInt_absent_returnsDefault() {
        assertEquals(3, PdfElementRenderer.getInt(new JsonObject(), "count", 3));
    }

    @Test
    void getInt_null_returnsDefault() {
        JsonObject obj = new JsonObject();
        obj.add("count", JsonNull.INSTANCE);
        assertEquals(1, PdfElementRenderer.getInt(obj, "count", 1));
    }

    @Test
    void getBool_present_returnsValue() {
        JsonObject obj = new JsonObject();
        obj.addProperty("bold", true);
        assertTrue(PdfElementRenderer.getBool(obj, "bold", false));
    }

    @Test
    void getBool_absent_returnsDefault() {
        assertFalse(PdfElementRenderer.getBool(new JsonObject(), "bold", false));
    }

    @Test
    void getBool_null_returnsDefault() {
        JsonObject obj = new JsonObject();
        obj.add("bold", JsonNull.INSTANCE);
        assertTrue(PdfElementRenderer.getBool(obj, "bold", true));
    }

    @Test
    void getString_present_returnsValue() {
        JsonObject obj = new JsonObject();
        obj.addProperty("name", "test");
        assertEquals("test", PdfElementRenderer.getString(obj, "name", "default"));
    }

    @Test
    void getString_absent_returnsDefault() {
        assertEquals("default", PdfElementRenderer.getString(new JsonObject(), "name", "default"));
    }

    @Test
    void getString_null_returnsDefault() {
        JsonObject obj = new JsonObject();
        obj.add("name", JsonNull.INSTANCE);
        assertEquals("fallback", PdfElementRenderer.getString(obj, "name", "fallback"));
    }

    // ─── renderImageWatermark ────────────────────────────────────────────────

    @Test
    void renderImageWatermark_noSrc_doesNothing() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject wm = new JsonObject();
            assertDoesNotThrow(() -> renderer.renderImageWatermark(cs, wm, 842));
        }
    }

    @Test
    void renderImageWatermark_emptySrc_doesNothing() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject wm = new JsonObject();
            wm.addProperty("src", "");
            assertDoesNotThrow(() -> renderer.renderImageWatermark(cs, wm, 842));
        }
    }

    @Test
    void renderImageWatermark_invalidSrc_doesNotCrash() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject wm = new JsonObject();
            wm.addProperty("src", "data:image/png;base64,invalid!!!");
            wm.addProperty("x", 100);
            wm.addProperty("y", 100);
            wm.addProperty("width", 200);
            wm.addProperty("height", 200);
            wm.addProperty("opacity", 0.3f);
            assertDoesNotThrow(() -> renderer.renderImageWatermark(cs, wm, 842));
        }
    }

    // ─── Image rendering with valid base64 PNG ───────────────────────────��──

    private static String createValidPngDataUri() throws IOException {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        img.getGraphics().fillRect(0, 0, 10, 10);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    private static String createValidJpegDataUri() throws IOException {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        img.getGraphics().fillRect(0, 0, 10, 10);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "JPEG", baos);
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    private static String createValidBmpDataUri() throws IOException {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        img.getGraphics().fillRect(0, 0, 10, 10);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "BMP", baos);
        return "data:image/bmp;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    @Test
    void renderElement_image_validPng_rendersImage() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "image");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 100);
            el.addProperty("height", 100);
            el.addProperty("src", createValidPngDataUri());
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_image_validJpeg_rendersImage() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "image");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 100);
            el.addProperty("height", 100);
            el.addProperty("src", createValidJpegDataUri());
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_image_validBmp_rendersImage() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "image");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 100);
            el.addProperty("height", 100);
            el.addProperty("src", createValidBmpDataUri());
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_chart_validRenderedImage() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "chart");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 200);
            el.addProperty("height", 150);
            el.addProperty("renderedImage", createValidPngDataUri());
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderImageWatermark_validImage() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject wm = new JsonObject();
            wm.addProperty("src", createValidPngDataUri());
            wm.addProperty("x", 100);
            wm.addProperty("y", 100);
            wm.addProperty("width", 200);
            wm.addProperty("height", 200);
            wm.addProperty("opacity", 0.3f);
            assertDoesNotThrow(() -> renderer.renderImageWatermark(cs, wm, 842));
        }
    }

    @Test
    void renderElement_image_dataUriNoComma_showsPlaceholder() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "image");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("width", 100);
            el.addProperty("height", 100);
            el.addProperty("src", "data:image/pngNOCOMMA");
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_table_longTextTruncated() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "table");
            el.addProperty("x", 50);
            el.addProperty("y", 100);
            el.addProperty("width", 100); // narrow width to force truncation
            el.addProperty("fontSize", 10);
            JsonArray headers = new JsonArray();
            headers.add("A very long header that should be truncated");
            el.add("headers", headers);
            JsonArray rows = new JsonArray();
            JsonArray row = new JsonArray();
            row.add("A very long cell value that should also be truncated because it exceeds the column width");
            rows.add(row);
            el.add("rows", rows);
            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }

    @Test
    void renderElement_repeater_cardSubstitution_allTypes() throws IOException {
        try (PDPageContentStream cs = createContentStream()) {
            JsonObject el = new JsonObject();
            el.addProperty("type", "repeater");
            el.addProperty("x", 50);
            el.addProperty("y", 50);
            el.addProperty("cardWidth", 300);
            el.addProperty("cardHeight", 250);
            el.addProperty("itemsPerRow", 1);

            JsonArray items = new JsonArray();
            JsonObject item = new JsonObject();
            JsonObject fields = new JsonObject();
            fields.addProperty("title", "My Card");
            fields.addProperty("val", "42");
            fields.addProperty("sub", "note");
            item.add("fields", fields);
            items.add(item);
            el.add("items", items);

            JsonArray cardElements = new JsonArray();
            // card element
            JsonObject cardEl = new JsonObject();
            cardEl.addProperty("type", "card");
            cardEl.addProperty("x", 5);
            cardEl.addProperty("y", 5);
            cardEl.addProperty("width", 140);
            cardEl.addProperty("height", 80);
            cardEl.addProperty("title", "{{title}}");
            cardEl.addProperty("value", "{{val}}");
            cardEl.addProperty("subtitle", "{{sub}}");
            cardElements.add(cardEl);
            el.add("cardElements", cardElements);

            assertDoesNotThrow(() -> renderer.renderElement(cs, el, 842, 0, 0, 1, 1));
        }
    }
}
