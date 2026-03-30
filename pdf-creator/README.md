# PDF Creator

A browser-based, WYSIWYG PDF template editor. Design multi-page documents visually, populate them with dynamic data, charts, and repeating card sections, and export production-ready PDFs — entirely in the browser or via a REST API.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Web App Guide](#2-web-app-guide)
3. [Architecture](#3-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Data Model](#5-data-model)
6. [Export Flow](#6-export-flow)
7. [Prerequisites](#7-prerequisites)
8. [Running & Building](#8-running--building)
9. [Testing & Code Quality](#9-testing--code-quality)
10. [Deploying](#10-deploying)
11. [REST API](#11-rest-api)

---

## 1. Overview

PDF Creator is a **Next.js 16** application that lets users:

- Browse a gallery of six built-in templates or start from a blank page.
- Edit PDF pages on a scaled canvas — add, drag, resize, and configure elements in a right-side properties panel.
- Embed `{{placeholder}}` tokens in text, tables, cards, and repeater elements; fill them at export time.
- Use **Auto CSV** tables that accept a CSV upload at export time, generating reports from dynamic datasets.
- Add **ECharts** charts with pre-configured or fully custom options; render them to PNG at export time.
- Insert **Repeater** elements that stamp out a card template once per data item (e.g. one card per sensor).
- Draw **Shapes** (rectangle, circle, line, triangle, diamond, arrow, heart) with configurable fill, stroke, and border radius.
- Add **Links** with clickable `href` targets in the exported PDF.
- Upload custom fonts (WOFF) and choose from 7 bundled font families (Open Sans, Roboto, Calibri, Lato, Inter, Verdana, Arial).
- Undo / redo all edits, copy / paste / duplicate elements, and align or distribute multi-selections.
- Embed PDF **metadata** (title, author, subject, keywords, dates) and protect the PDF with a **password**.
- Overlay a **watermark** image on selected pages.
- Add **PDF bookmarks** (document outline) per page for easy navigation.
- Apply **image compression** (JPEG quality, DPI) to reduce file size.
- Use **advanced text styling** — strikethrough, superscript, and subscript.
- Save and restore the full template as JSON, **copy/paste** templates via clipboard, or **share** as a URL.

---

## 2. Web App Guide

### Template Gallery

The home page (`/`) shows a card for each built-in template plus a **+ New template** button for a blank canvas.

| Template | Description |
| --- | --- |
| **Annual Report** | 5-page report with title, executive summary, statistics pages, and closing |
| **Invoice** | Single-page invoice with line items, tax, and payment terms |
| **Employee Directory** | Staff listing driven by a CSV upload at export time |
| **IoT Sensor Dashboard** | KPI cards and placeholder-driven metrics page |
| **Chart Showcase** | 2-page showcase of bar, line, pie, scatter, and heatmap charts |
| **Monthly Sensor Report** | 6-page report with a cover page and one repeating card section per sensor type |

Click any card to open it in the editor.

---

### Editor Layout

```text
┌──────────────────────────────────────────────────────────────────┐
│  Row 1 — Back, title, Undo/Redo, Save JSON / Load JSON, Export   │
│  Row 2 — Page size, font selector, Metadata / Password /         │
│           Watermark toggles                                       │
│  Row 3 — Element insert buttons (Repeater, Shape, Card, Heading, │
│           Text, Link, Image, Table, Chart, Divider, Placeholder) │
│  Row 4 — Copy/Paste/Duplicate/Delete, Z-order, Align/Distribute, │
│           Text alignment, List style, Shape type, Sections        │
├───────┬──────────────────────────────────────┬───────────────────┤
│ Page  │                                      │                   │
│ navi- │           Canvas area                │   Properties      │
│ gator │                                      │     Panel         │
│       │                                      │                   │
└───────┴──────────────────────────────────────┴───────────────────┘
```

#### Toolbar — Row 1

| Control | Action |
| --- | --- |
| ← Templates | Return to the gallery |
| Undo / Redo | Step through edit history (Ctrl+Z / Ctrl+Y) |
| Save JSON | Download the current template as `template.json` |
| Load JSON | Open a previously saved `template.json` |
| Copy | Copy template JSON to clipboard |
| Paste | Load template from clipboard JSON |
| Share | Copy a shareable URL (base64-encoded template) to clipboard |
| Export PDF | Run the export wizard and download `output.pdf` |

#### Toolbar — Row 2

| Control | Action |
| --- | --- |
| Page size selector | Switch between A4, A3, A5 |
| Font selector | Choose from 7 bundled font families |
| Metadata | Toggle PDF metadata wizard step on/off |
| Password | Toggle PDF password protection on/off |
| Watermark | Toggle watermark overlay on/off |
| Compress | Toggle image compression settings on/off |

#### Toolbar — Row 3

| Control | Action |
| --- | --- |
| Repeater | Add a repeating card section |
| Shape | Add a shape (rectangle, circle, line, triangle, diamond, arrow, heart) |
| Card | Add a KPI card |
| Heading | Add a heading element |
| Text | Add a text block |
| Link | Add a clickable link |
| Image | Add an image (upload or URL) |
| Table | Add a table (manual or auto CSV) |
| Chart | Add an ECharts chart |
| Divider | Add a horizontal rule |
| Placeholder | Insert a `{{token}}` into the selected text element |

#### Toolbar — Row 4 (context-sensitive)

| Control | When visible |
| --- | --- |
| Copy / Paste / Duplicate / Delete | Any element selected |
| Bring to Front / Forward / Backward / Send to Back | Single element selected |
| Align left / center / right / top / middle / bottom | Multiple elements selected |
| Distribute horizontally / vertically | 3+ elements selected |
| Text align (left / center / right / justify) | Text or heading selected |
| List style (none / bullet / numbered) | Text or heading selected |
| Shape type buttons | Shape element selected |
| Header / Footer toggle, target section selector | Always visible |

---

### Page Navigator (left sidebar)

- Click a page thumbnail to switch to that page.
- **+ Add page** appends a new blank page.
- The trash icon on a thumbnail deletes that page (disabled when only one page exists).
- A **bookmark** text input appears on the active page — set a label to create a PDF document outline entry.

---

### Canvas

The canvas shows the current page at scale with a light-grey background. Three zones are always visible:

| Zone | Indicator |
| --- | --- |
| **Header** | Blue dashed border at the top; drag the bottom edge to resize |
| **Body** | The main content area between header and footer |
| **Footer** | Green dashed border at the bottom; drag the top edge to resize |

Click a zone to make it active (new elements are added to the active zone). The active zone is highlighted.

**Moving elements** — left-click drag any element to reposition it. Hold Shift to add to the selection. Ctrl+A selects all elements on the current page.

**Keyboard shortcuts:**

| Shortcut | Action |
| --- | --- |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+D | Duplicate |
| Ctrl+A | Select all |
| Delete | Delete selected |

---

### Properties Panel (right sidebar)

Clicking an element opens its property editor. Fields vary by element type:

| Element | Key properties |
| --- | --- |
| Heading / Text | Content, font size, bold, italic, underline, strikethrough, superscript, subscript, colour, width, text align, line height, list style |
| Link | Content, href, font size, colour, width, underline |
| Divider | Colour, width, thickness |
| Image | Upload file / set URL, label, width, height, background colour |
| Card | Title, value, unit, subtitle, accent colour, border colour, background colour |
| Table | Mode (Manual / Auto CSV), headers, rows, font size, header colours, width |
| Chart | ECharts option JSON editor with live preview |
| Shape | Shape type, fill colour, stroke colour, stroke width, border radius, width, height |
| Repeater | Data key, card width/height, items per row, gap, card elements |

When no element is selected the panel shows the **Font Manager** for uploading custom WOFF fonts.

---

### Element Types in Detail

#### Text & Heading

Type content directly in the Properties panel. Insert `{{placeholders}}` using the Placeholder toolbar button — values are filled in at export time. Supports left / center / right / justify alignment and bullet / numbered list styles.

#### Link

A clickable text element with an `href` field. Renders as a clickable link in the exported PDF.

#### Card

A KPI-style box with an accent colour bar, a large value field, a unit label, a title, and a subtitle. All text fields support `{{placeholders}}`.

#### Table

**Manual** — all rows are stored in the template. Edit headers and rows directly in the panel.

**Auto CSV** — only headers and one preview row are stored. At export time the user uploads a CSV file; every data row replaces the preview row in the final PDF. Suitable for employee directories, product catalogues, and other variable-length datasets.

#### Chart

Powered by **Apache ECharts 6**. Two sub-types:

- **Pre-configured** — the ECharts option (axes, colours, series structure) is set at design time. The chart renders live on the canvas. At export time the user can confirm the existing data or upload a replacement JSON file.
- **Blank** — the option is empty at design time (shows a placeholder box). A full ECharts option JSON must be provided at export time.

At export time a Chart step opens for each chart — edit the ECharts option JSON, see a live preview, then render & confirm to capture a high-resolution PNG embedded in the PDF.

Sample data/option files are in `public/samples/chart-showcase/`.

#### Shape

Draw vector shapes — rectangle, circle, line, triangle, diamond, arrow, or heart. Configure fill colour, stroke colour, stroke width, and border radius.

#### Repeater

A repeating card section that stamps out a card template once per data item. Define card elements (text, image, chart, divider, etc.) inside the repeater; provide a JSON array of items at export time. Each item's fields are substituted into the card template via `{{field}}` tokens and data-key bindings.

#### Image

Upload an image from disk (converted to base64) or enter a URL. If no source is set the element renders as a labelled placeholder box.

---

### Fonts

The **Font Manager** panel (visible when no element is selected) lets you upload WOFF font files. Uploaded fonts are stored server-side during the session and registered with `@react-pdf/renderer` at export time. Seven bundled font families are always available: Open Sans, Roboto, Calibri, Lato, Inter, Verdana, and Arial.

Before exporting, if any uploaded font is no longer available on the server (e.g. after a server restart), a **Missing Fonts** modal prompts you to re-upload the files.

---

### Export Wizard

Clicking **Export PDF** opens a step-by-step wizard. Steps are shown only when applicable:

1. **Font check** — verifies uploaded fonts are still on the server; prompts re-upload if missing.
2. **Placeholders** — collects values for every `{{token}}` found in the template.
3. **CSV upload** — shown once per Auto CSV table; upload a CSV or confirm the preview row.
4. **Chart data** — shown once per chart; confirm or replace the ECharts option JSON and render to PNG.
5. **Repeater data** — shown once per repeater; provide a JSON array of items.
6. **Metadata** — fill in PDF metadata (title, author, subject, keywords, dates).
7. **Password** — set an optional password to encrypt the PDF.

After all steps complete, the PDF is generated and downloaded.

---

### Saving & Loading

- **Save JSON** exports the full template (pages, elements, fonts, styles) as a JSON file.
- **Load JSON** restores a previously saved template, replacing the current one.
- The JSON file can also be used with the REST API for automated server-side generation.

---

## 3. Architecture

### Technology Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.2.1 (App Router) |
| UI | React 19 |
| PDF rendering | @react-pdf/renderer v4 |
| PDF encryption | muhammara v6 |
| Charts | Apache ECharts 6 |
| Image processing | sharp v0.34 |
| Icons | lucide-react |
| CSS | Tailwind CSS 4 |
| Language | TypeScript 5 (strict mode) |

### Rendering Pipeline

```text
Template JSON
     │
     ├─ Editor canvas          ElementView.tsx        → HTML/CSS scaled preview
     │                         ChartElementPreview    → ECharts canvas (CSS-scaled)
     │
     └─ Export / API
           ├─ Client export    PdfTemplate.tsx        → @react-pdf/renderer → Blob → download
           └─ Server API       serverPdfRenderer.tsx  → renderToBuffer → HTTP response
```

The two PDF renderers (`PdfTemplate.tsx` and `serverPdfRenderer.tsx`) are kept in sync and produce identical output.

---

## 4. Directory Structure

```text
pdf-creator/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Home — Template Gallery
│   ├── editor/
│   │   └── page.tsx                  # Editor page (wraps EditorClient)
│   └── api/
│       ├── generate-pdf/
│       │   └── route.tsx             # POST /api/generate-pdf
│       └── fonts/
│           ├── route.ts              # POST /api/fonts (upload)
│           ├── status/route.ts       # POST /api/fonts/status (check)
│           ├── [id]/route.ts         # GET  /api/fonts/:id (serve)
│           └── cleanup/route.ts      # POST /api/fonts/cleanup
│
├── components/
│   ├── TemplateGallery/
│   │   ├── index.tsx                 # Gallery grid
│   │   ├── TemplateCard.tsx          # Built-in template card with preview
│   │   ├── BlankCard.tsx             # "Start from scratch" card
│   │   └── PagePreview.tsx           # Miniature page thumbnail renderer
│   ├── PdfEditor/
│   │   ├── index.tsx                 # Editor root — state, drag, resize, history
│   │   ├── Toolbar.tsx               # Four-row toolbar
│   │   ├── EditorCanvas.tsx          # Scrollable viewport + section zones
│   │   └── PageNavigator.tsx         # Left sidebar page list
│   ├── PropertiesPanel/
│   │   ├── index.tsx                 # Switches between element sections
│   │   ├── ChartSection.tsx          # ECharts JSON editor + scaled preview
│   │   ├── TableSection.tsx          # Manual / Auto CSV controls
│   │   ├── ImageSection.tsx          # Image upload controls
│   │   ├── ColorInput.tsx            # Colour picker + hex input
│   │   ├── Field.tsx                 # Label wrapper
│   │   ├── NumInput.tsx              # Bounded number input
│   │   ├── WatermarkPanel.tsx        # Watermark configuration
│   │   └── styles.ts                 # Shared panel styles
│   ├── modals/
│   │   ├── ExportWizardModal/        # Step-by-step export wizard
│   │   │   ├── index.tsx             # Wizard orchestrator
│   │   │   ├── FontsStep.tsx         # Missing-font re-upload
│   │   │   ├── PlaceholderStep.tsx   # Fill {{token}} values
│   │   │   ├── CsvStep.tsx           # Upload CSV for Auto CSV tables
│   │   │   ├── ChartStep.tsx         # Confirm / replace ECharts option
│   │   │   ├── RepeaterStep.tsx      # Provide repeater item JSON
│   │   │   ├── MetadataStep.tsx      # Fill PDF metadata fields
│   │   │   ├── PasswordStep.tsx      # Set PDF password
│   │   │   ├── WizardStepper.tsx     # Progress stepper component
│   │   │   ├── MetaChip.tsx          # Metadata tag chip
│   │   │   ├── styles.ts             # Modal styles
│   │   │   ├── types.ts              # WizardStep, WizardResult types
│   │   │   └── utils.ts              # Step utilities
│   │   ├── FontUploadList.tsx        # Font upload list component
│   │   └── MissingFontsModal.tsx     # Re-upload fonts missing from the server
│   ├── EditorClient.tsx              # Reads ?t= query param, boots PdfEditor
│   ├── ElementView.tsx               # Renders any element type on the canvas
│   ├── PdfTemplate.tsx               # @react-pdf/renderer document (client)
│   ├── ExportPdfButton.tsx           # Export wizard orchestrator
│   ├── FontManagerPanel.tsx          # Upload / manage custom WOFF fonts
│   ├── FontSelector.tsx              # Font family dropdown
│   ├── PageSizeSelector.tsx          # A4 / A3 / A5 dropdown
│   └── PlaceholderPicker.tsx         # {} toolbar button + popover
│
├── lib/
│   ├── templates/
│   │   ├── index.ts                  # TEMPLATE_REGISTRY + getTemplateById
│   │   ├── report.ts                 # Annual Report (5 pages)
│   │   ├── invoice.ts                # Invoice (1 page)
│   │   ├── employee-directory.ts     # Employee Directory (1 page + auto table)
│   │   ├── sensor-dashboard.ts       # IoT Sensor Dashboard (1 page)
│   │   ├── chart-showcase.ts         # Chart Showcase (2 pages)
│   │   ├── sensor-report.ts          # Monthly Sensor Report (6 pages + repeaters)
│   │   └── utils.ts                  # makeId, createElement, page dimensions, bundled fonts
│   ├── placeholders.ts               # extractPlaceholders, applyValues, collectAutoTables,
│   │                                 # applyAutoRows, collectCharts, applyChartImages
│   ├── encryptPdf.ts                 # PDF password encryption (muhammara)
│   ├── fontRegistry.ts               # Client-side font registration
│   ├── fontRegistry.server.ts        # Server-side font registration
│   ├── serverPdfRenderer.tsx         # PdfDocument component (API route)
│   ├── imageConvert.ts               # Client image → base64 helper
│   ├── serverImageConvert.ts         # Server image fetch + convert (sharp)
│   ├── useEditorFonts.ts             # Font loading hook
│   ├── useHistory.ts                 # Undo/redo history hook
│   └── utils.tsx                     # btnStyle, downloadJson, parseTableData
│
├── types/
│   └── template.ts                   # Template, TemplatePage, TemplateElement union,
│                                     # ChartElement, CardElement, TableElement,
│                                     # ShapeElement, LinkElement, RepeaterElement,
│                                     # WatermarkConfig, PdfMetadata, …
│
├── scripts/
│   └── export-templates.ts           # Export built-in templates to public/samples/
│
└── public/
    ├── fonts/                        # Bundled WOFF files (Open Sans, Roboto, Calibri,
    │                                 # Lato, Inter, Verdana, Arial)
    └── samples/                      # Sample data & template JSON for each template
        ├── chart-showcase/
        ├── employee-directory/
        ├── invoice/
        ├── report/
        ├── sensor-dashboard/
        └── sensor-report/
```

---

## 5. Data Model

Every template is a plain JSON object. Abbreviated shape:

```text
Template
├── name: string
├── pageSize: "A4" | "A3" | "A5"
├── fontFamily?: string                  # active font family
├── fonts: TemplateFont[]                # bundled + custom WOFF definitions
├── styles: { primaryColor: string }
├── includeMetadata?: boolean
├── watermark?: WatermarkConfig
└── pages: TemplatePage[]
       ├── id: string
       ├── header?: PageSection          # { height, elements[] }
       ├── footer?: PageSection          # { height, elements[] }
       └── elements: TemplateElement[]
```

All elements share `id`, `x`, `y` (absolute position in PDF points), and `opacity` (0–1). Additional fields by type:

| Type | Key fields |
| --- | --- |
| `heading` / `text` | `content`, `fontSize`, `bold`, `italic`, `underline`, `color`, `width`, `textAlign`, `lineHeight`, `listStyle` |
| `link` | `content`, `href`, `fontSize`, `color`, `width`, `underline` |
| `divider` | `color`, `width`, `thickness` |
| `image` | `src` (base64 / URL), `label`, `width`, `height`, `bgColor` |
| `card` | `title`, `value`, `unit`, `subtitle`, `accentColor`, `borderColor`, `bgColor`, `width`, `height` |
| `table` | `mode` (`manual`\|`auto`), `headers`, `rows`, `headerColor`, `headerTextColor`, `fontSize`, `width` |
| `chart` | `option` (ECharts option object), `width`, `height`, `renderedImage?` |
| `shape` | `shapeType`, `fillColor`, `strokeColor`, `strokeWidth`, `borderRadius`, `width`, `height` |
| `repeater` | `dataKey`, `cardWidth`, `cardHeight`, `itemsPerRow`, `gap`, `cardElements[]`, `items?` |

---

## 6. Export Flow

```text
User clicks "Export PDF"
      │
      ├─ 1. Font check
      │       Any uploaded fonts missing from server?
      │       Yes → re-upload step → continue
      │       No  → continue
      │
      ├─ 2. Placeholders
      │       Template contains {{tokens}}?
      │       Yes → fill values → continue
      │       No  → continue
      │
      ├─ 3. Auto CSV tables
      │       Template has auto-mode tables?
      │       Yes → upload CSV (once per table) → continue
      │       No  → continue
      │
      ├─ 4. Charts
      │       Template has chart elements?
      │       Yes → confirm / replace ECharts option → render PNG → continue
      │       No  → continue
      │
      ├─ 5. Repeaters
      │       Template has repeater elements?
      │       Yes → provide JSON item array (once per repeater) → continue
      │       No  → continue
      │
      ├─ 6. Metadata (if enabled)
      │       Fill title, author, subject, keywords, dates
      │
      ├─ 7. Password (if enabled)
      │       Enter password to encrypt the PDF
      │
      └─ Generate PDF
              applyValues + applyAutoRows + applyChartImages + applyRepeaterItems
              → registerFonts → @react-pdf/renderer → encryptPdf (optional)
              → Blob → download
```

---

## 7. Prerequisites

| Tool | Minimum version |
| --- | --- |
| Node.js | 20 |
| npm | 10 |
| Docker *(containerised deployment only)* | 24 |

No environment variables are required for basic operation. The font upload API uses the server's temporary file system; fonts are held in memory for the session.

---

## 8. Running & Building

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Hot module replacement is enabled — changes to components, lib, and types are reflected without a full reload.

### Production build

```bash
npm run build
npm start
```

Built artefacts are written to `.next/`. The server listens on port **3000** by default.

```bash
PORT=8080 npm start   # custom port
```

---

## 9. Testing & Code Quality

### Unit Tests

```bash
npm test                # run all tests
npm run test:coverage   # run with coverage report
```

Coverage reports are generated in the `coverage/` directory. The project uses **Jest** with **React Testing Library**.

### Linting

```bash
npm run lint
```

### SonarQube Scan (Docker)

Run a one-off SonarQube scan using the official Docker scanner. Replace `<SONAR_HOST_URL>` and `<SONAR_TOKEN>` with your SonarQube server URL and project token.

```bash
# 1. Generate the coverage report
npm run test:coverage

# 2. Run the SonarQube scanner
docker run --rm \
  -e SONAR_HOST_URL="<SONAR_HOST_URL>" \
  -e SONAR_TOKEN="<SONAR_TOKEN>" \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli
```

If you are running SonarQube locally via Docker Compose, use the host network so the scanner can reach it:

```bash
docker run --rm \
  --network host \
  -e SONAR_HOST_URL="http://localhost:9000" \
  -e SONAR_TOKEN="<SONAR_TOKEN>" \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli
```

Project settings are defined in `sonar-project.properties`.

---

## 10. Deploying

### Docker (recommended)

The project ships with a multi-stage `Dockerfile`:

| Stage | Base image | Purpose |
| --- | --- | --- |
| `deps` | `node:20-alpine` | Install npm dependencies |
| `builder` | `node:20-alpine` | `next build` |
| `runner` | `node:20-alpine` | Serve the pre-built app as a non-root user |

```bash
docker build -t pdf-creator .
docker run -p 3000:3000 pdf-creator
```

**Docker Compose:**

```yaml
services:
  pdf-creator:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

```bash
docker compose up -d
```

### Vercel (zero-config)

```bash
npx vercel
```

Or connect the repository in the Vercel dashboard and push to `main`.

### Other Node.js hosts (Railway, Render, Fly.io, etc.)

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Start command | `npm start` |
| Node.js version | 20 |
| Port | `3000` (or match `PORT` env var) |

No databases or persistent storage are required.

---

## 11. REST API

The server exposes an endpoint that accepts a template and optional data files and returns a rendered PDF. Rendering runs in Node.js via `@react-pdf/renderer`'s `renderToBuffer`.

### `POST /api/generate-pdf`

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `template` | JSON file or JSON string | Yes | Template definition (same schema as *Save JSON* in the editor) |
| `placeholders` | JSON file or JSON string | No | Key-value map to replace `{{tokens}}` — `{ "key": "value" }` |
| `csv` | CSV/TSV file (repeatable) | No | Row data for Auto CSV tables, matched by order of appearance. First row is the header (skipped); remaining rows become table data. |
| `metadata` | JSON file or JSON string | No | PDF metadata — `{ fileName, title, author, subject, keywords, creator, producer, creationDate, modificationDate }`. All fields optional. |
| `password` | String | No | Password to encrypt the output PDF. |
| `pdfa` | JSON file or JSON string | No | PDF/A settings — `{ "part": 2, "conformance": "B" }`. Part: `1`, `2`, or `3`. Conformance: `"A"`, `"B"`, or `"U"`. Requires the `pdfa-generator` service. |
| `signature` | JSON file or JSON string | No | Digital signature — `{ "keystoreBase64": "...", "keystorePassword": "...", "reason": "...", "location": "...", "contactInfo": "..." }`. Requires the `pdfa-generator` service. |

**Responses:**

| Status | Content-Type | Body |
| --- | --- | --- |
| `200` | `application/pdf` | PDF binary |
| `400` | `application/json` | `{ "error": "..." }` — invalid input or missing fonts |
| `500` | `application/json` | `{ "error": "..." }` — rendering failure |

> **Note:** Chart elements must have `renderedImage` pre-set (a base64 PNG). Repeater elements must have `items` pre-set. The API does not run a headless browser — chart rendering and repeater expansion are client-side steps.

---

### cURL Examples

Each built-in template ships with a `template.json` and sample data files in `public/samples/<template-id>/`. The examples below assume the server is running at `http://localhost:3000`.

---

#### Report — Annual Report

Template only (no placeholder substitution):

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/report/template.json" \
  -o report.pdf
```

With placeholders:

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/report/template.json" \
  -F "placeholders=@public/samples/report/placeholders.json" \
  -o report.pdf
```

With placeholders and metadata:

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/report/template.json" \
  -F "placeholders=@public/samples/report/placeholders.json" \
  -F "metadata=@public/samples/report/metadata.json" \
  -o annual-report-2025.pdf
```

With placeholders, metadata, and password protection:

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/report/template.json" \
  -F "placeholders=@public/samples/report/placeholders.json" \
  -F "metadata=@public/samples/report/metadata.json" \
  -F "password=secret123" \
  -o annual-report-2025-protected.pdf
```

<details>
<summary>placeholders.json</summary>

```json
{
  "report_title": "Annual Performance Report 2025",
  "report_subtitle": "Year-End Review & Strategic Analysis",
  "report_period": "January – December 2025",
  "prepared_by": "Strategy & Analytics Team",
  "report_date": "March 30, 2026",
  "date": "March 30, 2026",
  "department": "Software",
  "company_name": "Acme Corporation",
  "company_email": "reports@acme.com",
  "company_phone": "+1 (555) 012-3456"
}
```

</details>

<details>
<summary>metadata.json</summary>

```json
{
  "fileName": "annual-report-2025.pdf",
  "title": "Annual Performance Report FY2025",
  "author": "Strategic Planning Division",
  "subject": "Fiscal year 2025 financial performance, regional analysis, and strategic outlook",
  "keywords": "annual report, FY2025, revenue, profit, regional analysis, KPI, strategy",
  "creator": "PDF Creator",
  "producer": "PDF Creator / react-pdf",
  "creationDate": "2025-12-31",
  "modificationDate": "2025-12-31"
}
```

</details>

---

#### Invoice

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/invoice/template.json" \
  -F "placeholders=@public/samples/invoice/placeholders.json" \
  -o invoice.pdf
```

<details>
<summary>placeholders.json</summary>

```json
{
  "invoice_number": "INV-2026-0042",
  "invoice_date": "March 31, 2026",
  "due_date": "April 30, 2026",
  "client_name": "Globex Industries Ltd.",
  "client_address": "742 Evergreen Terrace\nSpringfield, IL 62704\nUnited States",
  "client_email": "accounts@globex.com",
  "from_company": "Acme Corporation",
  "from_address": "1 Acme Plaza, Suite 800\nNew York, NY 10001\nUnited States",
  "from_email": "billing@acme.com",
  "subtotal": "$244.00",
  "tax": "$24.40",
  "total": "$268.40",
  "payment_terms": "Net 30",
  "bank_name": "First National Bank",
  "account_number": "****-****-4821",
  "notes": "Thank you for your business. Please include the invoice number with your payment."
}
```

</details>

---

#### Employee Directory (with CSV)

Template only (shows preview row):

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/employee-directory/template.json" \
  -o employee-directory.pdf
```

With placeholders and CSV data:

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/employee-directory/template.json" \
  -F "placeholders=@public/samples/employee-directory/placeholders.json" \
  -F "csv=@public/samples/employee-directory/employees.csv" \
  -o employee-directory.pdf
```

<details>
<summary>placeholders.json</summary>

```json
{
  "date": "2026-03-30",
  "department": "All Departments",
  "company_name": "Acme Corporation"
}
```

</details>

<details>
<summary>employees.csv (first row = headers)</summary>

```csv
Name,Department,Role,Email,Status
Alice Johnson,Engineering,Senior Engineer,alice@company.com,Active
Bob Smith,Marketing,Marketing Manager,bob@company.com,Active
```

</details>

---

#### IoT Sensor Dashboard

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/sensor-dashboard/template.json" \
  -F "placeholders=@public/samples/sensor-dashboard/placeholders.json" \
  -o sensor-dashboard.pdf
```

<details>
<summary>placeholders.json</summary>

```json
{
  "station_name": "Station Alpha-7",
  "location": "Building 3, Floor 2",
  "date": "March 31, 2026",
  "last_updated": "2026-03-31 14:22:05 UTC",
  "alert_level": "Normal",
  "operator": "Jane Smith",
  "temp_status": "Normal",
  "temp_threshold": "30 °C",
  "humidity_status": "Optimal",
  "pressure_status": "Stable",
  "co2_status": "Good",
  "power_status": "Active",
  "power_peak": "3.1 kW at 09:45",
  "wind_status": "Moderate",
  "wind_dir": "NNW",
  "uv_peak_hour": "12:30",
  "moisture_status": "Adequate",
  "alert_summary": "No active alerts. All sensors are within normal operating thresholds."
}
```

</details>

---

#### Chart Showcase

The chart-showcase template has pre-configured charts on page 1 and blank charts on page 2. The API requires chart elements to have `renderedImage` pre-set — for server-side generation, render the charts client-side first and save the template with embedded images, or provide a template with `renderedImage` fields already populated.

Template only (charts render as empty boxes unless `renderedImage` is set):

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/chart-showcase/template.json" \
  -o chart-showcase.pdf
```

Sample ECharts data files are available for customization:

| File | Chart type |
| --- | --- |
| `vertical-bar-chart-data.json` | Vertical bar chart series data |
| `horizontal-bar-chart-data.json` | Horizontal bar chart series data |
| `line-chart-data.json` | Line chart series data |
| `pie-chart-data.json` | Pie chart series data |
| `scatter-chart-option.json` | Full scatter chart ECharts option |
| `heatmap-chart-option.json` | Full heatmap chart ECharts option |

---

#### Sensor Report (with repeaters)

The sensor-report template uses **Repeater** elements — one per sensor type (temperature, humidity, pressure, CO2, motion). Repeater data must be expanded client-side before calling the API. For server-side use, export the template from the editor after completing the repeater step.

Template only (repeaters render with their card template but no items):

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@public/samples/sensor-report/template.json" \
  -F "placeholders=@public/samples/sensor-report/placeholders.json" \
  -o sensor-report.pdf
```

<details>
<summary>placeholders.json</summary>

```json
{
  "report_title": "Monthly Sensor Performance Report",
  "report_period": "July 2025",
  "prepared_by": "Engineering Operations Team",
  "report_date": "2025-08-01",
  "company_name": "ACME Industrial Systems"
}
```

</details>

Sample repeater data files are available in `public/samples/sensor-report/`:

| File | Sensor type |
| --- | --- |
| `temperature_sensors.json` | Temperature sensor readings |
| `humidity_sensors.json` | Humidity sensor readings |
| `pressure_sensors.json` | Pressure sensor readings |
| `co2_sensors.json` | CO2 sensor readings |
| `motion_sensors.json` | Motion sensor readings |

---

### Multiple Auto CSV tables

If a template has multiple auto-mode tables, pass multiple `csv` fields — they are matched to tables in the order they appear in the template:

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -F "template=@my-template.json" \
  -F "csv=@table1.csv" \
  -F "csv=@table2.csv" \
  -o report.pdf
```

---

### Font Management API

The server provides endpoints for uploading, serving, and managing custom font files. Uploaded fonts are stored in `/tmp/pdf-creator-fonts/` and are available until the server restarts or the cleanup cron runs.

#### `POST /api/fonts` — Upload a font face

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `family` | string | Yes | Font family name (e.g. `"My Font"`) |
| `weight` | string | Yes | `"normal"` or `"bold"` |
| `style` | string | Yes | `"normal"` or `"italic"` |
| `file` | File | Yes | Font file (`.ttf` or `.otf`) |

**Response:** `{ "ref": "my-font-normal-normal" }`

The `ref` is a deterministic ID based on family/weight/style. Re-uploading the same face overwrites the previous file.

```bash
curl -X POST http://localhost:3000/api/fonts \
  -F "family=My Font" \
  -F "weight=normal" \
  -F "style=normal" \
  -F "file=@MyFont-Regular.ttf"
```

---

#### `GET /api/fonts/:id` — Serve an uploaded font

Returns the font file for the given ref. Used internally by `@react-pdf/renderer` when registering custom fonts.

```bash
curl http://localhost:3000/api/fonts/my-font-normal-normal -o font.ttf
```

**Response:** Font binary with appropriate `Content-Type` (`font/ttf`, `font/otf`, etc.).

Returns `404` if the font is not found.

---

#### `POST /api/fonts/status` — Check which fonts exist

**Content-Type:** `application/json`

**Body:** `{ "refs": ["my-font-normal-normal", "other-font-bold-normal"] }`

**Response:** `{ "missing": ["other-font-bold-normal"] }`

Returns the list of refs that no longer exist on disk. Used by the editor to detect fonts that need re-uploading after a server restart.

---

#### `POST /api/fonts/cleanup` — Delete old font files

Deletes uploaded font files older than 24 hours. Intended to be called by a daily cron job.

**Authentication:** If the `CRON_SECRET` environment variable is set, the request must include an `Authorization: Bearer <secret>` header. If `CRON_SECRET` is not set, no authentication is required.

**Response:** `{ "deleted": 3 }`

**Setting up the cron job:**

Using `cron` or `systemd` timer, schedule a daily call:

```bash
# crontab -e
59 23 * * * curl -X POST http://localhost:3000/api/fonts/cleanup -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or with a platform-specific scheduler (e.g. Vercel Cron, Railway Cron, etc.):

```json
{
  "crons": [{
    "path": "/api/fonts/cleanup",
    "schedule": "59 23 * * *"
  }]
}
```

Set the `CRON_SECRET` environment variable on the server to secure the endpoint:

```bash
CRON_SECRET=my-secret-token npm start
```

---

### Internal processing

```text
POST /api/generate-pdf
      │
      ├─ Parse multipart fields
      │       template     → JSON.parse → Template
      │       placeholders → JSON.parse → Record<string, string>
      │       csv (×N)     → parseTableData → string[][]
      │       metadata     → JSON.parse → PdfMetadata
      │       password     → string
      │
      ├─ collectAutoTables(template) — match each CSV by index
      ├─ applyValues(template, placeholderValues)
      ├─ applyAutoRows(template, rowsById)
      ├─ convertTemplateImages(template) — fetch & convert images via sharp
      ├─ registerFontsServer(template.fonts) — register bundled + uploaded fonts
      │
      ├─ renderToBuffer(<PdfDocument template={resolved} metadata={metadata} />)
      │       → Buffer
      │
      ├─ convertToPdfA(buffer, options) — optional, if pdfa settings provided
      ├─ signPdf(buffer, options)       — optional, if signature settings provided
      ├─ encryptPdf(buffer, password)   — optional, if password provided
      │
      │   Pipeline order: PDF/A → Sign → Encrypt
      │   (PDF/A must come first; encryption must come last)
      │
      └─ Response(200, application/pdf)
```
