package com.pdfcreator.pdfa;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

public class PdfTextExtractor {

    /**
     * Extract text from a PDF, optionally for specific pages.
     *
     * @param pdfBytes  the source PDF bytes
     * @param startPage start page (1-based, inclusive). 0 or less means page 1.
     * @param endPage   end page (1-based, inclusive). 0 or less means last page.
     * @param perPage   if true, return text per page; if false, return all text combined
     * @return JSON object with extracted text
     */
    public JsonObject extractText(byte[] pdfBytes, int startPage, int endPage, boolean perPage) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            int totalPages = doc.getNumberOfPages();

            if (startPage <= 0) startPage = 1;
            if (endPage <= 0 || endPage > totalPages) endPage = totalPages;

            JsonObject result = new JsonObject();
            result.addProperty("totalPages", totalPages);

            PDFTextStripper stripper = new PDFTextStripper();

            if (perPage) {
                JsonArray pagesArray = new JsonArray();
                for (int i = startPage; i <= endPage; i++) {
                    stripper.setStartPage(i);
                    stripper.setEndPage(i);
                    String text = stripper.getText(doc);

                    JsonObject pageObj = new JsonObject();
                    pageObj.addProperty("page", i);
                    pageObj.addProperty("text", text.trim());
                    pagesArray.add(pageObj);
                }
                result.add("pages", pagesArray);
            } else {
                stripper.setStartPage(startPage);
                stripper.setEndPage(endPage);
                String text = stripper.getText(doc);
                result.addProperty("text", text.trim());
            }

            result.addProperty("success", true);
            return result;
        }
    }
}
