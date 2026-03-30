package com.pdfcreator.pdfa;

import com.google.gson.JsonObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PdfMetadataExtractorTest {

    private PdfMetadataExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new PdfMetadataExtractor();
    }

    @Test
    void extractMetadata_simplePdf_returnsSuccess() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        JsonObject result = extractor.extractMetadata(pdf);

        assertTrue(result.get("success").getAsBoolean());
        assertEquals(1, result.get("pageCount").getAsInt());
        assertNotNull(result.get("pdfVersion").getAsString());
        assertTrue(result.has("metadata"));
        assertTrue(result.has("properties"));
    }

    @Test
    void extractMetadata_withMetadata_extractsFields() throws Exception {
        byte[] pdf = TestHelper.createPdfWithMetadata("Test Title", "Test Author");
        JsonObject result = extractor.extractMetadata(pdf);

        assertTrue(result.get("success").getAsBoolean());
        JsonObject metadata = result.getAsJsonObject("metadata");
        assertEquals("Test Title", metadata.get("title").getAsString());
        assertEquals("Test Author", metadata.get("author").getAsString());
        assertEquals("Test Subject", metadata.get("subject").getAsString());
        assertEquals("test, pdf", metadata.get("keywords").getAsString());
        assertEquals("TestCreator", metadata.get("creator").getAsString());
        assertEquals("TestProducer", metadata.get("producer").getAsString());
        assertTrue(metadata.has("creationDate"));
        assertTrue(metadata.has("modificationDate"));
    }

    @Test
    void extractMetadata_multiplePages_correctCount() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(5);
        JsonObject result = extractor.extractMetadata(pdf);

        assertEquals(5, result.get("pageCount").getAsInt());
    }

    @Test
    void extractMetadata_unencryptedPdf_encryptedFalse() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        JsonObject result = extractor.extractMetadata(pdf);

        JsonObject props = result.getAsJsonObject("properties");
        assertFalse(props.get("encrypted").getAsBoolean());
    }

    @Test
    void extractMetadata_noMetadata_emptyMetadataObject() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        JsonObject result = extractor.extractMetadata(pdf);

        JsonObject metadata = result.getAsJsonObject("metadata");
        assertNotNull(metadata);
        // No title/author set, so those fields should be absent
        assertFalse(metadata.has("title"));
        assertFalse(metadata.has("author"));
    }

    @Test
    void extractMetadata_invalidBytes_throwsException() {
        assertThrows(Exception.class, () ->
                extractor.extractMetadata(new byte[]{1, 2, 3}));
    }
}
