# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
mvn clean package              # Build fat JAR (target/pdfa-generator-1.0.0.jar)
mvn test                       # Run JUnit 5 tests (JaCoCo enforces >95% coverage)
mvn test jacoco:report         # Tests + HTML coverage report (target/site/jacoco/index.html)
mvn test -Dtest=PdfSignerTest  # Run a single test class
./run.sh                       # Build if needed, then start on port 8090
```

## Architecture

Standalone Java 17 microservice using `com.sun.net.httpserver` (no Spring/JAX-RS). All dependencies bundled into a fat JAR via Maven Shade. Core libraries: Apache PDFBox 3.0.4, BouncyCastle 1.79, Gson 2.11.0.

### Entry point

`App.java` creates an HTTP server with a fixed thread pool (sized to CPU count), instantiates all service classes as static singletons, and registers 12 endpoint handlers.

### API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Health check |
| `POST /api/generate` | Generate PDF from template JSON (same schema as pdf-creator editor) |
| `POST /api/convert-to-pdfa` | PDF/A conversion (part 1/2/3, conformance A/B/U) |
| `POST /api/validate-pdfa` | Validate PDF/A compliance with categorized errors |
| `POST /api/sign` | Digital signature (PKCS#12/JKS keystore, PKCS#7 detached) |
| `POST /api/encrypt` | Password encryption (AES-128/256, permissions bitmap) |
| `POST /api/merge` | Merge multiple PDFs |
| `POST /api/split` | Split PDF by page ranges |
| `POST /api/extract-text` | Extract text (combined or per-page) |
| `POST /api/extract-metadata` | Extract metadata (title, author, dates, PDF version) |
| `POST /api/text-watermark` | Rotated text watermark |
| `POST /api/image-watermark` | Positioned image watermark |

All endpoints use **base64-encoded PDF** in JSON request/response bodies. The `/api/generate` endpoint also supports `Accept: application/pdf` for binary response.

### Service classes (`com.pdfcreator.pdfa`)

| Class | Responsibility |
|---|---|
| `PdfAConverter` | PDF/A conversion via XMP metadata + ICC output intent; validation via PDFBox Preflight with error categorization |
| `PdfSigner` | BouncyCastle CMS signing, appended as incremental update |
| `PdfEncryptor` | `StandardProtectionPolicy` with BouncyCastle AES provider |
| `PdfMergerSplitter` | `PDFMergerUtility` for merge; per-page import for split (uses temp files for PDFBox 3.x compat) |
| `PdfTextExtractor` | `PDFTextStripper` with page ranges |
| `PdfMetadataExtractor` | Document info + page count + PDF version + encryption status |
| `PdfWatermarker` | Text watermark (hex color, Matrix rotation, graphics state opacity); image watermark (PDImageXObject positioning) |

### PDF generation engine (`com.pdfcreator.pdfa.generator`)

Generates PDFs from the same template JSON format used by the pdf-creator Next.js app.

| Class | Responsibility |
|---|---|
| `PdfGenerator` | Entry point — parses template, applies placeholders/CSV/repeater data, delegates to layout and renderer |
| `PdfPageLayout` | Page sizing (A4/A3/A5), header/footer sections, absolute + flow layout, page overflow for auto tables + repeaters, bookmarks, watermarks |
| `PdfElementRenderer` | Renders all element types with coordinate conversion (template top-left → PDF bottom-left) |
| `PdfTextLayout` | Word-wrapping, text measurement, unsupported character substitution, line height |
| `PdfShapeRenderer` | Shapes (rectangle, circle, line, triangle, diamond, arrow, heart) with fill/stroke/opacity |
| `PdfFontManager` | Loads bundled TTF fonts (6 families × 4 variants), supports uploaded fonts, caches by `"family|weight|style"` key |

**Chart limitation:** Does not render ECharts options server-side. Charts require a pre-rendered `renderedImage` (base64 PNG) in the template. Use pdf-creator's `/api/generate-pdf` for server-side chart rendering.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8090` | HTTP server port |
| `ICC_PROFILE_PATH` | `/usr/share/color/icc/ghostscript/srgb.icc` | sRGB ICC profile for PDF/A |
| `BUNDLED_FONT_DIR` | `/app/fonts` | Path to bundled TTF fonts |
| `UPLOAD_FONT_DIR` | `/tmp/pdf-creator-fonts` | Path to user-uploaded fonts |

### Testing

- JUnit 5 + Mockito, one test class per service class
- `TestHelper.java` provides utilities for creating test PDFs
- JaCoCo enforces **>95% instruction coverage** — build fails if not met

### Deployment

Multi-stage Docker build: Maven 3.9 + Temurin 17 (build) → Temurin 17 JRE (runtime). Requires `icc-profiles-free` and `ghostscript` packages for the sRGB ICC profile used in PDF/A conversion.
