package com.pdfcreator.pdfa;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.pdfcreator.pdfa.generator.PdfGenerator;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

public class App {

    private static final Logger LOG = Logger.getLogger(App.class.getName());
    private static final Gson GSON = new Gson();
    private static PdfAConverter pdfAConverter;
    private static PdfSigner pdfSigner;
    private static PdfEncryptor pdfEncryptor;
    private static PdfMergerSplitter pdfMergerSplitter;
    private static PdfTextExtractor pdfTextExtractor;
    private static PdfMetadataExtractor pdfMetadataExtractor;
    private static PdfWatermarker pdfWatermarker;
    private static PdfGenerator pdfGenerator;

    public static void main(String[] args) throws Exception {
        String iccProfilePath = resolveIccProfile();
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8090"));

        pdfAConverter = new PdfAConverter(iccProfilePath);
        pdfSigner = new PdfSigner();
        pdfEncryptor = new PdfEncryptor();
        pdfMergerSplitter = new PdfMergerSplitter();
        pdfTextExtractor = new PdfTextExtractor();
        pdfMetadataExtractor = new PdfMetadataExtractor();
        pdfWatermarker = new PdfWatermarker();

        String bundledFontDir = System.getenv().getOrDefault("BUNDLED_FONT_DIR", "/app/fonts");
        String uploadFontDir = System.getenv().getOrDefault("UPLOAD_FONT_DIR", "/tmp/pdf-creator-fonts");
        pdfGenerator = new PdfGenerator(bundledFontDir, uploadFontDir);

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newFixedThreadPool(
                Runtime.getRuntime().availableProcessors()));

        server.createContext("/api/health", App::handleHealth);
        server.createContext("/api/convert-to-pdfa", App::handleConvertToPdfA);
        server.createContext("/api/sign", App::handleSign);
        server.createContext("/api/validate-pdfa", App::handleValidatePdfA);
        server.createContext("/api/encrypt", App::handleEncrypt);
        server.createContext("/api/merge", App::handleMerge);
        server.createContext("/api/split", App::handleSplit);
        server.createContext("/api/extract-text", App::handleExtractText);
        server.createContext("/api/extract-metadata", App::handleExtractMetadata);
        server.createContext("/api/text-watermark", App::handleTextWatermark);
        server.createContext("/api/image-watermark", App::handleImageWatermark);
        server.createContext("/api/generate", App::handleGenerate);

        server.start();
        LOG.info("pdfa-generator listening on port " + port);
    }

    // ---------- Health ----------

    private static void handleHealth(HttpExchange ex) throws IOException {
        sendJson(ex, 200, "{\"status\":\"ok\"}");
    }

    // ---------- Convert to PDF/A ----------

    private static void handleConvertToPdfA(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());
            int part = body.has("part") ? body.get("part").getAsInt() : 2;
            String conformance = body.has("conformance") ? body.get("conformance").getAsString() : "B";
            String title = body.has("title") ? body.get("title").getAsString() : "";
            String author = body.has("author") ? body.get("author").getAsString() : "";

            byte[] result = pdfAConverter.convertToPdfA(pdfBytes, part, conformance, title, author);

            JsonObject resp = new JsonObject();
            resp.addProperty("pdf", Base64.getEncoder().encodeToString(result));
            resp.addProperty("success", true);
            sendJson(ex, 200, GSON.toJson(resp));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "PDF/A conversion failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Digital Signature ----------

    private static void handleSign(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());
            byte[] keystoreBytes = Base64.getDecoder().decode(body.get("keystore").getAsString());
            String keystorePassword = body.get("keystorePassword").getAsString();
            String keystoreType = body.has("keystoreType") ? body.get("keystoreType").getAsString() : "PKCS12";

            String alias = body.has("alias") ? body.get("alias").getAsString() : null;
            String reason = body.has("reason") ? body.get("reason").getAsString() : null;
            String location = body.has("location") ? body.get("location").getAsString() : null;
            String contactInfo = body.has("contactInfo") ? body.get("contactInfo").getAsString() : null;

            byte[] result = pdfSigner.sign(
                    pdfBytes, keystoreBytes, keystorePassword, keystoreType,
                    alias, reason, location, contactInfo);

            JsonObject resp = new JsonObject();
            resp.addProperty("pdf", Base64.getEncoder().encodeToString(result));
            resp.addProperty("success", true);
            sendJson(ex, 200, GSON.toJson(resp));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "PDF signing failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- PDF/A Validation ----------

    private static void handleValidatePdfA(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());

            JsonObject result = pdfAConverter.validatePdfA(pdfBytes);
            sendJson(ex, 200, GSON.toJson(result));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "PDF/A validation failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Encrypt ----------

    private static void handleEncrypt(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());
            String userPassword = body.get("userPassword").getAsString();
            String ownerPassword = body.has("ownerPassword") && !body.get("ownerPassword").isJsonNull()
                    ? body.get("ownerPassword").getAsString() : userPassword;
            int keyLength = body.has("keyLength") ? body.get("keyLength").getAsInt() : 256;
            int permissions = body.has("permissions") ? body.get("permissions").getAsInt() : 4;

            byte[] result = pdfEncryptor.encrypt(
                    pdfBytes, userPassword, ownerPassword, keyLength, permissions);

            JsonObject resp = new JsonObject();
            resp.addProperty("pdf", Base64.getEncoder().encodeToString(result));
            resp.addProperty("success", true);
            sendJson(ex, 200, GSON.toJson(resp));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "PDF encryption failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Merge ----------

    private static void handleMerge(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            JsonArray pdfsArray = body.getAsJsonArray("pdfs");
            if (pdfsArray == null || pdfsArray.isEmpty()) {
                sendError(ex, 400, "Field 'pdfs' must be a non-empty array of base64-encoded PDFs");
                return;
            }

            List<byte[]> pdfBytesList = new ArrayList<>();
            for (int i = 0; i < pdfsArray.size(); i++) {
                pdfBytesList.add(Base64.getDecoder().decode(pdfsArray.get(i).getAsString()));
            }

            byte[] result = pdfMergerSplitter.merge(pdfBytesList);

            JsonObject resp = new JsonObject();
            resp.addProperty("pdf", Base64.getEncoder().encodeToString(result));
            resp.addProperty("success", true);
            sendJson(ex, 200, GSON.toJson(resp));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "PDF merge failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Split ----------

    private static void handleSplit(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());

            List<Integer> pages = null;
            if (body.has("pages") && !body.get("pages").isJsonNull()) {
                JsonArray pagesArray = body.getAsJsonArray("pages");
                pages = new ArrayList<>();
                for (int i = 0; i < pagesArray.size(); i++) {
                    pages.add(pagesArray.get(i).getAsInt());
                }
            }

            List<byte[]> results = pdfMergerSplitter.split(pdfBytes, pages);

            JsonObject resp = new JsonObject();
            JsonArray pdfsArray = new JsonArray();
            for (byte[] pdf : results) {
                pdfsArray.add(Base64.getEncoder().encodeToString(pdf));
            }
            resp.add("pdfs", pdfsArray);
            resp.addProperty("count", results.size());
            resp.addProperty("success", true);
            sendJson(ex, 200, GSON.toJson(resp));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "PDF split failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Extract Text ----------

    private static void handleExtractText(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());
            int startPage = body.has("startPage") ? body.get("startPage").getAsInt() : 0;
            int endPage = body.has("endPage") ? body.get("endPage").getAsInt() : 0;
            boolean perPage = body.has("perPage") && body.get("perPage").getAsBoolean();

            JsonObject result = pdfTextExtractor.extractText(pdfBytes, startPage, endPage, perPage);
            sendJson(ex, 200, GSON.toJson(result));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Text extraction failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Extract Metadata ----------

    private static void handleExtractMetadata(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());

            JsonObject result = pdfMetadataExtractor.extractMetadata(pdfBytes);
            sendJson(ex, 200, GSON.toJson(result));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Metadata extraction failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Text Watermark ----------

    private static void handleTextWatermark(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());
            String text = body.get("text").getAsString();
            float fontSize = body.has("fontSize") ? body.get("fontSize").getAsFloat() : 60f;
            float rotation = body.has("rotation") ? body.get("rotation").getAsFloat() : 45f;
            float opacity = body.has("opacity") ? body.get("opacity").getAsFloat() : 0.3f;
            String color = body.has("color") ? body.get("color").getAsString() : "#888888";

            List<Integer> pages = null;
            if (body.has("pages") && !body.get("pages").isJsonNull()) {
                JsonArray pagesArray = body.getAsJsonArray("pages");
                pages = new ArrayList<>();
                for (int i = 0; i < pagesArray.size(); i++) {
                    pages.add(pagesArray.get(i).getAsInt());
                }
            }

            byte[] result = pdfWatermarker.addTextWatermark(
                    pdfBytes, text, fontSize, rotation, opacity, color, pages);

            JsonObject resp = new JsonObject();
            resp.addProperty("pdf", Base64.getEncoder().encodeToString(result));
            resp.addProperty("success", true);
            sendJson(ex, 200, GSON.toJson(resp));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Text watermark failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Image Watermark ----------

    private static void handleImageWatermark(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);
            byte[] pdfBytes = Base64.getDecoder().decode(body.get("pdf").getAsString());
            byte[] imageBytes = Base64.getDecoder().decode(body.get("image").getAsString());
            float x = body.has("x") ? body.get("x").getAsFloat() : -1f;
            float y = body.has("y") ? body.get("y").getAsFloat() : -1f;
            float width = body.has("width") ? body.get("width").getAsFloat() : 0f;
            float height = body.has("height") ? body.get("height").getAsFloat() : 0f;
            float opacity = body.has("opacity") ? body.get("opacity").getAsFloat() : 0.3f;

            List<Integer> pages = null;
            if (body.has("pages") && !body.get("pages").isJsonNull()) {
                JsonArray pagesArray = body.getAsJsonArray("pages");
                pages = new ArrayList<>();
                for (int i = 0; i < pagesArray.size(); i++) {
                    pages.add(pagesArray.get(i).getAsInt());
                }
            }

            byte[] result = pdfWatermarker.addImageWatermark(
                    pdfBytes, imageBytes, x, y, width, height, opacity, pages);

            JsonObject resp = new JsonObject();
            resp.addProperty("pdf", Base64.getEncoder().encodeToString(result));
            resp.addProperty("success", true);
            sendJson(ex, 200, GSON.toJson(resp));
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Image watermark failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- Generate PDF from Template ----------

    private static void handleGenerate(HttpExchange ex) throws IOException {
        if (!requirePost(ex)) return;
        try {
            JsonObject body = parseJsonBody(ex);

            // Required: template
            if (!body.has("template") || body.get("template").isJsonNull()) {
                sendError(ex, 400, "Missing required field 'template'");
                return;
            }
            JsonObject template;
            JsonElement templateEl = body.get("template");
            if (templateEl.isJsonPrimitive()) {
                template = GSON.fromJson(templateEl.getAsString(), JsonObject.class);
            } else {
                template = templateEl.getAsJsonObject();
            }

            // Optional: placeholders
            JsonObject placeholders = body.has("placeholders") && !body.get("placeholders").isJsonNull()
                    ? body.getAsJsonObject("placeholders") : null;

            // Optional: csv (array of CSV strings)
            List<PdfGenerator.CsvData> csvDataList = new ArrayList<>();
            if (body.has("csv") && body.get("csv").isJsonArray()) {
                for (JsonElement csvEl : body.getAsJsonArray("csv")) {
                    csvDataList.add(PdfGenerator.CsvData.parse(csvEl.getAsString()));
                }
            }

            // Optional: metadata
            JsonObject metadata = body.has("metadata") && !body.get("metadata").isJsonNull()
                    ? body.getAsJsonObject("metadata") : null;

            // Optional: repeaterData
            JsonObject repeaterData = body.has("repeaterData") && !body.get("repeaterData").isJsonNull()
                    ? body.getAsJsonObject("repeaterData") : null;

            byte[] pdfBytes = pdfGenerator.generate(template, placeholders, csvDataList, metadata, repeaterData);

            // Return as base64 JSON (consistent with other endpoints)
            // or as binary PDF based on Accept header
            String accept = ex.getRequestHeaders().getFirst("Accept");
            if (accept != null && accept.contains("application/pdf")) {
                ex.getResponseHeaders().set("Content-Type", "application/pdf");
                String fileName = metadata != null && metadata.has("fileName")
                        ? metadata.get("fileName").getAsString() : "output.pdf";
                ex.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
                ex.sendResponseHeaders(200, pdfBytes.length);
                try (OutputStream os = ex.getResponseBody()) {
                    os.write(pdfBytes);
                }
            } else {
                JsonObject resp = new JsonObject();
                resp.addProperty("pdf", Base64.getEncoder().encodeToString(pdfBytes));
                resp.addProperty("success", true);
                sendJson(ex, 200, GSON.toJson(resp));
            }
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "PDF generation failed", e);
            sendError(ex, 500, e.getMessage());
        }
    }

    // ---------- ICC Profile Resolution ----------

    private static final String[] ICC_SEARCH_PATHS = {
            "/usr/share/color/icc/ghostscript/srgb.icc",
            "/usr/share/color/icc/sRGB.icc",
            "/usr/share/color/icc/colord/sRGB.icc",
            "/app/resources/sRGB2014.icc",
    };

    private static String resolveIccProfile() {
        String envPath = System.getenv("ICC_PROFILE_PATH");
        if (envPath != null && Files.exists(Path.of(envPath))) {
            return envPath;
        }
        for (String candidate : ICC_SEARCH_PATHS) {
            if (Files.exists(Path.of(candidate))) {
                LOG.info("Auto-detected ICC profile: " + candidate);
                return candidate;
            }
        }
        throw new RuntimeException(
                "No sRGB ICC profile found. Set ICC_PROFILE_PATH or install icc-profiles-free / ghostscript.");
    }

    // ---------- Helpers ----------

    private static boolean requirePost(HttpExchange ex) throws IOException {
        if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
            sendError(ex, 405, "Method not allowed");
            return false;
        }
        return true;
    }

    private static JsonObject parseJsonBody(HttpExchange ex) throws IOException {
        try (InputStream is = ex.getRequestBody()) {
            String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            return GSON.fromJson(json, JsonObject.class);
        }
    }

    private static void sendJson(HttpExchange ex, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void sendError(HttpExchange ex, int status, String message) throws IOException {
        JsonObject err = new JsonObject();
        err.addProperty("success", false);
        err.addProperty("error", message != null ? message : "Unknown error");
        sendJson(ex, status, GSON.toJson(err));
    }
}
