package com.pdfcreator.pdfa.generator;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.destination.PDPageFitDestination;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDDocumentOutline;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDOutlineItem;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static com.pdfcreator.pdfa.generator.PdfElementRenderer.*;

/**
 * Handles page-level layout concerns:
 * - Page size resolution (A4, A3, A5)
 * - Header/footer as fixed sections
 * - Body element rendering (absolute + flow mode)
 * - Flow mode page overflow for auto-tables and repeaters
 * - Watermark rendering
 */
public class PdfPageLayout {

    private final PDDocument document;
    private final PdfElementRenderer renderer;
    private final String pageSize;

    /** Tracks bookmarks: each entry maps a bookmark title to the first physical page created for that template page. */
    private final List<BookmarkEntry> bookmarks = new ArrayList<>();

    public PdfPageLayout(PDDocument document, PdfElementRenderer renderer, String pageSize) {
        this.document = document;
        this.renderer = renderer;
        this.pageSize = pageSize;
    }

    /**
     * Build the PDF document outline from collected bookmarks and attach it to the document.
     * Call this after all pages have been rendered.
     */
    public void buildDocumentOutline() {
        if (bookmarks.isEmpty()) return;

        PDDocumentOutline outline = new PDDocumentOutline();
        for (BookmarkEntry entry : bookmarks) {
            PDOutlineItem item = new PDOutlineItem();
            item.setTitle(entry.title);
            PDPageFitDestination dest = new PDPageFitDestination();
            dest.setPage(entry.page);
            item.setDestination(dest);
            outline.addLast(item);
        }
        document.getDocumentCatalog().setDocumentOutline(outline);
    }

    /**
     * Resolve page size string to PDRectangle.
     */
    public PDRectangle getPageDimensions() {
        return switch (pageSize) {
            case "A3" -> PDRectangle.A3;
            case "A5" -> PDRectangle.A5;
            default -> PDRectangle.A4;
        };
    }

    /**
     * Render a single template page.
     * Handles header/footer sections and both absolute and flow layout modes.
     *
     * @param templatePage the page JSON from the template
     * @param pageNumber   1-based page number
     * @param totalPages   total page count
     * @param watermark    watermark config (may be null)
     */
    public void renderPage(JsonObject templatePage, int pageNumber, int totalPages,
                           JsonObject watermark) throws IOException {
        PDRectangle dims = getPageDimensions();
        float pageWidth = dims.getWidth();
        float pageHeight = dims.getHeight();

        String bookmark = templatePage.has("bookmark") && !templatePage.get("bookmark").isJsonNull()
                ? templatePage.get("bookmark").getAsString() : null;

        JsonObject header = templatePage.has("header") && !templatePage.get("header").isJsonNull()
                ? templatePage.getAsJsonObject("header") : null;
        JsonObject footer = templatePage.has("footer") && !templatePage.get("footer").isJsonNull()
                ? templatePage.getAsJsonObject("footer") : null;
        JsonArray elements = templatePage.getAsJsonArray("elements");

        float headerHeight = header != null ? getFloat(header, "height", 0) : 0;
        float footerHeight = footer != null ? getFloat(footer, "height", 0) : 0;

        boolean hasFlowElements = hasFlowElements(elements);
        boolean useFlowLayout = header != null || footer != null || hasFlowElements;

        if (!useFlowLayout) {
            // Simple absolute layout — single page
            PDPage page = new PDPage(dims);
            document.addPage(page);

            if (bookmark != null && !bookmark.isEmpty()) {
                bookmarks.add(new BookmarkEntry(bookmark, page));
            }

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                // Background
                cs.setNonStrokingColor(java.awt.Color.WHITE);
                cs.addRect(0, 0, pageWidth, pageHeight);
                cs.fill();

                // Render all elements with absolute positioning
                if (elements != null) {
                    for (JsonElement elJson : elements) {
                        renderer.renderElement(cs, elJson.getAsJsonObject(), pageHeight,
                                0, 0, pageNumber, totalPages);
                    }
                }

                // Watermark
                renderWatermarkIfNeeded(cs, watermark, pageNumber, pageHeight);
            }
        } else {
            // Flow layout with potential page overflow
            renderFlowLayout(elements, header, footer, headerHeight, footerHeight,
                    pageWidth, pageHeight, pageNumber, totalPages, watermark, dims, bookmark);
        }
    }

    /**
     * Flow layout: renders elements that may overflow across multiple physical pages.
     * Auto-tables and repeaters use flow positioning; other elements use absolute.
     */
    private void renderFlowLayout(JsonArray elements, JsonObject header, JsonObject footer,
                                  float headerHeight, float footerHeight,
                                  float pageWidth, float pageHeight,
                                  int pageNumber, int totalPages,
                                  JsonObject watermark, PDRectangle dims,
                                  String bookmark) throws IOException {
        float bodyTop = headerHeight;
        float bodyBottom = pageHeight - footerHeight;
        float bodyHeight = bodyBottom - bodyTop;

        // Collect flow elements and their heights
        List<FlowItem> flowItems = new ArrayList<>();
        if (elements != null) {
            for (JsonElement elJson : elements) {
                JsonObject el = elJson.getAsJsonObject();
                String type = getString(el, "type", "");
                boolean isAutoTable = "table".equals(type) && "auto".equals(getString(el, "mode", "manual"));
                boolean isRepeater = "repeater".equals(type);

                if (isAutoTable || isRepeater) {
                    float h = isAutoTable
                            ? renderer.calculateTableHeight(el)
                            : renderer.calculateRepeaterHeight(el);
                    flowItems.add(new FlowItem(el, true, h));
                } else {
                    flowItems.add(new FlowItem(el, false, 0));
                }
            }
        }

        // Separate absolute elements from flow elements
        List<FlowItem> absoluteItems = new ArrayList<>();
        List<FlowItem> flowOnlyItems = new ArrayList<>();
        for (FlowItem item : flowItems) {
            if (item.isFlow) {
                flowOnlyItems.add(item);
            } else {
                absoluteItems.add(item);
            }
        }

        // For flow mode, we render absolute elements on the first physical page,
        // and flow elements may span multiple pages.
        // Calculate how many physical pages we need for flow content
        List<FlowPageContent> pages = paginateFlowItems(flowOnlyItems, bodyHeight);

        // Ensure at least one page
        if (pages.isEmpty()) {
            pages.add(new FlowPageContent());
        }

        for (int physIdx = 0; physIdx < pages.size(); physIdx++) {
            PDPage page = new PDPage(dims);
            document.addPage(page);

            // Bookmark points to the first physical page of this template page
            if (physIdx == 0 && bookmark != null && !bookmark.isEmpty()) {
                bookmarks.add(new BookmarkEntry(bookmark, page));
            }

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                // Background
                cs.setNonStrokingColor(java.awt.Color.WHITE);
                cs.addRect(0, 0, pageWidth, pageHeight);
                cs.fill();

                // Header
                if (header != null) {
                    JsonArray headerElements = header.getAsJsonArray("elements");
                    if (headerElements != null) {
                        for (JsonElement hEl : headerElements) {
                            renderer.renderElement(cs, hEl.getAsJsonObject(), pageHeight,
                                    0, 0, pageNumber, totalPages);
                        }
                    }
                }

                // Footer
                if (footer != null) {
                    float footerOffsetY = pageHeight - footerHeight;
                    JsonArray footerElements = footer.getAsJsonArray("elements");
                    if (footerElements != null) {
                        for (JsonElement fEl : footerElements) {
                            renderer.renderElement(cs, fEl.getAsJsonObject(), pageHeight,
                                    0, footerOffsetY, pageNumber, totalPages);
                        }
                    }
                }

                // Absolute elements (only on first physical page)
                if (physIdx == 0) {
                    for (FlowItem item : absoluteItems) {
                        renderer.renderElement(cs, item.element, pageHeight,
                                0, headerHeight, pageNumber, totalPages);
                    }
                }

                // Flow elements for this page
                FlowPageContent pageContent = pages.get(physIdx);
                float flowY = headerHeight;
                for (FlowItem item : pageContent.items) {
                    // For flow items, use flowY as Y instead of the element's stored Y
                    JsonObject flowEl = item.element.deepCopy();
                    flowEl.addProperty("y", 0);
                    renderer.renderElement(cs, flowEl, pageHeight,
                            0, flowY, pageNumber, totalPages);
                    flowY += item.height;
                }

                // Watermark
                renderWatermarkIfNeeded(cs, watermark, pageNumber, pageHeight);
            }
        }
    }

    /**
     * Paginate flow items across pages based on available body height.
     */
    private List<FlowPageContent> paginateFlowItems(List<FlowItem> flowItems, float bodyHeight) {
        List<FlowPageContent> pages = new ArrayList<>();
        FlowPageContent currentPage = new FlowPageContent();
        float currentHeight = 0;

        for (FlowItem item : flowItems) {
            if (currentHeight + item.height > bodyHeight && !currentPage.items.isEmpty()) {
                // Start new page
                pages.add(currentPage);
                currentPage = new FlowPageContent();
                currentHeight = 0;
            }
            currentPage.items.add(item);
            currentHeight += item.height;
        }

        if (!currentPage.items.isEmpty()) {
            pages.add(currentPage);
        }

        return pages;
    }

    private boolean hasFlowElements(JsonArray elements) {
        if (elements == null) return false;
        for (JsonElement elJson : elements) {
            JsonObject el = elJson.getAsJsonObject();
            String type = getString(el, "type", "");
            if ("repeater".equals(type)) return true;
            if ("table".equals(type) && "auto".equals(getString(el, "mode", "manual"))) return true;
        }
        return false;
    }

    private void renderWatermarkIfNeeded(PDPageContentStream cs, JsonObject watermark,
                                         int pageNumber, float pageHeight) throws IOException {
        if (watermark == null) return;
        if (!getBool(watermark, "enabled", false)) return;

        // Check page filter
        if (watermark.has("pages")) {
            JsonElement pagesEl = watermark.get("pages");
            if (pagesEl.isJsonPrimitive() && "all".equals(pagesEl.getAsString())) {
                // Render on all pages
            } else if (pagesEl.isJsonArray()) {
                JsonArray pagesList = pagesEl.getAsJsonArray();
                boolean found = false;
                for (JsonElement p : pagesList) {
                    if (p.getAsInt() == pageNumber) {
                        found = true;
                        break;
                    }
                }
                if (!found) return;
            }
        }

        renderer.renderImageWatermark(cs, watermark, pageHeight);
    }

    // ─── Internal types ──────────────────────────────────────────────────────

    private static class FlowItem {
        final JsonObject element;
        final boolean isFlow;
        final float height;

        FlowItem(JsonObject element, boolean isFlow, float height) {
            this.element = element;
            this.isFlow = isFlow;
            this.height = height;
        }
    }

    private static class FlowPageContent {
        final List<FlowItem> items = new ArrayList<>();
    }

    private static class BookmarkEntry {
        final String title;
        final PDPage page;

        BookmarkEntry(String title, PDPage page) {
            this.title = title;
            this.page = page;
        }
    }
}
