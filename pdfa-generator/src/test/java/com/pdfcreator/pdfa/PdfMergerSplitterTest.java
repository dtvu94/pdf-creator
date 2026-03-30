package com.pdfcreator.pdfa;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PdfMergerSplitterTest {

    private PdfMergerSplitter mergerSplitter;

    @BeforeEach
    void setUp() {
        mergerSplitter = new PdfMergerSplitter();
    }

    // ─── Merge ───────────────────────────────────────────────────────────────

    @Test
    void merge_twoPdfs_combinedPageCount() throws Exception {
        byte[] pdf1 = TestHelper.createSimplePdf(2);
        byte[] pdf2 = TestHelper.createSimplePdf(3);

        byte[] merged = mergerSplitter.merge(List.of(pdf1, pdf2));
        try (PDDocument doc = Loader.loadPDF(merged)) {
            assertEquals(5, doc.getNumberOfPages());
        }
    }

    @Test
    void merge_singlePdf_returnsSame() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(1);
        byte[] merged = mergerSplitter.merge(List.of(pdf));
        try (PDDocument doc = Loader.loadPDF(merged)) {
            assertEquals(1, doc.getNumberOfPages());
        }
    }

    @Test
    void merge_multiplePdfs() throws Exception {
        byte[] pdf1 = TestHelper.createSimplePdf(1);
        byte[] pdf2 = TestHelper.createSimplePdf(1);
        byte[] pdf3 = TestHelper.createSimplePdf(1);

        byte[] merged = mergerSplitter.merge(List.of(pdf1, pdf2, pdf3));
        try (PDDocument doc = Loader.loadPDF(merged)) {
            assertEquals(3, doc.getNumberOfPages());
        }
    }

    // ─── Split ───────────────────────────────────────────────────────────────

    @Test
    void split_allPages_returnsSameCount() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(3);
        List<byte[]> pages = mergerSplitter.split(pdf, null);

        assertEquals(3, pages.size());
        for (byte[] page : pages) {
            try (PDDocument doc = Loader.loadPDF(page)) {
                assertEquals(1, doc.getNumberOfPages());
            }
        }
    }

    @Test
    void split_emptyPageList_returnsAllPages() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(2);
        List<byte[]> pages = mergerSplitter.split(pdf, List.of());
        assertEquals(2, pages.size());
    }

    @Test
    void split_specificPages() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(5);
        List<byte[]> pages = mergerSplitter.split(pdf, Arrays.asList(1, 3, 5));
        assertEquals(3, pages.size());
    }

    @Test
    void split_singlePage() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf(3);
        List<byte[]> pages = mergerSplitter.split(pdf, List.of(2));
        assertEquals(1, pages.size());
    }

    @Test
    void split_pageOutOfRange_throwsIllegalArgument() {
        assertThrows(IllegalArgumentException.class, () -> {
            byte[] pdf = TestHelper.createSimplePdf(2);
            mergerSplitter.split(pdf, List.of(3));
        });
    }

    @Test
    void split_pageZero_throwsIllegalArgument() {
        assertThrows(IllegalArgumentException.class, () -> {
            byte[] pdf = TestHelper.createSimplePdf(2);
            mergerSplitter.split(pdf, List.of(0));
        });
    }

    @Test
    void split_negativePage_throwsIllegalArgument() {
        assertThrows(IllegalArgumentException.class, () -> {
            byte[] pdf = TestHelper.createSimplePdf(2);
            mergerSplitter.split(pdf, List.of(-1));
        });
    }

    @Test
    void split_invalidBytes_throwsException() {
        assertThrows(Exception.class, () ->
                mergerSplitter.split(new byte[]{1, 2, 3}, null));
    }
}
