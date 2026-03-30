package com.pdfcreator.pdfa;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.common.PDMetadata;
import org.apache.pdfbox.pdmodel.graphics.color.PDOutputIntent;
import org.apache.pdfbox.preflight.PreflightDocument;
import org.apache.pdfbox.preflight.ValidationResult;
import org.apache.pdfbox.preflight.parser.PreflightParser;
import org.apache.xmpbox.XMPMetadata;
import org.apache.xmpbox.schema.DublinCoreSchema;
import org.apache.xmpbox.schema.PDFAIdentificationSchema;
import org.apache.xmpbox.schema.XMPBasicSchema;
import org.apache.xmpbox.xml.XmpSerializer;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.logging.Logger;

public class PdfAConverter {

    private static final Logger LOG = Logger.getLogger(PdfAConverter.class.getName());

    private final byte[] iccProfileData;

    public PdfAConverter(String iccProfilePath) throws IOException {
        this.iccProfileData = Files.readAllBytes(Path.of(iccProfilePath));
        LOG.info("Loaded ICC profile: " + iccProfilePath + " (" + iccProfileData.length + " bytes)");
    }

    /**
     * Convert a PDF to PDF/A.
     *
     * @param pdfBytes    the source PDF bytes
     * @param part        PDF/A part: 1, 2, or 3
     * @param conformance conformance level: "A", "B", or "U"
     * @param title       document title for metadata
     * @param author      document author for metadata
     * @return the converted PDF/A bytes
     */
    public byte[] convertToPdfA(byte[] pdfBytes, int part, String conformance,
                                String title, String author) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {

            // Remove encryption if present
            doc.setAllSecurityToBeRemoved(true);

            PDDocumentCatalog catalog = doc.getDocumentCatalog();

            // --- 1. Set document information ---
            PDDocumentInformation info = doc.getDocumentInformation();
            if (title != null && !title.isEmpty()) info.setTitle(title);
            if (author != null && !author.isEmpty()) info.setAuthor(author);
            info.setProducer("pdfa-generator (Apache PDFBox)");
            info.setCreationDate(Calendar.getInstance());
            info.setModificationDate(Calendar.getInstance());

            // --- 2. Build XMP metadata ---
            XMPMetadata xmp = XMPMetadata.createXMPMetadata();

            // PDF/A identification
            PDFAIdentificationSchema pdfaIdSchema = xmp.createAndAddPDFAIdentificationSchema();
            pdfaIdSchema.setPart(part);
            pdfaIdSchema.setConformance(conformance);

            // Dublin Core
            DublinCoreSchema dcSchema = xmp.createAndAddDublinCoreSchema();
            if (title != null && !title.isEmpty()) dcSchema.setTitle(title);
            if (author != null && !author.isEmpty()) dcSchema.addCreator(author);

            // XMP Basic
            XMPBasicSchema basicSchema = xmp.createAndAddXMPBasicSchema();
            basicSchema.setCreateDate(Calendar.getInstance());
            basicSchema.setModifyDate(Calendar.getInstance());
            basicSchema.setCreatorTool("pdfa-generator");

            // Serialize XMP to bytes
            XmpSerializer serializer = new XmpSerializer();
            ByteArrayOutputStream xmpOut = new ByteArrayOutputStream();
            serializer.serialize(xmp, xmpOut, true);

            PDMetadata metadata = new PDMetadata(doc);
            metadata.importXMPMetadata(xmpOut.toByteArray());
            catalog.setMetadata(metadata);

            // --- 4. Add ICC output intent (sRGB) ---
            if (catalog.getOutputIntents().isEmpty()) {
                InputStream iccStream = new ByteArrayInputStream(iccProfileData);
                PDOutputIntent outputIntent = new PDOutputIntent(doc, iccStream);
                outputIntent.setInfo("sRGB IEC61966-2.1");
                outputIntent.setOutputCondition("sRGB IEC61966-2.1");
                outputIntent.setOutputConditionIdentifier("sRGB IEC61966-2.1");
                outputIntent.setRegistryName("http://www.color.org");
                catalog.addOutputIntent(outputIntent);
            }

            // --- 5. Mark catalog version ---
            if (part == 1) {
                doc.setVersion(1.4f);
            } else if (part >= 2) {
                doc.setVersion(1.7f);
            }

            // --- 6. Ensure MarkInfo is set (tagged PDF for accessibility) ---
            if (catalog.getMarkInfo() == null) {
                catalog.getCOSObject().setBoolean(COSName.getPDFName("MarkInfo"), true);
            }

            // --- 7. Save ---
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    // ─── Validation ──────────────────────────────────────────────────────────

    /**
     * Validate a PDF against PDF/A using PDFBox Preflight.
     */
    public JsonObject validatePdfA(byte[] pdfBytes) {
        JsonObject result = new JsonObject();
        try {
            PreflightParser parser = new PreflightParser(
                    new org.apache.pdfbox.io.RandomAccessReadBuffer(pdfBytes));
            PDDocument parsed = parser.parse();
            PreflightDocument preflightDoc = (PreflightDocument) parsed;
            ValidationResult validationResult = preflightDoc.validate();

            result.addProperty("valid", validationResult.isValid());

            JsonArray errors = new JsonArray();
            Map<String, Integer> categoryCounts = new LinkedHashMap<>();

            for (ValidationResult.ValidationError error : validationResult.getErrorsList()) {
                JsonObject e = new JsonObject();
                e.addProperty("code", error.getErrorCode());
                e.addProperty("details", error.getDetails());

                // Categorize by error code prefix
                String category = categorizeError(error.getErrorCode());
                e.addProperty("category", category);

                if (error.getPageNumber() != null) {
                    e.addProperty("page", error.getPageNumber());
                }

                errors.add(e);

                categoryCounts.merge(category, 1, Integer::sum);
            }
            result.add("errors", errors);
            result.addProperty("errorCount", errors.size());

            // Summary by category
            JsonObject summary = new JsonObject();
            for (Map.Entry<String, Integer> entry : categoryCounts.entrySet()) {
                summary.addProperty(entry.getKey(), entry.getValue());
            }
            result.add("summary", summary);

            preflightDoc.close();
        } catch (Exception e) {
            result.addProperty("valid", false);
            result.addProperty("error", e.getMessage());
        }
        return result;
    }

    /**
     * Categorize a preflight error code into a human-readable category.
     */
    private String categorizeError(String errorCode) {
        if (errorCode == null) return "unknown";
        if (errorCode.startsWith("1")) return "syntax";
        if (errorCode.startsWith("2.1") || errorCode.startsWith("2.2")) return "graphics";
        if (errorCode.startsWith("2.3")) return "transparency";
        if (errorCode.startsWith("2.4")) return "color";
        if (errorCode.startsWith("3")) return "font";
        if (errorCode.startsWith("4")) return "metadata";
        if (errorCode.startsWith("5")) return "annotation";
        if (errorCode.startsWith("6")) return "action";
        if (errorCode.startsWith("7")) return "structure";
        return "other";
    }
}
