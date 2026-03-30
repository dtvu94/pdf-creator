package com.pdfcreator.pdfa;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Shared test utilities for creating test PDF documents.
 */
public class TestHelper {

    /**
     * Create a simple single-page PDF and return its bytes.
     */
    public static byte[] createSimplePdf() throws IOException {
        return createSimplePdf(1);
    }

    /**
     * Create a simple PDF with the given number of pages.
     */
    public static byte[] createSimplePdf(int pageCount) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            for (int i = 0; i < pageCount; i++) {
                doc.addPage(new PDPage(PDRectangle.A4));
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    /**
     * Create a PDF with text content on the first page.
     */
    public static byte[] createPdfWithText(String text) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (var cs = new org.apache.pdfbox.pdmodel.PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(
                        org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText(text);
                cs.endText();
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    /**
     * Create a PDF with metadata set.
     */
    public static byte[] createPdfWithMetadata(String title, String author) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage(PDRectangle.A4));
            var info = doc.getDocumentInformation();
            if (title != null) info.setTitle(title);
            if (author != null) info.setAuthor(author);
            info.setSubject("Test Subject");
            info.setKeywords("test, pdf");
            info.setCreator("TestCreator");
            info.setProducer("TestProducer");
            info.setCreationDate(java.util.Calendar.getInstance());
            info.setModificationDate(java.util.Calendar.getInstance());
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }
}
