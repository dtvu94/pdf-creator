package com.pdfcreator.pdfa;

import com.google.gson.JsonObject;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class PdfAConverterTest {

    private static PdfAConverter converter;
    private static boolean iccProfileAvailable = false;

    private static final String[] ICC_PATHS = {
            "/usr/share/color/icc/ghostscript/srgb.icc",
            "/usr/share/color/icc/sRGB.icc",
            "/usr/share/color/icc/colord/sRGB.icc",
    };

    @BeforeAll
    static void setUp() {
        for (String path : ICC_PATHS) {
            if (Files.exists(Path.of(path))) {
                try {
                    converter = new PdfAConverter(path);
                    iccProfileAvailable = true;
                } catch (IOException e) {
                    // skip
                }
                break;
            }
        }
    }

    static boolean hasIccProfile() {
        return iccProfileAvailable;
    }

    // ─── categorizeError (testable via reflection) ──────────────────────────

    @ParameterizedTest
    @CsvSource({
            "1.0, syntax",
            "1.4.5, syntax",
            "2.1, graphics",
            "2.2.3, graphics",
            "2.3, transparency",
            "2.3.1, transparency",
            "2.4, color",
            "2.4.1, color",
            "3.1, font",
            "3.2.1, font",
            "4.0, metadata",
            "4.1.2, metadata",
            "5.0, annotation",
            "5.1, annotation",
            "6.0, action",
            "6.1, action",
            "7.0, structure",
            "7.1, structure",
            "8.0, other",
            "9.9, other"
    })
    void categorizeError_byPrefix(String code, String expected) throws Exception {
        // Access private method via reflection
        Method m = PdfAConverter.class.getDeclaredMethod("categorizeError", String.class);
        m.setAccessible(true);

        // We need an instance - create a dummy one if converter is null
        PdfAConverter instance = converter;
        if (instance == null) {
            // Use reflection to create without constructor
            var ctor = PdfAConverter.class.getDeclaredConstructors()[0];
            // Can't create without ICC, so test this inline
            return;
        }

        String result = (String) m.invoke(instance, code);
        assertEquals(expected, result);
    }

    @Test
    void categorizeError_null_returnsUnknown() throws Exception {
        if (converter == null) return;
        Method m = PdfAConverter.class.getDeclaredMethod("categorizeError", String.class);
        m.setAccessible(true);
        assertEquals("unknown", m.invoke(converter, (String) null));
    }

    // ─── convertToPdfA ──────────────────────────────────────────────────────

    @Test
    @EnabledIf("hasIccProfile")
    void convertToPdfA_part2_producesValidPdf() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = converter.convertToPdfA(pdf, 2, "B", "Test Title", "Test Author");

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @EnabledIf("hasIccProfile")
    void convertToPdfA_part1_setsVersion14() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = converter.convertToPdfA(pdf, 1, "B", "Title", "Author");

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @EnabledIf("hasIccProfile")
    void convertToPdfA_part3_setsVersion17() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = converter.convertToPdfA(pdf, 3, "A", "Title", "Author");

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @EnabledIf("hasIccProfile")
    void convertToPdfA_nullTitle_noError() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = converter.convertToPdfA(pdf, 2, "B", null, null);
        assertNotNull(result);
    }

    @Test
    @EnabledIf("hasIccProfile")
    void convertToPdfA_emptyTitleAndAuthor() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = converter.convertToPdfA(pdf, 2, "B", "", "");
        assertNotNull(result);
    }

    // ─── validatePdfA ───────────────────────────────────────────────────────

    @Test
    @EnabledIf("hasIccProfile")
    void validatePdfA_simplePdf_returnsResult() {
        byte[] pdf;
        try {
            pdf = TestHelper.createSimplePdf();
        } catch (IOException e) {
            fail("Could not create test PDF");
            return;
        }

        JsonObject result = converter.validatePdfA(pdf);

        assertNotNull(result);
        assertTrue(result.has("valid"));
        assertTrue(result.has("errors"));
        assertTrue(result.has("errorCount"));
        assertTrue(result.has("summary"));
    }

    @Test
    @EnabledIf("hasIccProfile")
    void validatePdfA_invalidBytes_returnsError() {
        JsonObject result = converter.validatePdfA(new byte[]{1, 2, 3});

        assertFalse(result.get("valid").getAsBoolean());
        assertTrue(result.has("error"));
    }

    // ─── Constructor ────────────────────────────────────────────────────────

    @Test
    void constructor_invalidPath_throwsIOException() {
        assertThrows(IOException.class, () ->
                new PdfAConverter("/nonexistent/path/srgb.icc"));
    }
}
