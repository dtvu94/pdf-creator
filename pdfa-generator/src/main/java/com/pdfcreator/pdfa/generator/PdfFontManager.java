package com.pdfcreator.pdfa.generator;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Manages font loading for PDF generation.
 * Loads bundled TTF fonts from a configured directory and custom uploaded fonts.
 */
public class PdfFontManager {

    private static final Logger LOG = Logger.getLogger(PdfFontManager.class.getName());

    /** Key: "family|weight|style" e.g. "Roboto|bold|normal" */
    private final Map<String, PDFont> loadedFonts = new HashMap<>();

    private final PDDocument document;
    private final String bundledFontDir;
    private final String uploadFontDir;

    /** Fallback font when requested font not found. */
    private PDFont fallbackFont;

    /**
     * Bundled font file mapping: family name → TTF file prefix.
     * Matches the Next.js bundled font layout.
     */
    private static final Map<String, String> BUNDLED_PREFIX_MAP = Map.of(
            "Open Sans", "OpenSans",
            "Roboto", "Roboto",
            "Calibri", "Calibri",
            "Lato", "Lato",
            "Inter", "Inter",
            "Verdana", "Verdana",
            "Arial", "Calibri",             // Arial uses Calibri TTFs
            "Times New Roman", "TimesNewRoman", // uses Liberation Serif TTFs
            "Georgia", "Georgia"            // uses Noto Serif TTFs
    );

    private static final Map<String, String> WEIGHT_STYLE_SUFFIX = Map.of(
            "normal|normal", "-Regular",
            "bold|normal", "-Bold",
            "normal|italic", "-Italic",
            "bold|italic", "-BoldItalic"
    );

    public PdfFontManager(PDDocument document, String bundledFontDir, String uploadFontDir) {
        this.document = document;
        this.bundledFontDir = bundledFontDir;
        this.uploadFontDir = uploadFontDir;
    }

    /**
     * Register all bundled fonts and any custom fonts declared in the template.
     */
    public void registerFonts(JsonArray fonts) throws IOException {
        // Always register all bundled fonts
        for (Map.Entry<String, String> entry : BUNDLED_PREFIX_MAP.entrySet()) {
            String family = entry.getKey();
            String prefix = entry.getValue();
            for (Map.Entry<String, String> ws : WEIGHT_STYLE_SUFFIX.entrySet()) {
                String suffix = ws.getValue();
                String filename = prefix + suffix + ".ttf";
                Path fontPath = Path.of(bundledFontDir, filename);
                if (Files.exists(fontPath)) {
                    String key = makeKey(family, ws.getKey());
                    if (!loadedFonts.containsKey(key)) {
                        try (InputStream is = Files.newInputStream(fontPath)) {
                            PDFont font = PDType0Font.load(document, is);
                            loadedFonts.put(key, font);
                        }
                    }
                }
            }
        }

        // Register custom (uploaded) fonts from template
        if (fonts != null) {
            for (JsonElement fe : fonts) {
                JsonObject fontObj = fe.getAsJsonObject();
                String family = fontObj.get("family").getAsString();
                if (BUNDLED_PREFIX_MAP.containsKey(family)) continue;

                JsonArray faces = fontObj.getAsJsonArray("faces");
                if (faces == null) continue;

                for (JsonElement faceEl : faces) {
                    JsonObject face = faceEl.getAsJsonObject();
                    String weight = face.has("weight") ? face.get("weight").getAsString() : "normal";
                    String style = face.has("style") ? face.get("style").getAsString() : "normal";
                    String source = face.has("source") ? face.get("source").getAsString() : "bundled";
                    String ref = face.get("ref").getAsString();

                    String key = makeKey(family, weight + "|" + style);
                    if (loadedFonts.containsKey(key)) continue;

                    Path fontPath;
                    if ("bundled".equals(source)) {
                        fontPath = Path.of(bundledFontDir, ref);
                    } else {
                        fontPath = resolveUploadedFont(ref);
                    }

                    if (fontPath != null && Files.exists(fontPath)) {
                        try (InputStream is = Files.newInputStream(fontPath)) {
                            PDFont font = PDType0Font.load(document, is);
                            loadedFonts.put(key, font);
                        }
                    } else {
                        LOG.warning("Font file not found: " + ref + " for " + family);
                    }
                }
            }
        }

        // Set fallback
        fallbackFont = loadedFonts.getOrDefault(
                makeKey("Roboto", "normal|normal"),
                new PDType1Font(Standard14Fonts.FontName.HELVETICA)
        );
    }

    /**
     * Get a font for the given family, weight, and style.
     * Falls back gracefully: try exact match → same family normal → fallback.
     */
    public PDFont getFont(String family, boolean bold, boolean italic) {
        String weight = bold ? "bold" : "normal";
        String style = italic ? "italic" : "normal";
        String key = makeKey(family, weight + "|" + style);

        PDFont font = loadedFonts.get(key);
        if (font != null) return font;

        // Try without italic
        if (italic) {
            font = loadedFonts.get(makeKey(family, weight + "|normal"));
            if (font != null) return font;
        }

        // Try regular weight
        if (bold) {
            font = loadedFonts.get(makeKey(family, "normal|" + style));
            if (font != null) return font;
        }

        // Try family regular
        font = loadedFonts.get(makeKey(family, "normal|normal"));
        if (font != null) return font;

        return fallbackFont;
    }

    /**
     * Convenience: get font for default family with weight/style.
     */
    public PDFont getFont(String family) {
        return getFont(family, false, false);
    }

    public PDFont getFallbackFont() {
        return fallbackFont;
    }

    private Path resolveUploadedFont(String ref) {
        if (uploadFontDir == null) return null;
        File dir = new File(uploadFontDir);
        if (!dir.exists()) return null;

        // Try exact match first
        Path exact = Path.of(uploadFontDir, ref);
        if (Files.exists(exact)) return exact;

        // Try with extensions
        File[] files = dir.listFiles((d, name) -> name.equals(ref) || name.startsWith(ref + "."));
        if (files != null && files.length > 0) {
            return files[0].toPath();
        }
        return null;
    }

    private static String makeKey(String family, String weightStyle) {
        return family + "|" + weightStyle;
    }
}
