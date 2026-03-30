package com.pdfcreator.pdfa;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class PdfEncryptorTest {

    private PdfEncryptor encryptor;

    @BeforeEach
    void setUp() {
        encryptor = new PdfEncryptor();
    }

    @Test
    void encrypt_128bit_producesEncryptedPdf() throws IOException {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] encrypted = encryptor.encrypt(pdf, "user123", "owner456", 128, 4);

        assertNotNull(encrypted);
        assertTrue(encrypted.length > 0);

        // Verify the PDF is encrypted
        try (PDDocument doc = Loader.loadPDF(encrypted, "user123")) {
            assertTrue(doc.isEncrypted());
        }
    }

    @Test
    void encrypt_256bit_producesEncryptedPdf() throws IOException {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] encrypted = encryptor.encrypt(pdf, "pass", "owner", 256, 4);

        assertNotNull(encrypted);
        assertTrue(encrypted.length > 0);
        try (PDDocument doc = Loader.loadPDF(encrypted, "pass")) {
            assertTrue(doc.isEncrypted());
        }
    }

    @Test
    void encrypt_nullOwnerPassword_usesUserPassword() throws IOException {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] encrypted = encryptor.encrypt(pdf, "test", null, 128, 4);

        assertNotNull(encrypted);
        try (PDDocument doc = Loader.loadPDF(encrypted, "test")) {
            assertTrue(doc.isEncrypted());
        }
    }

    @Test
    void encrypt_differentPermissions() throws IOException {
        byte[] pdf = TestHelper.createSimplePdf();
        // Permissions bitfield 0 = no permissions
        byte[] encrypted = encryptor.encrypt(pdf, "user", "owner", 128, 0);
        assertNotNull(encrypted);
        assertTrue(encrypted.length > 0);
    }

    @Test
    void encrypt_invalidPdfBytes_throwsException() {
        assertThrows(IOException.class, () ->
                encryptor.encrypt(new byte[]{1, 2, 3}, "pass", "pass", 128, 4));
    }

    @Test
    void encrypt_multiPagePdf() throws IOException {
        byte[] pdf = TestHelper.createSimplePdf(5);
        byte[] encrypted = encryptor.encrypt(pdf, "user", "owner", 128, 4);

        try (PDDocument doc = Loader.loadPDF(encrypted, "user")) {
            assertTrue(doc.isEncrypted());
            assertEquals(5, doc.getNumberOfPages());
        }
    }
}
