package com.pdfcreator.pdfa.generator;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;

import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Main entry point for PDF generation from a template JSON.
 *
 * Accepts:
 * - template JSON (same schema as pdf-creator editor output)
 * - placeholder values (key→value map)
 * - CSV data for auto tables (array of {headers, rows})
 * - metadata (title, author, subject, etc.)
 *
 * Produces a PDF byte array using Apache PDFBox.
 */
public class PdfGenerator {

    private static final Pattern PLACEHOLDER_RE = Pattern.compile("\\{\\{([^}]+)}}");
    private static final Set<String> RESERVED_PLACEHOLDERS = Set.of("page_number", "total_pages");

    private final String bundledFontDir;
    private final String uploadFontDir;

    /**
     * @param bundledFontDir directory containing bundled TTF font files
     * @param uploadFontDir  directory containing user-uploaded font files (nullable)
     */
    public PdfGenerator(String bundledFontDir, String uploadFontDir) {
        this.bundledFontDir = bundledFontDir;
        this.uploadFontDir = uploadFontDir;
    }

    /**
     * Generate a PDF from a template.
     *
     * @param templateJson     the full template JSON string
     * @param placeholderValues placeholder key→value map (may be null)
     * @param csvDataList      list of CSV data objects [{headers:[...], rows:[[...],...]}] (may be null)
     * @param metadataJson     PDF metadata JSON string (may be null)
     * @param repeaterDataJson repeater items JSON: {"repeaterId": [{"fields":{...}},...]} (may be null)
     * @return PDF bytes
     */
    public byte[] generate(String templateJson, Map<String, String> placeholderValues,
                           List<CsvData> csvDataList, String metadataJson,
                           String repeaterDataJson) throws Exception {

        JsonObject template = JsonParser.parseString(templateJson).getAsJsonObject();

        // ── 1. Apply placeholder values ──
        if (placeholderValues != null && !placeholderValues.isEmpty()) {
            applyPlaceholders(template, placeholderValues);
        }

        // ── 2. Apply CSV data to auto tables ──
        if (csvDataList != null && !csvDataList.isEmpty()) {
            applyAutoTableRows(template, csvDataList);
        }

        // ── 3. Apply repeater items ──
        if (repeaterDataJson != null && !repeaterDataJson.isEmpty()) {
            applyRepeaterItems(template, repeaterDataJson);
        }

        // ── 4. Parse metadata ──
        JsonObject metadata = null;
        if (metadataJson != null && !metadataJson.isEmpty()) {
            metadata = JsonParser.parseString(metadataJson).getAsJsonObject();
        }

        // ── 5. Generate PDF ──
        return renderPdf(template, metadata);
    }

    /**
     * Generate from pre-parsed JSON objects (used by App.java handler).
     */
    public byte[] generate(JsonObject template, JsonObject placeholders,
                           List<CsvData> csvDataList, JsonObject metadata,
                           JsonObject repeaterData) throws Exception {

        // Apply placeholder values
        if (placeholders != null && placeholders.size() > 0) {
            Map<String, String> values = new HashMap<>();
            for (String key : placeholders.keySet()) {
                values.put(key, placeholders.get(key).getAsString());
            }
            applyPlaceholders(template, values);
        }

        // Apply CSV data
        if (csvDataList != null && !csvDataList.isEmpty()) {
            applyAutoTableRows(template, csvDataList);
        }

        // Apply repeater items
        if (repeaterData != null && repeaterData.size() > 0) {
            applyRepeaterItemsFromJson(template, repeaterData);
        }

        return renderPdf(template, metadata);
    }

    // ─── PDF Rendering ───────────────────────────────────────────────────────

    private byte[] renderPdf(JsonObject template, JsonObject metadata) throws Exception {
        String pageSize = template.has("pageSize") ? template.get("pageSize").getAsString() : "A4";
        String fontFamily = template.has("fontFamily") ? template.get("fontFamily").getAsString() : "Roboto";
        JsonArray fonts = template.has("fonts") ? template.getAsJsonArray("fonts") : null;
        JsonArray pages = template.getAsJsonArray("pages");
        JsonObject watermark = template.has("watermark") && !template.get("watermark").isJsonNull()
                ? template.getAsJsonObject("watermark") : null;

        if (pages == null || pages.isEmpty()) {
            throw new IllegalArgumentException("Template must have at least one page");
        }

        int totalPages = pages.size();

        try (PDDocument document = new PDDocument()) {
            // Set metadata
            PDDocumentInformation info = document.getDocumentInformation();
            if (metadata != null) {
                setIfPresent(info, metadata, "title");
                setIfPresent(info, metadata, "author");
                setIfPresent(info, metadata, "subject");
                setIfPresent(info, metadata, "keywords");
                if (metadata.has("creator") && !metadata.get("creator").isJsonNull()) {
                    info.setCreator(metadata.get("creator").getAsString());
                }
                if (metadata.has("producer") && !metadata.get("producer").isJsonNull()) {
                    info.setProducer(metadata.get("producer").getAsString());
                }
            } else {
                String name = template.has("name") ? template.get("name").getAsString() : "Untitled";
                info.setTitle(name);
            }
            info.setCreationDate(Calendar.getInstance());
            info.setModificationDate(Calendar.getInstance());
            if (info.getProducer() == null) {
                info.setProducer("pdfa-generator (Apache PDFBox)");
            }

            // Initialize font manager
            PdfFontManager fontManager = new PdfFontManager(document, bundledFontDir, uploadFontDir);
            fontManager.registerFonts(fonts);

            // Initialize renderer
            PdfElementRenderer renderer = new PdfElementRenderer(document, fontManager, fontFamily);

            // Apply compression settings
            if (template.has("compression") && !template.get("compression").isJsonNull()) {
                JsonObject compression = template.getAsJsonObject("compression");
                if (compression.has("imageQuality")) {
                    renderer.setImageQuality(compression.get("imageQuality").getAsInt());
                }
            }

            PdfPageLayout layout = new PdfPageLayout(document, renderer, pageSize);

            // Render each template page
            for (int i = 0; i < pages.size(); i++) {
                JsonObject page = pages.get(i).getAsJsonObject();
                layout.renderPage(page, i + 1, totalPages, watermark);
            }

            // Build PDF document outline from page bookmarks
            layout.buildDocumentOutline();

            // Write to bytes
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // ─── Placeholder Resolution ──────────────────────────────────────────────

    private void applyPlaceholders(JsonObject template, Map<String, String> values) {
        JsonArray pages = template.getAsJsonArray("pages");
        if (pages == null) return;

        for (JsonElement pageEl : pages) {
            JsonObject page = pageEl.getAsJsonObject();

            // Header
            if (page.has("header") && !page.get("header").isJsonNull()) {
                JsonObject header = page.getAsJsonObject("header");
                replaceInElements(header.getAsJsonArray("elements"), values);
            }

            // Footer
            if (page.has("footer") && !page.get("footer").isJsonNull()) {
                JsonObject footer = page.getAsJsonObject("footer");
                replaceInElements(footer.getAsJsonArray("elements"), values);
            }

            // Body
            replaceInElements(page.getAsJsonArray("elements"), values);
        }
    }

    private void replaceInElements(JsonArray elements, Map<String, String> values) {
        if (elements == null) return;

        for (JsonElement elJson : elements) {
            JsonObject el = elJson.getAsJsonObject();
            String type = el.has("type") ? el.get("type").getAsString() : "";

            switch (type) {
                case "text", "heading" -> {
                    String content = el.has("content") ? el.get("content").getAsString() : "";
                    el.addProperty("content", replacePlaceholders(content, values));
                }
                case "table" -> {
                    if (el.has("headers")) {
                        JsonArray headers = el.getAsJsonArray("headers");
                        JsonArray newHeaders = new JsonArray();
                        for (JsonElement h : headers) {
                            newHeaders.add(replacePlaceholders(h.getAsString(), values));
                        }
                        el.add("headers", newHeaders);
                    }
                    if (el.has("rows")) {
                        JsonArray rows = el.getAsJsonArray("rows");
                        JsonArray newRows = new JsonArray();
                        for (JsonElement rowEl : rows) {
                            JsonArray row = rowEl.getAsJsonArray();
                            JsonArray newRow = new JsonArray();
                            for (JsonElement cell : row) {
                                newRow.add(replacePlaceholders(cell.getAsString(), values));
                            }
                            newRows.add(newRow);
                        }
                        el.add("rows", newRows);
                    }
                }
                case "card" -> {
                    replaceProperty(el, "title", values);
                    replaceProperty(el, "value", values);
                    replaceProperty(el, "subtitle", values);
                }
            }
        }
    }

    private void replaceProperty(JsonObject el, String key, Map<String, String> values) {
        if (el.has(key) && !el.get(key).isJsonNull()) {
            el.addProperty(key, replacePlaceholders(el.get(key).getAsString(), values));
        }
    }

    private String replacePlaceholders(String text, Map<String, String> values) {
        if (text == null) return "";
        Matcher m = PLACEHOLDER_RE.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String key = m.group(1).trim();
            if (RESERVED_PLACEHOLDERS.contains(key)) {
                m.appendReplacement(sb, Matcher.quoteReplacement(m.group(0)));
            } else {
                String replacement = values.getOrDefault(key, m.group(0));
                m.appendReplacement(sb, Matcher.quoteReplacement(replacement));
            }
        }
        m.appendTail(sb);
        return sb.toString();
    }

    // ─── Auto Table CSV ──────────────────────────────────────────────────────

    private void applyAutoTableRows(JsonObject template, List<CsvData> csvDataList) {
        List<JsonObject> autoTables = collectAutoTables(template);
        for (int i = 0; i < Math.min(csvDataList.size(), autoTables.size()); i++) {
            CsvData csv = csvDataList.get(i);
            JsonObject table = autoTables.get(i);

            JsonArray rowsArray = new JsonArray();
            for (String[] row : csv.rows) {
                JsonArray rowJson = new JsonArray();
                for (String cell : row) {
                    rowJson.add(cell);
                }
                rowsArray.add(rowJson);
            }
            table.add("rows", rowsArray);
        }
    }

    private List<JsonObject> collectAutoTables(JsonObject template) {
        List<JsonObject> tables = new ArrayList<>();
        JsonArray pages = template.getAsJsonArray("pages");
        if (pages == null) return tables;

        for (JsonElement pageEl : pages) {
            JsonObject page = pageEl.getAsJsonObject();
            collectAutoTablesFromSection(page.has("header") && !page.get("header").isJsonNull()
                    ? page.getAsJsonObject("header").getAsJsonArray("elements") : null, tables);
            collectAutoTablesFromSection(page.has("footer") && !page.get("footer").isJsonNull()
                    ? page.getAsJsonObject("footer").getAsJsonArray("elements") : null, tables);
            collectAutoTablesFromSection(page.getAsJsonArray("elements"), tables);
        }
        return tables;
    }

    private void collectAutoTablesFromSection(JsonArray elements, List<JsonObject> tables) {
        if (elements == null) return;
        for (JsonElement elJson : elements) {
            JsonObject el = elJson.getAsJsonObject();
            if ("table".equals(el.has("type") ? el.get("type").getAsString() : "")
                    && "auto".equals(el.has("mode") ? el.get("mode").getAsString() : "manual")) {
                tables.add(el);
            }
        }
    }

    // ─── Repeater Items ──────────────────────────────────────────────────────

    private void applyRepeaterItems(JsonObject template, String repeaterDataJson) {
        JsonObject data = JsonParser.parseString(repeaterDataJson).getAsJsonObject();
        applyRepeaterItemsFromJson(template, data);
    }

    private void applyRepeaterItemsFromJson(JsonObject template, JsonObject data) {
        JsonArray pages = template.getAsJsonArray("pages");
        if (pages == null) return;

        for (JsonElement pageEl : pages) {
            JsonObject page = pageEl.getAsJsonObject();
            JsonArray elements = page.getAsJsonArray("elements");
            if (elements == null) continue;

            for (JsonElement elJson : elements) {
                JsonObject el = elJson.getAsJsonObject();
                if (!"repeater".equals(el.has("type") ? el.get("type").getAsString() : ""))
                    continue;

                String id = el.has("id") ? el.get("id").getAsString() : "";
                String dataKey = el.has("dataKey") ? el.get("dataKey").getAsString() : "";

                // Try by id first, then by dataKey
                JsonArray items = null;
                if (data.has(id)) items = data.getAsJsonArray(id);
                else if (data.has(dataKey)) items = data.getAsJsonArray(dataKey);

                if (items != null) {
                    el.add("items", items);
                }
            }
        }
    }

    // ─── Metadata helpers ────────────────────────────────────────────────────

    private void setIfPresent(PDDocumentInformation info, JsonObject metadata, String key) {
        if (!metadata.has(key) || metadata.get(key).isJsonNull()) return;
        String value = metadata.get(key).getAsString();
        switch (key) {
            case "title" -> info.setTitle(value);
            case "author" -> info.setAuthor(value);
            case "subject" -> info.setSubject(value);
            case "keywords" -> info.setKeywords(value);
        }
    }

    // ─── CSV Data ────────────────────────────────────────────────────────────

    /**
     * Parsed CSV data for auto tables.
     */
    public static class CsvData {
        public final String[] headers;
        public final List<String[]> rows;

        public CsvData(String[] headers, List<String[]> rows) {
            this.headers = headers;
            this.rows = rows;
        }

        /**
         * Parse CSV text into CsvData. First row = headers.
         * Auto-detects tab vs comma delimiter.
         */
        public static CsvData parse(String raw) {
            String[] lines = raw.trim().split("\n");
            if (lines.length == 0) return new CsvData(new String[0], List.of());

            String delimiter = lines[0].contains("\t") ? "\t" : ",";

            String[] headers = parseLine(lines[0], delimiter);
            List<String[]> rows = new ArrayList<>();
            for (int i = 1; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;
                String[] cells = parseLine(line, delimiter);
                // Pad or truncate to match header count
                String[] padded = new String[headers.length];
                for (int j = 0; j < headers.length; j++) {
                    padded[j] = j < cells.length ? cells[j] : "";
                }
                rows.add(padded);
            }
            return new CsvData(headers, rows);
        }

        private static String[] parseLine(String line, String delimiter) {
            String[] parts = line.split(delimiter, -1);
            for (int i = 0; i < parts.length; i++) {
                parts[i] = parts[i].trim().replaceAll("^\"|\"$", "");
            }
            return parts;
        }
    }
}
