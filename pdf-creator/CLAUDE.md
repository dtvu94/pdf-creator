# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Dev server on http://localhost:3000
npm run build            # Production build
npm start                # Production server
npm test                 # Jest test suite
npm run test:coverage    # Tests with coverage report
npm run lint             # ESLint
npx jest path/to/file    # Run a single test file
```

## Architecture

Next.js 16 app (React 19, TypeScript 5) — a WYSIWYG PDF template editor with a REST API for server-side generation.

### Core flow

1. **Home page** (`app/page.tsx`) — `TemplateGallery` displays built-in templates from `TEMPLATE_REGISTRY` (defined in `lib/templates/index.ts`).
2. **Editor** (`app/editor/page.tsx`) — `EditorClient` loads a template, then delegates to `PdfEditor` (`components/PdfEditor/index.tsx`) which orchestrates canvas, toolbar, properties panel, and editor hooks (`useHistory`, `useAutoSave`, `useSelection`, `useDragAndResize`, `useKeyboardShortcuts`).
3. **Export** — two paths:
   - **Client-side**: `components/PdfTemplate.tsx` renders via `@react-pdf/renderer` → blob → download.
   - **Server-side**: `POST /api/generate-pdf` (`app/api/generate-pdf/route.tsx`) accepts multipart form data (template JSON, placeholders, CSV, metadata, password, PDF/A, signature settings) → applies data → renders charts (ECharts SVG→PNG via sharp) → `renderToBuffer()` via `lib/serverPdfRenderer.tsx` → optional PDF/A → sign → encrypt → returns PDF binary.

### Intentional duplication

`components/PdfTemplate.tsx` (client) and `lib/serverPdfRenderer.tsx` (server) are intentional duplicates of the same React PDF tree. Next.js client-reference proxies prevent sharing a single module across both contexts. Changes to one must be mirrored in the other.

Similarly, `lib/fontRegistry.ts` (client, uses URL fetches) and `lib/fontRegistry.server.ts` (server, uses filesystem paths) are split for the same reason.

### Type system

All element and template types live in `types/template.ts`. `TemplateElement` is a discriminated union (discriminant: `type` field) covering: text, heading, link, divider, table, image, card, chart, shape, repeater.

### Placeholder system

`lib/placeholders.ts` handles `{{token}}` extraction and substitution. Reserved tokens `{{page_number}}` and `{{total_pages}}` are resolved at render time, not at fill time.

### PDF post-processing order

PDF/A conversion → digital signature → password encryption. Encryption is incompatible with PDF/A. The external service URL is `PDFA_SERVICE_URL` (default `http://localhost:8090`).

### API routes

| Route | Purpose |
|---|---|
| `POST /api/generate-pdf` | Generate PDF from template + data |
| `POST /api/fonts` | Upload custom font, returns `{ref}` |
| `POST /api/fonts/status` | Check which uploaded font refs still exist |
| `GET /api/fonts/[id]` | Serve uploaded font by ref |
| `POST /api/fonts/cleanup` | Delete fonts older than 24h (optional `CRON_SECRET` auth) |
| `POST /api/share` | Store template, returns `{shareId}` |
| `GET /api/share/[id]` | Retrieve shared template |

### Key conventions

- Template constants: `UPPER_SNAKE_CASE` ending in `_TEMPLATE` (e.g. `INVOICE_TEMPLATE`).
- Component files: PascalCase `.tsx`. Lib/util files: camelCase `.ts`/`.tsx`.
- Tests: `__tests__/{name}.test.ts(x)` adjacent to source.
- History capped at 80 snapshots (`MAX_HISTORY` in `lib/useHistory.ts`).
- Uploaded fonts stored in `/tmp/pdf-creator-fonts/`, bundled fonts in `public/fonts/`.

### Adding a new element type

1. Add interface extending `BaseElement` in `types/template.ts`, add to `TemplateElement` union.
2. Add renderer in **both** `components/PdfTemplate.tsx` and `lib/serverPdfRenderer.tsx`.
3. Add properties section in `components/PropertiesPanel/`.
4. Add insert handler in `lib/templates/utils.ts`.

### Adding a new template

1. Create `lib/templates/{name}.ts` exporting `{NAME}_TEMPLATE`.
2. Import and register in `lib/templates/index.ts` (`TEMPLATE_REGISTRY` + `getTemplateById`).
3. Run `npx tsx scripts/export-templates.ts` to generate `public/samples/{name}/` JSON files.
