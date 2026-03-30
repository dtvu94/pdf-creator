package com.pdfcreator.pdfa;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PdfWatermarkerTest {

    private PdfWatermarker watermarker;

    @BeforeEach
    void setUp() {
        watermarker = new PdfWatermarker();
    }

    @Test
    void addTextWatermark_allPages_producesValidPdf() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(2);
        byte[] result = watermarker.addTextWatermark(pdf, "DRAFT", 60, 45, 0.3f, "#FF0000", null);

        assertNotNull(result);
        try (PDDocument doc = Loader.loadPDF(result)) {
            assertEquals(2, doc.getNumberOfPages());
        }
    }

    @Test
    void addTextWatermark_specificPages() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(3);
        byte[] result = watermarker.addTextWatermark(pdf, "CONFIDENTIAL", 60, 45, 0.3f,
                "#888888", List.of(1, 3));

        assertNotNull(result);
        try (PDDocument doc = Loader.loadPDF(result)) {
            assertEquals(3, doc.getNumberOfPages());
        }
    }

    @Test
    void addTextWatermark_emptyPagesList_watermarksAllPages() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(2);
        byte[] result = watermarker.addTextWatermark(pdf, "TEST", 60, 45, 0.5f,
                "#0000FF", List.of());

        assertNotNull(result);
        try (PDDocument doc = Loader.loadPDF(result)) {
            assertEquals(2, doc.getNumberOfPages());
        }
    }

    @Test
    void addTextWatermark_defaultColor_whenNullHex() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = watermarker.addTextWatermark(pdf, "DRAFT", 60, 0, 0.3f, null, null);
        assertNotNull(result);
    }

    @Test
    void addTextWatermark_defaultColor_whenEmptyHex() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = watermarker.addTextWatermark(pdf, "DRAFT", 60, 0, 0.3f, "", null);
        assertNotNull(result);
    }

    @Test
    void addTextWatermark_invalidHexLength_usesDefault() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = watermarker.addTextWatermark(pdf, "DRAFT", 60, 0, 0.3f, "#12345", null);
        assertNotNull(result);
    }

    @Test
    void addTextWatermark_zeroRotation() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = watermarker.addTextWatermark(pdf, "DRAFT", 40, 0, 0.5f, "#FF0000", null);
        assertNotNull(result);
    }

    @Test
    void addTextWatermark_fullOpacity() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] result = watermarker.addTextWatermark(pdf, "VISIBLE", 60, 45, 1.0f, "#000000", null);
        assertNotNull(result);
    }

    @Test
    void addTextWatermark_invalidBytes_throwsException() {
        assertThrows(Exception.class, () ->
                watermarker.addTextWatermark(new byte[]{1, 2, 3}, "TEST", 60, 45, 0.3f, "#888888", null));
    }

    // ── Image watermark tests ───────────────────────────────────────────────

    @Test
    void addImageWatermark_allPages_producesValidPdf() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(2);
        byte[] image = createTestPng();
        byte[] result = watermarker.addImageWatermark(pdf, image, 100, 100, 200, 200, 0.3f, null);

        assertNotNull(result);
        try (PDDocument doc = Loader.loadPDF(result)) {
            assertEquals(2, doc.getNumberOfPages());
        }
    }

    @Test
    void addImageWatermark_specificPages() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(3);
        byte[] image = createTestPng();
        byte[] result = watermarker.addImageWatermark(pdf, image, 50, 50, 100, 100, 0.5f, List.of(1, 3));

        assertNotNull(result);
        try (PDDocument doc = Loader.loadPDF(result)) {
            assertEquals(3, doc.getNumberOfPages());
        }
    }

    @Test
    void addImageWatermark_emptyPagesList_watermarksAllPages() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(2);
        byte[] image = createTestPng();
        byte[] result = watermarker.addImageWatermark(pdf, image, 0, 0, 50, 50, 0.5f, List.of());

        assertNotNull(result);
        try (PDDocument doc = Loader.loadPDF(result)) {
            assertEquals(2, doc.getNumberOfPages());
        }
    }

    @Test
    void addImageWatermark_centerPosition_negativeCoords() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] image = createTestPng();
        // Negative x and y should center the image
        byte[] result = watermarker.addImageWatermark(pdf, image, -1, -1, 100, 100, 0.3f, null);
        assertNotNull(result);
    }

    @Test
    void addImageWatermark_zeroSize_usesOriginalDimensions() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] image = createTestPng();
        // width=0, height=0 should use the original image dimensions
        byte[] result = watermarker.addImageWatermark(pdf, image, 50, 50, 0, 0, 0.5f, null);
        assertNotNull(result);
    }

    @Test
    void addImageWatermark_fullOpacity() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] image = createTestPng();
        byte[] result = watermarker.addImageWatermark(pdf, image, 0, 0, 200, 200, 1.0f, null);
        assertNotNull(result);
    }

    @Test
    void addImageWatermark_invalidPdfBytes_throwsException() {
        byte[] image = createTestPng();
        assertThrows(Exception.class, () ->
                watermarker.addImageWatermark(new byte[]{1, 2, 3}, image, 0, 0, 100, 100, 0.3f, null));
    }

    /**
     * Creates a minimal valid PNG image for testing.
     */
    private byte[] createTestPng() {
        try {
            java.awt.image.BufferedImage img = new java.awt.image.BufferedImage(10, 10, java.awt.image.BufferedImage.TYPE_INT_RGB);
            java.awt.Graphics2D g = img.createGraphics();
            g.setColor(java.awt.Color.RED);
            g.fillRect(0, 0, 10, 10);
            g.dispose();
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(img, "PNG", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
