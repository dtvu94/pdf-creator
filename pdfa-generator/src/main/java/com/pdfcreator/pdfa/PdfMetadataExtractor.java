package com.pdfcreator.pdfa;

import com.google.gson.JsonObject;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;

import java.text.SimpleDateFormat;
import java.util.Calendar;
public class PdfMetadataExtractor {
    private static final SimpleDateFormat ISO_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");

    /**
     * Extract metadata from a PDF document.
     *
     * @param pdfBytes the source PDF bytes
     * @return JSON object with metadata fields
     */
    public JsonObject extractMetadata(byte[] pdfBytes) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDDocumentInformation info = doc.getDocumentInformation();

            JsonObject result = new JsonObject();
            result.addProperty("success", true);
            result.addProperty("pageCount", doc.getNumberOfPages());
            result.addProperty("pdfVersion", String.valueOf(doc.getVersion()));

            JsonObject metadata = new JsonObject();
            addIfPresent(metadata, "title", info.getTitle());
            addIfPresent(metadata, "author", info.getAuthor());
            addIfPresent(metadata, "subject", info.getSubject());
            addIfPresent(metadata, "keywords", info.getKeywords());
            addIfPresent(metadata, "creator", info.getCreator());
            addIfPresent(metadata, "producer", info.getProducer());
            addDateIfPresent(metadata, "creationDate", info.getCreationDate());
            addDateIfPresent(metadata, "modificationDate", info.getModificationDate());
            addIfPresent(metadata, "trapped", info.getTrapped());

            result.add("metadata", metadata);

            // Document properties
            JsonObject properties = new JsonObject();
            properties.addProperty("encrypted", doc.isEncrypted());

            result.add("properties", properties);

            return result;
        }
    }

    private void addIfPresent(JsonObject obj, String key, String value) {
        if (value != null && !value.isEmpty()) {
            obj.addProperty(key, value);
        }
    }

    private void addDateIfPresent(JsonObject obj, String key, Calendar cal) {
        if (cal != null) {
            obj.addProperty(key, ISO_FORMAT.format(cal.getTime()));
        }
    }
}
