package com.pdfcreator.pdfa;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

public class PdfMergerSplitter {

    /**
     * Merge multiple PDFs into a single PDF.
     *
     * @param pdfBytesList list of PDF byte arrays to merge (in order)
     * @return merged PDF bytes
     */
    public byte[] merge(List<byte[]> pdfBytesList) throws Exception {
        PDFMergerUtility merger = new PDFMergerUtility();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        merger.setDestinationStream(out);

        // PDFBox 3.x addSource requires File, so write to temp files
        List<File> tempFiles = new ArrayList<>();
        try {
            for (byte[] pdfBytes : pdfBytesList) {
                File tmp = Files.createTempFile("pdf-merge-", ".pdf").toFile();
                tmp.deleteOnExit();
                Files.write(tmp.toPath(), pdfBytes);
                merger.addSource(tmp);
                tempFiles.add(tmp);
            }
            merger.mergeDocuments(null);
            return out.toByteArray();
        } finally {
            for (File tmp : tempFiles) {
                tmp.delete();
            }
        }
    }

    /**
     * Split a PDF into individual page PDFs.
     *
     * @param pdfBytes the source PDF bytes
     * @param pages    page numbers to extract (1-based). If null or empty, splits into all individual pages.
     * @return list of PDF byte arrays, one per requested page
     */
    public List<byte[]> split(byte[] pdfBytes, List<Integer> pages) throws Exception {
        List<byte[]> results = new ArrayList<>();

        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            int totalPages = doc.getNumberOfPages();

            List<Integer> targetPages;
            if (pages == null || pages.isEmpty()) {
                targetPages = new ArrayList<>();
                for (int i = 1; i <= totalPages; i++) {
                    targetPages.add(i);
                }
            } else {
                targetPages = pages;
            }

            for (int pageNum : targetPages) {
                if (pageNum < 1 || pageNum > totalPages) {
                    throw new IllegalArgumentException(
                            "Page " + pageNum + " out of range (1-" + totalPages + ")");
                }

                try (PDDocument singlePageDoc = new PDDocument()) {
                    PDPage page = doc.getPage(pageNum - 1);
                    singlePageDoc.importPage(page);

                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    singlePageDoc.save(out);
                    results.add(out.toByteArray());
                }
            }
        }

        return results;
    }
}
