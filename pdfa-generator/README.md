# pdfa-generator

A standalone Java microservice for PDF/A conversion, digital signing, encryption, validation, text & image watermarks, and PDF generation from templates. Built with Apache PDFBox and BouncyCastle.

## Quick Start

### With Docker (recommended)

```bash
docker build -t pdfa-generator .
docker run -p 8090:8090 pdfa-generator
```

### With Maven

Requires Java 17+.

```bash
mvn clean package
java -jar target/pdfa-generator-1.0.0.jar
```

The service starts on port **8090** by default. Override with the `PORT` environment variable:

```bash
PORT=9000 java -jar target/pdfa-generator-1.0.0.jar
```

### Verify it's running

```bash
curl http://localhost:8090/api/health
# {"status":"ok"}
```

## API Reference

All endpoints accept and return JSON. PDF payloads are base64-encoded.

### Health Check

```bash
GET /api/health
```

**Response:** `{"status":"ok"}`

---

### Convert to PDF/A

```bash
POST /api/convert-to-pdfa
```

Converts a standard PDF to an archival PDF/A format.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `pdf` | string | yes | | Base64-encoded PDF |
| `part` | number | no | `2` | PDF/A part: `1`, `2`, or `3` |
| `conformance` | string | no | `"B"` | Conformance level: `"A"`, `"B"`, or `"U"` |
| `title` | string | no | `""` | Document title (XMP metadata) |
| `author` | string | no | `""` | Document author (XMP metadata) |

**Response:**

```json
{ "pdf": "<base64>", "success": true }
```

**Example:**

```bash
PDF_B64=$(base64 -w0 input.pdf)
curl -X POST http://localhost:8090/api/convert-to-pdfa \
  -H "Content-Type: application/json" \
  -d "{\"pdf\":\"$PDF_B64\",\"part\":2,\"conformance\":\"B\"}" \
  | jq -r .pdf | base64 -d > output-pdfa.pdf
```

---

### Encrypt PDF

```bash
POST /api/encrypt
```

Adds password protection to a PDF.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `pdf` | string | yes | | Base64-encoded PDF |
| `userPassword` | string | yes | | Password required to open the PDF |
| `ownerPassword` | string | no | same as `userPassword` | Password for full access (edit, print all) |
| `keyLength` | number | no | `256` | Encryption key length: `128` or `256` |
| `permissions` | number | no | `4` | PDF permission bitfield (`4` = allow printing only) |

**Response:**

```json
{ "pdf": "<base64>", "success": true }
```

**Example:**

```bash
PDF_B64=$(base64 -w0 input.pdf)
curl -X POST http://localhost:8090/api/encrypt \
  -H "Content-Type: application/json" \
  -d "{\"pdf\":\"$PDF_B64\",\"userPassword\":\"secret\"}" \
  | jq -r .pdf | base64 -d > encrypted.pdf
```

---

### Digitally Sign PDF

```bash
POST /api/sign
```

Signs a PDF with a PKCS#12 or JKS keystore.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `pdf` | string | yes | | Base64-encoded PDF |
| `keystore` | string | yes | | Base64-encoded keystore file (`.p12`, `.pfx`, or `.jks`) |
| `keystorePassword` | string | yes | | Keystore password |
| `keystoreType` | string | no | `"PKCS12"` | `"PKCS12"` or `"JKS"` |
| `alias` | string | no | first entry | Key alias in the keystore |
| `reason` | string | no | | Signature reason (e.g. "Approved") |
| `location` | string | no | | Signing location (e.g. "Hanoi, Vietnam") |
| `contactInfo` | string | no | | Signer contact info (e.g. email) |

**Response:**

```json
{ "pdf": "<base64>", "success": true }
```

**Example:**

```bash
PDF_B64=$(base64 -w0 input.pdf)
KS_B64=$(base64 -w0 keystore.p12)
curl -X POST http://localhost:8090/api/sign \
  -H "Content-Type: application/json" \
  -d "{\"pdf\":\"$PDF_B64\",\"keystore\":\"$KS_B64\",\"keystorePassword\":\"pass\",\"reason\":\"Approved\"}" \
  | jq -r .pdf | base64 -d > signed.pdf
```

---

### Validate PDF/A

```bash
POST /api/validate-pdfa
```

Checks if a PDF is valid PDF/A. Returns detailed error reports with categorization and summary.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdf` | string | yes | Base64-encoded PDF |

**Response:**

```json
{
  "valid": true,
  "errors": [],
  "errorCount": 0,
  "summary": {}
}
```

Or if invalid:

```json
{
  "valid": false,
  "errorCount": 3,
  "errors": [
    { "code": "2.4.3", "details": "Invalid ICC profile", "category": "color", "page": 1 },
    { "code": "3.1.1", "details": "Font not embedded", "category": "font" },
    { "code": "4.1", "details": "XMP metadata missing", "category": "metadata" }
  ],
  "summary": {
    "color": 1,
    "font": 1,
    "metadata": 1
  }
}
```

**Error categories:** `syntax`, `graphics`, `transparency`, `color`, `font`, `metadata`, `annotation`, `action`, `structure`, `other`

---

### Merge PDFs

```bash
POST /api/merge
```

Merges multiple PDFs into a single PDF document.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdfs` | string[] | yes | Array of base64-encoded PDFs (merged in order) |

**Response:**

```json
{ "pdf": "<base64>", "success": true }
```

**Example:**

```bash
PDF1=$(base64 -w0 first.pdf)
PDF2=$(base64 -w0 second.pdf)
curl -X POST http://localhost:8090/api/merge \
  -H "Content-Type: application/json" \
  -d "{\"pdfs\":[\"$PDF1\",\"$PDF2\"]}" \
  | jq -r .pdf | base64 -d > merged.pdf
```

---

### Split PDF

```bash
POST /api/split
```

Splits a PDF into individual page PDFs.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `pdf` | string | yes | | Base64-encoded PDF |
| `pages` | number[] | no | all pages | Page numbers to extract (1-based) |

**Response:**

```json
{
  "pdfs": ["<base64>", "<base64>"],
  "count": 2,
  "success": true
}
```

**Example:**

```bash
PDF_B64=$(base64 -w0 input.pdf)
# Extract pages 1 and 3
curl -X POST http://localhost:8090/api/split \
  -H "Content-Type: application/json" \
  -d "{\"pdf\":\"$PDF_B64\",\"pages\":[1,3]}" \
  | jq -r '.pdfs[0]' | base64 -d > page1.pdf
```

---

### Extract Text

```bash
POST /api/extract-text
```

Extracts text content from a PDF.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `pdf` | string | yes | | Base64-encoded PDF |
| `startPage` | number | no | `1` | Start page (1-based, inclusive) |
| `endPage` | number | no | last page | End page (1-based, inclusive) |
| `perPage` | boolean | no | `false` | If true, return text separately for each page |

**Response (combined):**

```json
{
  "totalPages": 5,
  "text": "All extracted text here...",
  "success": true
}
```

**Response (per page):**

```json
{
  "totalPages": 5,
  "pages": [
    { "page": 1, "text": "Page 1 text..." },
    { "page": 2, "text": "Page 2 text..." }
  ],
  "success": true
}
```

**Example:**

```bash
PDF_B64=$(base64 -w0 input.pdf)
curl -X POST http://localhost:8090/api/extract-text \
  -H "Content-Type: application/json" \
  -d "{\"pdf\":\"$PDF_B64\",\"perPage\":true}" \
  | jq .
```

---

### Extract Metadata

```bash
POST /api/extract-metadata
```

Reads metadata and document properties from a PDF.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdf` | string | yes | Base64-encoded PDF |

**Response:**

```json
{
  "success": true,
  "pageCount": 10,
  "pdfVersion": "1.7",
  "metadata": {
    "title": "Annual Report 2025",
    "author": "Jane Smith",
    "subject": "Financial Summary",
    "keywords": "finance, report",
    "creator": "pdf-creator",
    "producer": "Apache PDFBox",
    "creationDate": "2025-06-15T10:30:00+07:00",
    "modificationDate": "2025-06-16T14:00:00+07:00"
  },
  "properties": {
    "encrypted": false
  }
}
```

**Example:**

```bash
PDF_B64=$(base64 -w0 input.pdf)
curl -X POST http://localhost:8090/api/extract-metadata \
  -H "Content-Type: application/json" \
  -d "{\"pdf\":\"$PDF_B64\"}" \
  | jq .
```

---

### Text Watermark

```bash
POST /api/text-watermark
```

Adds a rotated text watermark (e.g. "DRAFT", "CONFIDENTIAL") to PDF pages.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `pdf` | string | yes | | Base64-encoded PDF |
| `text` | string | yes | | Watermark text |
| `fontSize` | number | no | `60` | Font size |
| `rotation` | number | no | `45` | Rotation angle in degrees |
| `opacity` | number | no | `0.3` | Opacity (0.0 to 1.0) |
| `color` | string | no | `"#888888"` | Hex color (e.g. `"#FF0000"`) |
| `pages` | number[] | no | all pages | Pages to watermark (1-based) |

**Response:**

```json
{ "pdf": "<base64>", "success": true }
```

**Example:**

```bash
PDF_B64=$(base64 -w0 input.pdf)
curl -X POST http://localhost:8090/api/text-watermark \
  -H "Content-Type: application/json" \
  -d "{\"pdf\":\"$PDF_B64\",\"text\":\"DRAFT\",\"color\":\"#FF0000\",\"opacity\":0.2}" \
  | jq -r .pdf | base64 -d > watermarked.pdf
```

---

### Image Watermark

```bash
POST /api/image-watermark
```

Overlays an image watermark on PDF pages with configurable position, size, and opacity.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `pdf` | string | yes | | Base64-encoded PDF |
| `image` | string | yes | | Base64-encoded watermark image (PNG, JPEG, etc.) |
| `x` | number | no | center | X position in PDF points from left (-1 = center) |
| `y` | number | no | center | Y position in PDF points from top (-1 = center) |
| `width` | number | no | original | Image width in PDF points (0 = original size) |
| `height` | number | no | original | Image height in PDF points (0 = original size) |
| `opacity` | number | no | `0.3` | Opacity (0.0 to 1.0) |
| `pages` | number[] | no | all pages | Pages to watermark (1-based) |

**Response:**

```json
{ "pdf": "<base64>", "success": true }
```

**Example:**

```bash
PDF_B64=$(base64 -w0 input.pdf)
IMG_B64=$(base64 -w0 logo.png)
curl -X POST http://localhost:8090/api/image-watermark \
  -H "Content-Type: application/json" \
  -d "{\"pdf\":\"$PDF_B64\",\"image\":\"$IMG_B64\",\"x\":200,\"y\":300,\"width\":150,\"height\":150,\"opacity\":0.2}" \
  | jq -r .pdf | base64 -d > watermarked.pdf
```

---

### Generate PDF from Template

```bash
POST /api/generate
```

Generates a PDF from a template JSON — the same format used by the pdf-creator editor. This endpoint is a standalone alternative to the Next.js `/api/generate-pdf` route, using Apache PDFBox instead of React PDF.

Supports `Accept: application/pdf` header to receive the PDF as a binary download instead of base64 JSON.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `template` | object/string | yes | | Template JSON (same schema as editor Save JSON) |
| `placeholders` | object | no | `{}` | Key-value map to replace `{{key}}` tokens |
| `csv` | string[] | no | `[]` | Array of CSV strings for auto tables (matched in order) |
| `metadata` | object | no | | PDF metadata: `title`, `author`, `subject`, `keywords`, `creator`, `producer`, `fileName` |
| `repeaterData` | object | no | | Repeater items keyed by element ID or dataKey: `{"id": [{"fields": {...}}]}` |

**Response (JSON, default):**

```json
{ "pdf": "<base64>", "success": true }
```

**Response (binary, with `Accept: application/pdf`):**

Returns the PDF file directly with `Content-Disposition: attachment`.

**Example — Sensor Report with placeholders and repeater data:**

This uses the `sensor-report` template from `pdf-creator/public/samples/sensor-report/`.

1\. Build the request JSON (using `jq` to wrap repeater items in `{"fields": ...}` format):

```bash
SAMPLES=pdf-creator/public/samples/sensor-report

# Wrap each sensor array item as {"fields": <item>} for the repeater API
wrap_items() { jq '[.[] | {fields: (. | to_entries | map({(.key): .value | tostring}) | add)}]' "$1"; }

jq -n \
  --slurpfile template "$SAMPLES/template.json" \
  --slurpfile placeholders "$SAMPLES/placeholders.json" \
  --slurpfile metadata "$SAMPLES/metadata.json" \
  --argjson temp_sensors "$(wrap_items $SAMPLES/temperature_sensors.json)" \
  --argjson humid_sensors "$(wrap_items $SAMPLES/humidity_sensors.json)" \
  --argjson press_sensors "$(wrap_items $SAMPLES/pressure_sensors.json)" \
  --argjson co2_sensors "$(wrap_items $SAMPLES/co2_sensors.json)" \
  --argjson motion_sensors "$(wrap_items $SAMPLES/motion_sensors.json)" \
  '{
    template: $template[0],
    placeholders: $placeholders[0],
    metadata: $metadata[0],
    repeaterData: {
      temperature_sensors: $temp_sensors,
      humidity_sensors: $humid_sensors,
      pressure_sensors: $press_sensors,
      co2_sensors: $co2_sensors,
      motion_sensors: $motion_sensors
    }
  }' > /tmp/sensor-report-request.json
```

2\. Generate PDF (binary download):

```bash
curl -X POST http://localhost:8090/api/generate \
  -H "Content-Type: application/json" \
  -H "Accept: application/pdf" \
  --data-binary @/tmp/sensor-report-request.json \
  -o sensor-report.pdf
```

Or get base64 JSON response:

```bash
curl -X POST http://localhost:8090/api/generate \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/sensor-report-request.json \
  | jq -r .pdf | base64 -d > sensor-report.pdf
```

**Example — simple template with placeholders only:**

```bash
curl -X POST http://localhost:8090/api/generate \
  -H "Content-Type: application/json" \
  -H "Accept: application/pdf" \
  -d @- -o output.pdf <<'EOF'
{
  "template": <contents of template.json>,
  "placeholders": {"company": "Acme Inc", "date": "2025-07-01"},
  "metadata": {"title": "Invoice", "author": "Finance Department"}
}
EOF
```

**Supported element types:** text, heading, link, divider, table (manual + auto CSV), image (base64/URL), card, chart (pre-rendered image), shape (rectangle, circle, line, triangle, diamond, arrow, heart), repeater.

**Supported features:**

- Placeholder resolution (`{{key}}` tokens, `{{page_number}}`, `{{total_pages}}`)
- Header/footer sections
- Flow layout with page overflow for auto tables and repeaters
- Custom fonts (bundled TTF + uploaded)
- Image watermarks
- All page sizes (A4, A3, A5)

> **Important: Chart rendering limitation**
>
> pdfa-generator **cannot render charts from ECharts options**. Chart elements require a pre-rendered image (`renderedImage` field) to display in the PDF. Without it, a "Chart (not rendered)" placeholder is shown.
>
> **pdf-creator's `/api/generate-pdf` endpoint does support server-side chart rendering** — it uses ECharts SSR to automatically render any chart that has an ECharts option but no `renderedImage`. If your templates use charts, prefer the pdf-creator API or pre-render chart images before sending to pdfa-generator.
>
> To pre-render charts for pdfa-generator, either:
>
> 1. Use the browser editor export (charts are rendered client-side automatically)
> 2. Use a script with ECharts SSR (see `pdf-creator/scripts/render-chart-showcase.ts` for an example)
> 3. Call pdf-creator's API first, which renders charts server-side

---

## Testing

Requires Java 17+ and Maven.

### Run tests

```bash
mvn test
```

### Run tests with coverage report

```bash
mvn test jacoco:report
```

The HTML coverage report is generated at `target/site/jacoco/index.html`.

### Coverage

The project targets **>95% instruction coverage** (excluding `App.java` which is HTTP wiring). Coverage is enforced via the JaCoCo Maven plugin during `mvn test`.

Key test classes:

| Source class | Test class |
|---|---|
| `PdfAConverter` | `PdfAConverterTest` |
| `PdfSigner` | `PdfSignerTest` |
| `PdfEncryptor` | `PdfEncryptorTest` |
| `PdfMergerSplitter` | `PdfMergerSplitterTest` |
| `PdfTextExtractor` | `PdfTextExtractorTest` |
| `PdfMetadataExtractor` | `PdfMetadataExtractorTest` |
| `PdfWatermarker` | `PdfWatermarkerTest` |
| `PdfGenerator` | `PdfGeneratorTest` |
| `PdfElementRenderer` | `PdfElementRendererTest` |
| `PdfPageLayout` | `PdfPageLayoutTest` |
| `PdfFontManager` | `PdfFontManagerTest` |
| `PdfTextLayout` | `PdfTextLayoutTest` |
| `PdfShapeRenderer` | `PdfShapeRendererTest` |

---

## Error Handling

On failure, endpoints return HTTP 500 with:

```json
{ "success": false, "error": "Description of what went wrong" }
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8090` | HTTP listening port |
| `ICC_PROFILE_PATH` | `/usr/share/color/icc/ghostscript/srgb.icc` | Path to sRGB ICC profile (required for PDF/A) |
| `BUNDLED_FONT_DIR` | `/app/fonts` | Directory containing bundled TTF font files (for `/api/generate`) |
| `UPLOAD_FONT_DIR` | `/tmp/pdf-creator-fonts` | Directory containing user-uploaded font files (for `/api/generate`) |

## Dependencies

- [Apache PDFBox 3.0.4](https://pdfbox.apache.org/) -- PDF manipulation, PDF/A conversion, validation
- [BouncyCastle 1.79](https://www.bouncycastle.org/) -- Cryptography for digital signatures
- [Gson 2.11.0](https://github.com/google/gson) -- JSON processing

## Processing Order

When used with pdf-creator, the recommended pipeline order is:

1. **PDF/A conversion** (must happen first)
2. **Digital signing** (after PDF/A, before encryption)
3. **Encryption** (last -- encryption is incompatible with PDF/A compliance)

## License

MIT
