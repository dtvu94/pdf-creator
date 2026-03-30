package com.pdfcreator.pdfa.generator;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PdfGeneratorTest {

    private PdfGenerator generator;
    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        generator = new PdfGenerator(tempDir.toString(), tempDir.toString());
    }

    private JsonObject createMinimalTemplate() {
        JsonObject template = new JsonObject();
        template.addProperty("pageSize", "A4");
        template.addProperty("name", "Test");
        JsonArray pages = new JsonArray();
        JsonObject page = new JsonObject();
        page.add("elements", new JsonArray());
        pages.add(page);
        template.add("pages", pages);
        return template;
    }

    private JsonObject createTemplateWithText(String content) {
        JsonObject template = createMinimalTemplate();
        JsonArray elements = template.getAsJsonArray("pages").get(0).getAsJsonObject().getAsJsonArray("elements");
        JsonObject textEl = new JsonObject();
        textEl.addProperty("type", "text");
        textEl.addProperty("x", 50);
        textEl.addProperty("y", 50);
        textEl.addProperty("width", 200);
        textEl.addProperty("content", content);
        elements.add(textEl);
        return template;
    }

    // ─── generate (JsonObject overload) ─────────────────────────────────────

    @Test
    void generate_minimalTemplate_producesValidPdf() throws Exception {
        JsonObject template = createMinimalTemplate();
        byte[] pdf = generator.generate(template, null, null, null, null);

        assertNotNull(pdf);
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            assertEquals(1, doc.getNumberOfPages());
        }
    }

    @Test
    void generate_withMetadata_setsDocumentInfo() throws Exception {
        JsonObject template = createMinimalTemplate();
        JsonObject metadata = new JsonObject();
        metadata.addProperty("title", "Test PDF");
        metadata.addProperty("author", "Unit Test");
        metadata.addProperty("subject", "Testing");
        metadata.addProperty("keywords", "test");
        metadata.addProperty("creator", "JUnit");
        metadata.addProperty("producer", "TestProducer");

        byte[] pdf = generator.generate(template, null, null, metadata, null);
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            assertEquals("Test PDF", doc.getDocumentInformation().getTitle());
            assertEquals("Unit Test", doc.getDocumentInformation().getAuthor());
            assertEquals("TestProducer", doc.getDocumentInformation().getProducer());
        }
    }

    @Test
    void generate_noMetadata_usesTemplateName() throws Exception {
        JsonObject template = createMinimalTemplate();
        template.addProperty("name", "MyDocument");

        byte[] pdf = generator.generate(template, null, null, null, null);
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            assertEquals("MyDocument", doc.getDocumentInformation().getTitle());
        }
    }

    @Test
    void generate_noPages_throwsException() {
        JsonObject template = new JsonObject();
        template.add("pages", new JsonArray());
        assertThrows(IllegalArgumentException.class, () ->
                generator.generate(template, null, null, null, null));
    }

    @Test
    void generate_nullPages_throwsException() {
        JsonObject template = new JsonObject();
        assertThrows(Exception.class, () ->
                generator.generate(template, null, null, null, null));
    }

    // ─── Placeholder resolution ─────────────────────────────────────────────

    @Test
    void generate_withPlaceholders_replacesText() throws Exception {
        JsonObject template = createTemplateWithText("Hello {{name}}!");
        JsonObject placeholders = new JsonObject();
        placeholders.addProperty("name", "World");

        byte[] pdf = generator.generate(template, placeholders, null, null, null);
        assertNotNull(pdf);
        // The placeholder should be replaced in the template before rendering
        String content = template.getAsJsonArray("pages").get(0).getAsJsonObject()
                .getAsJsonArray("elements").get(0).getAsJsonObject().get("content").getAsString();
        assertEquals("Hello World!", content);
    }

    @Test
    void generate_reservedPlaceholders_preserved() throws Exception {
        JsonObject template = createTemplateWithText("Page {{page_number}} of {{total_pages}}");
        JsonObject placeholders = new JsonObject();
        placeholders.addProperty("page_number", "SHOULD_NOT_REPLACE");

        byte[] pdf = generator.generate(template, placeholders, null, null, null);
        assertNotNull(pdf);
        String content = template.getAsJsonArray("pages").get(0).getAsJsonObject()
                .getAsJsonArray("elements").get(0).getAsJsonObject().get("content").getAsString();
        assertTrue(content.contains("{{page_number}}"));
        assertTrue(content.contains("{{total_pages}}"));
    }

    @Test
    void generate_placeholderInTable_replaced() throws Exception {
        JsonObject template = createMinimalTemplate();
        JsonArray elements = template.getAsJsonArray("pages").get(0).getAsJsonObject().getAsJsonArray("elements");

        JsonObject table = new JsonObject();
        table.addProperty("type", "table");
        table.addProperty("x", 50);
        table.addProperty("y", 50);
        table.addProperty("width", 400);
        JsonArray headers = new JsonArray();
        headers.add("{{col1}}");
        headers.add("Col2");
        table.add("headers", headers);
        JsonArray rows = new JsonArray();
        JsonArray row = new JsonArray();
        row.add("{{val1}}");
        row.add("static");
        rows.add(row);
        table.add("rows", rows);
        elements.add(table);

        JsonObject placeholders = new JsonObject();
        placeholders.addProperty("col1", "Name");
        placeholders.addProperty("val1", "John");

        byte[] pdf = generator.generate(template, placeholders, null, null, null);
        assertNotNull(pdf);
    }

    @Test
    void generate_placeholderInCard_replaced() throws Exception {
        JsonObject template = createMinimalTemplate();
        JsonArray elements = template.getAsJsonArray("pages").get(0).getAsJsonObject().getAsJsonArray("elements");

        JsonObject card = new JsonObject();
        card.addProperty("type", "card");
        card.addProperty("x", 50);
        card.addProperty("y", 50);
        card.addProperty("width", 150);
        card.addProperty("height", 100);
        card.addProperty("title", "{{cardTitle}}");
        card.addProperty("value", "{{cardValue}}");
        card.addProperty("subtitle", "{{cardSub}}");
        elements.add(card);

        JsonObject placeholders = new JsonObject();
        placeholders.addProperty("cardTitle", "Revenue");
        placeholders.addProperty("cardValue", "$100K");
        placeholders.addProperty("cardSub", "This month");

        byte[] pdf = generator.generate(template, placeholders, null, null, null);
        assertNotNull(pdf);
    }

    // ─── CSV auto-table ─────────────────────────────────────────────────────

    @Test
    void generate_withCsvData_populatesAutoTable() throws Exception {
        JsonObject template = createMinimalTemplate();
        JsonArray elements = template.getAsJsonArray("pages").get(0).getAsJsonObject().getAsJsonArray("elements");

        JsonObject table = new JsonObject();
        table.addProperty("type", "table");
        table.addProperty("mode", "auto");
        table.addProperty("x", 50);
        table.addProperty("y", 50);
        table.addProperty("width", 400);
        JsonArray headers = new JsonArray();
        headers.add("Name");
        headers.add("Age");
        table.add("headers", headers);
        elements.add(table);

        List<PdfGenerator.CsvData> csvList = new ArrayList<>();
        csvList.add(PdfGenerator.CsvData.parse("Name,Age\nAlice,30\nBob,25"));

        byte[] pdf = generator.generate(template, null, csvList, null, null);
        assertNotNull(pdf);
    }

    // ─── Repeater items ─────────────────────────────────────────────────────

    @Test
    void generate_withRepeaterData_populatesItems() throws Exception {
        JsonObject template = createMinimalTemplate();
        JsonArray elements = template.getAsJsonArray("pages").get(0).getAsJsonObject().getAsJsonArray("elements");

        JsonObject repeater = new JsonObject();
        repeater.addProperty("type", "repeater");
        repeater.addProperty("id", "rep1");
        repeater.addProperty("dataKey", "products");
        repeater.addProperty("x", 50);
        repeater.addProperty("y", 50);
        repeater.addProperty("cardWidth", 150);
        repeater.addProperty("cardHeight", 100);
        repeater.addProperty("itemsPerRow", 2);
        repeater.addProperty("gap", 10);
        JsonArray cardElements = new JsonArray();
        JsonObject textEl = new JsonObject();
        textEl.addProperty("type", "text");
        textEl.addProperty("x", 5);
        textEl.addProperty("y", 5);
        textEl.addProperty("width", 140);
        textEl.addProperty("content", "{{name}}");
        cardElements.add(textEl);
        repeater.add("cardElements", cardElements);
        elements.add(repeater);

        JsonObject repeaterData = new JsonObject();
        JsonArray items = new JsonArray();
        JsonObject item1 = new JsonObject();
        JsonObject fields1 = new JsonObject();
        fields1.addProperty("name", "Product A");
        item1.add("fields", fields1);
        items.add(item1);
        repeaterData.add("products", items);

        byte[] pdf = generator.generate(template, null, null, null, repeaterData);
        assertNotNull(pdf);
    }

    @Test
    void generate_repeaterByIdFallback() throws Exception {
        JsonObject template = createMinimalTemplate();
        JsonArray elements = template.getAsJsonArray("pages").get(0).getAsJsonObject().getAsJsonArray("elements");

        JsonObject repeater = new JsonObject();
        repeater.addProperty("type", "repeater");
        repeater.addProperty("id", "myRepeater");
        repeater.addProperty("dataKey", "missingKey");
        repeater.addProperty("x", 50);
        repeater.addProperty("y", 50);
        repeater.addProperty("cardWidth", 150);
        repeater.addProperty("cardHeight", 100);
        repeater.add("cardElements", new JsonArray());
        elements.add(repeater);

        JsonObject repeaterData = new JsonObject();
        JsonArray items = new JsonArray();
        JsonObject item = new JsonObject();
        item.add("fields", new JsonObject());
        items.add(item);
        repeaterData.add("myRepeater", items); // match by id, not dataKey

        byte[] pdf = generator.generate(template, null, null, null, repeaterData);
        assertNotNull(pdf);
    }

    // ─── generate (String overload) ─────────────────────────────────────────

    @Test
    void generate_stringOverload_producesValidPdf() throws Exception {
        String templateJson = "{\"pageSize\":\"A4\",\"pages\":[{\"elements\":[]}]}";
        byte[] pdf = generator.generate(templateJson, null, null, null, null);

        assertNotNull(pdf);
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            assertEquals(1, doc.getNumberOfPages());
        }
    }

    @Test
    void generate_stringOverload_withPlaceholders() throws Exception {
        String templateJson = "{\"pages\":[{\"elements\":[{\"type\":\"text\",\"x\":10,\"y\":10,\"width\":200,\"content\":\"{{greeting}}\"}]}]}";
        Map<String, String> values = new HashMap<>();
        values.put("greeting", "Hello");

        byte[] pdf = generator.generate(templateJson, values, null, null, null);
        assertNotNull(pdf);
    }

    @Test
    void generate_stringOverload_withMetadata() throws Exception {
        String templateJson = "{\"pages\":[{\"elements\":[]}]}";
        String metadataJson = "{\"title\":\"Test\",\"author\":\"Author\"}";

        byte[] pdf = generator.generate(templateJson, null, null, metadataJson, null);
        assertNotNull(pdf);
    }

    @Test
    void generate_stringOverload_withRepeaterData() throws Exception {
        String templateJson = "{\"pages\":[{\"elements\":[{\"type\":\"repeater\",\"id\":\"r1\",\"dataKey\":\"items\",\"x\":10,\"y\":10,\"cardWidth\":100,\"cardHeight\":80,\"cardElements\":[{\"type\":\"text\",\"x\":5,\"y\":5,\"width\":90,\"content\":\"{{name}}\"}]}]}]}";
        String repeaterDataJson = "{\"items\":[{\"fields\":{\"name\":\"Test\"}}]}";

        byte[] pdf = generator.generate(templateJson, null, null, null, repeaterDataJson);
        assertNotNull(pdf);
    }

    @Test
    void generate_stringOverload_withCsvData() throws Exception {
        String templateJson = "{\"pages\":[{\"elements\":[{\"type\":\"table\",\"mode\":\"auto\",\"x\":50,\"y\":50,\"width\":400,\"headers\":[\"Name\",\"Age\"]}],\"header\":{\"height\":30,\"elements\":[]}}]}";
        List<PdfGenerator.CsvData> csvList = new ArrayList<>();
        csvList.add(PdfGenerator.CsvData.parse("Name,Age\nAlice,30"));

        byte[] pdf = generator.generate(templateJson, null, csvList, null, null);
        assertNotNull(pdf);
    }

    @Test
    void generate_stringOverload_emptyMetadata() throws Exception {
        String templateJson = "{\"pages\":[{\"elements\":[]}]}";
        byte[] pdf = generator.generate(templateJson, null, null, "", null);
        assertNotNull(pdf);
    }

    @Test
    void generate_stringOverload_emptyRepeaterData() throws Exception {
        String templateJson = "{\"pages\":[{\"elements\":[]}]}";
        byte[] pdf = generator.generate(templateJson, null, null, null, "");
        assertNotNull(pdf);
    }

    // ─── CsvData.parse ──────────────────────────────────────────────────────

    @Test
    void csvData_parse_commaDelimited() {
        PdfGenerator.CsvData data = PdfGenerator.CsvData.parse("Name,Age\nAlice,30\nBob,25");
        assertArrayEquals(new String[]{"Name", "Age"}, data.headers);
        assertEquals(2, data.rows.size());
        assertEquals("Alice", data.rows.get(0)[0]);
        assertEquals("30", data.rows.get(0)[1]);
    }

    @Test
    void csvData_parse_tabDelimited() {
        PdfGenerator.CsvData data = PdfGenerator.CsvData.parse("Name\tAge\nAlice\t30");
        assertArrayEquals(new String[]{"Name", "Age"}, data.headers);
        assertEquals(1, data.rows.size());
        assertEquals("Alice", data.rows.get(0)[0]);
    }

    @Test
    void csvData_parse_quotedValues() {
        PdfGenerator.CsvData data = PdfGenerator.CsvData.parse("\"Name\",\"Age\"\n\"Alice\",\"30\"");
        assertEquals("Name", data.headers[0]);
        assertEquals("Alice", data.rows.get(0)[0]);
    }

    @Test
    void csvData_parse_fewerCellsThanHeaders_padsEmpty() {
        PdfGenerator.CsvData data = PdfGenerator.CsvData.parse("A,B,C\n1");
        assertEquals(1, data.rows.size());
        assertEquals("1", data.rows.get(0)[0]);
        assertEquals("", data.rows.get(0)[1]);
        assertEquals("", data.rows.get(0)[2]);
    }

    @Test
    void csvData_parse_emptyInput() {
        // Empty string after trim+split still produces one element [""]
        PdfGenerator.CsvData data = PdfGenerator.CsvData.parse("");
        assertEquals(1, data.headers.length);
        assertTrue(data.rows.isEmpty());
    }

    @Test
    void csvData_parse_headerOnly() {
        PdfGenerator.CsvData data = PdfGenerator.CsvData.parse("Col1,Col2");
        assertEquals(2, data.headers.length);
        assertTrue(data.rows.isEmpty());
    }

    @Test
    void csvData_parse_emptyLinesSkipped() {
        PdfGenerator.CsvData data = PdfGenerator.CsvData.parse("A,B\n\nVal1,Val2\n\n");
        assertEquals(1, data.rows.size());
    }

    // ─── Page sizes ─────────────────────────────────────────────────────────

    @Test
    void generate_a3PageSize() throws Exception {
        JsonObject template = createMinimalTemplate();
        template.addProperty("pageSize", "A3");
        byte[] pdf = generator.generate(template, null, null, null, null);
        assertNotNull(pdf);
    }

    @Test
    void generate_a5PageSize() throws Exception {
        JsonObject template = createMinimalTemplate();
        template.addProperty("pageSize", "A5");
        byte[] pdf = generator.generate(template, null, null, null, null);
        assertNotNull(pdf);
    }

    // ─── Placeholder in header/footer ───────────────────────────────────────

    @Test
    void generate_placeholdersInHeaderFooter() throws Exception {
        JsonObject template = new JsonObject();
        template.addProperty("pageSize", "A4");
        JsonArray pages = new JsonArray();
        JsonObject page = new JsonObject();

        // Header with placeholder
        JsonObject header = new JsonObject();
        header.addProperty("height", 50);
        JsonArray headerElements = new JsonArray();
        JsonObject headerText = new JsonObject();
        headerText.addProperty("type", "text");
        headerText.addProperty("x", 10);
        headerText.addProperty("y", 10);
        headerText.addProperty("width", 200);
        headerText.addProperty("content", "{{company}}");
        headerElements.add(headerText);
        header.add("elements", headerElements);
        page.add("header", header);

        // Footer with placeholder
        JsonObject footer = new JsonObject();
        footer.addProperty("height", 30);
        JsonArray footerElements = new JsonArray();
        JsonObject footerText = new JsonObject();
        footerText.addProperty("type", "text");
        footerText.addProperty("x", 10);
        footerText.addProperty("y", 5);
        footerText.addProperty("width", 200);
        footerText.addProperty("content", "{{copyright}}");
        footerElements.add(footerText);
        footer.add("elements", footerElements);
        page.add("footer", footer);

        page.add("elements", new JsonArray());
        pages.add(page);
        template.add("pages", pages);

        JsonObject placeholders = new JsonObject();
        placeholders.addProperty("company", "Acme Inc");
        placeholders.addProperty("copyright", "2024 Acme");

        byte[] pdf = generator.generate(template, placeholders, null, null, null);
        assertNotNull(pdf);
    }

    // ─── Multiple pages ─────────────────────────────────────────────────────

    @Test
    void generate_multiplePages() throws Exception {
        JsonObject template = new JsonObject();
        template.addProperty("pageSize", "A4");
        JsonArray pages = new JsonArray();
        for (int i = 0; i < 3; i++) {
            JsonObject page = new JsonObject();
            page.add("elements", new JsonArray());
            pages.add(page);
        }
        template.add("pages", pages);

        byte[] pdf = generator.generate(template, null, null, null, null);
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            assertEquals(3, doc.getNumberOfPages());
        }
    }
}
