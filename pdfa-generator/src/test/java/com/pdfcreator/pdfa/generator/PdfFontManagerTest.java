package com.pdfcreator.pdfa.generator;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class PdfFontManagerTest {

    private PDDocument document;
    @TempDir
    Path tempBundledDir;
    @TempDir
    Path tempUploadDir;

    @BeforeEach
    void setUp() {
        document = new PDDocument();
    }

    @AfterEach
    void tearDown() throws IOException {
        document.close();
    }

    @Test
    void registerFonts_noBundledFonts_fallbackToHelvetica() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());
        fm.registerFonts(null);

        PDFont fallback = fm.getFallbackFont();
        assertNotNull(fallback);
    }

    @Test
    void getFont_unknownFamily_returnsFallback() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());
        fm.registerFonts(null);

        PDFont font = fm.getFont("NonExistentFont", false, false);
        assertNotNull(font);
        assertEquals(fm.getFallbackFont(), font);
    }

    @Test
    void getFont_withBoldAndItalic_fallsBackGracefully() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());
        fm.registerFonts(null);

        PDFont font = fm.getFont("NonExistent", true, true);
        assertNotNull(font);
        assertEquals(fm.getFallbackFont(), font);
    }

    @Test
    void getFont_convenienceMethod() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());
        fm.registerFonts(null);

        PDFont font = fm.getFont("SomeFamily");
        assertNotNull(font);
    }

    @Test
    void registerFonts_customFontWithMissingFile_logsWarning() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());

        JsonArray fonts = new JsonArray();
        JsonObject fontObj = new JsonObject();
        fontObj.addProperty("family", "CustomFont");
        JsonArray faces = new JsonArray();
        JsonObject face = new JsonObject();
        face.addProperty("weight", "normal");
        face.addProperty("style", "normal");
        face.addProperty("source", "uploaded");
        face.addProperty("ref", "nonexistent.ttf");
        faces.add(face);
        fontObj.add("faces", faces);
        fonts.add(fontObj);

        // Should not throw, just log warning
        assertDoesNotThrow(() -> fm.registerFonts(fonts));
    }

    @Test
    void registerFonts_bundledFamilyInCustomFonts_skipped() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());

        JsonArray fonts = new JsonArray();
        JsonObject fontObj = new JsonObject();
        fontObj.addProperty("family", "Roboto"); // bundled family
        JsonArray faces = new JsonArray();
        fontObj.add("faces", faces);
        fonts.add(fontObj);

        assertDoesNotThrow(() -> fm.registerFonts(fonts));
    }

    @Test
    void registerFonts_customFontWithNullFaces_skipped() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());

        JsonArray fonts = new JsonArray();
        JsonObject fontObj = new JsonObject();
        fontObj.addProperty("family", "CustomFont");
        // No faces array
        fonts.add(fontObj);

        assertDoesNotThrow(() -> fm.registerFonts(fonts));
    }

    @Test
    void registerFonts_customFontBundledSource_missingFile() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());

        JsonArray fonts = new JsonArray();
        JsonObject fontObj = new JsonObject();
        fontObj.addProperty("family", "CustomFont");
        JsonArray faces = new JsonArray();
        JsonObject face = new JsonObject();
        face.addProperty("weight", "bold");
        face.addProperty("style", "italic");
        face.addProperty("source", "bundled");
        face.addProperty("ref", "missing.ttf");
        faces.add(face);
        fontObj.add("faces", faces);
        fonts.add(fontObj);

        assertDoesNotThrow(() -> fm.registerFonts(fonts));
    }

    @Test
    void resolveUploadedFont_nullUploadDir() throws IOException {
        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), null);
        fm.registerFonts(null);

        // Custom font with uploaded source should not crash
        JsonArray fonts = new JsonArray();
        JsonObject fontObj = new JsonObject();
        fontObj.addProperty("family", "Custom");
        JsonArray faces = new JsonArray();
        JsonObject face = new JsonObject();
        face.addProperty("ref", "test.ttf");
        face.addProperty("source", "uploaded");
        faces.add(face);
        fontObj.add("faces", faces);
        fonts.add(fontObj);

        assertDoesNotThrow(() -> fm.registerFonts(fonts));
    }

    // ─── Tests with real bundled fonts ────────────────────────────────────────

    private static final String REAL_FONT_DIR = "fonts";

    private boolean hasRealFonts() {
        return Files.exists(Path.of(REAL_FONT_DIR, "Roboto-Regular.ttf"));
    }

    @Test
    void registerFonts_realBundledFonts_loadsSuccessfully() throws IOException {
        if (!hasRealFonts()) return;

        PdfFontManager fm = new PdfFontManager(document, REAL_FONT_DIR, tempUploadDir.toString());
        fm.registerFonts(null);

        // Should load Roboto and others
        PDFont robotoRegular = fm.getFont("Roboto", false, false);
        assertNotNull(robotoRegular);
        assertNotEquals(fm.getFallbackFont().getName(), "Helvetica");
    }

    @Test
    void getFont_realFonts_boldItalicFallback() throws IOException {
        if (!hasRealFonts()) return;

        PdfFontManager fm = new PdfFontManager(document, REAL_FONT_DIR, tempUploadDir.toString());
        fm.registerFonts(null);

        // Test bold+italic, bold-only, italic-only
        PDFont bold = fm.getFont("Roboto", true, false);
        PDFont italic = fm.getFont("Roboto", false, true);
        PDFont boldItalic = fm.getFont("Roboto", true, true);
        assertNotNull(bold);
        assertNotNull(italic);
        assertNotNull(boldItalic);
    }

    @Test
    void getFont_realFonts_allFamilies() throws IOException {
        if (!hasRealFonts()) return;

        PdfFontManager fm = new PdfFontManager(document, REAL_FONT_DIR, tempUploadDir.toString());
        fm.registerFonts(null);

        assertNotNull(fm.getFont("Open Sans", false, false));
        assertNotNull(fm.getFont("Calibri", false, false));
        assertNotNull(fm.getFont("Lato", false, false));
        assertNotNull(fm.getFont("Inter", false, false));
        // Arial maps to Calibri
        assertNotNull(fm.getFont("Arial", false, false));
    }

    @Test
    void registerFonts_realFonts_customUploadedFont() throws IOException {
        if (!hasRealFonts()) return;

        // Copy a real font to the upload dir to test uploaded font loading
        Path srcFont = Path.of(REAL_FONT_DIR, "Roboto-Regular.ttf");
        Path destFont = tempUploadDir.resolve("CustomFont-Regular.ttf");
        Files.copy(srcFont, destFont);

        PdfFontManager fm = new PdfFontManager(document, REAL_FONT_DIR, tempUploadDir.toString());

        JsonArray fonts = new JsonArray();
        JsonObject fontObj = new JsonObject();
        fontObj.addProperty("family", "MyCustom");
        JsonArray faces = new JsonArray();
        JsonObject face = new JsonObject();
        face.addProperty("weight", "normal");
        face.addProperty("style", "normal");
        face.addProperty("source", "uploaded");
        face.addProperty("ref", "CustomFont-Regular.ttf");
        faces.add(face);
        fontObj.add("faces", faces);
        fonts.add(fontObj);

        fm.registerFonts(fonts);

        PDFont customFont = fm.getFont("MyCustom", false, false);
        assertNotNull(customFont);
        assertNotEquals(fm.getFallbackFont(), customFont);
    }

    @Test
    void registerFonts_realFonts_customBundledSource() throws IOException {
        if (!hasRealFonts()) return;

        PdfFontManager fm = new PdfFontManager(document, REAL_FONT_DIR, tempUploadDir.toString());

        JsonArray fonts = new JsonArray();
        JsonObject fontObj = new JsonObject();
        fontObj.addProperty("family", "MyBundled");
        JsonArray faces = new JsonArray();
        JsonObject face = new JsonObject();
        face.addProperty("weight", "normal");
        face.addProperty("style", "normal");
        face.addProperty("source", "bundled");
        face.addProperty("ref", "Roboto-Regular.ttf");
        faces.add(face);
        fontObj.add("faces", faces);
        fonts.add(fontObj);

        fm.registerFonts(fonts);

        PDFont font = fm.getFont("MyBundled", false, false);
        assertNotNull(font);
    }

    @Test
    void resolveUploadedFont_withExtensionMatch() throws IOException {
        if (!Files.exists(Path.of(REAL_FONT_DIR, "Roboto-Regular.ttf"))) return;

        // Copy a real font with a name that tests the extension-matching path
        Path srcFont = Path.of(REAL_FONT_DIR, "Roboto-Regular.ttf");
        Path destFont = tempUploadDir.resolve("myfont.ttf");
        Files.copy(srcFont, destFont);

        PdfFontManager fm = new PdfFontManager(document, tempBundledDir.toString(), tempUploadDir.toString());

        JsonArray fonts = new JsonArray();
        JsonObject fontObj = new JsonObject();
        fontObj.addProperty("family", "TestFont");
        JsonArray faces = new JsonArray();
        JsonObject face = new JsonObject();
        face.addProperty("ref", "myfont"); // no extension, should match myfont.ttf
        face.addProperty("source", "uploaded");
        faces.add(face);
        fontObj.add("faces", faces);
        fonts.add(fontObj);

        fm.registerFonts(fonts);
        PDFont font = fm.getFont("TestFont", false, false);
        assertNotNull(font);
        assertNotEquals(fm.getFallbackFont(), font);
    }
}
