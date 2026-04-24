# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full-stack PDF generation platform with two independent services that share the same template JSON schema.

| Service | Stack | Port | Role |
|---|---|---|---|
| `pdf-creator/` | Next.js 16, React 19, TypeScript | 3000 | WYSIWYG template editor + PDF generation via @react-pdf/renderer |
| `pdfa-generator/` | Java 17, PDFBox 3, BouncyCastle | 8090 | PDF generation, PDF/A conversion, encryption, signing, merge/split, watermarks, text/metadata extraction |

Both services generate PDFs from the same template JSON format. `pdf-creator` calls `pdfa-generator` for PDF/A conversion, signing, and encryption (via `PDFA_SERVICE_URL`).

## Commands

```bash
# Full stack
docker compose up --build       # Start both services

# pdf-creator (Next.js)
cd pdf-creator
npm install && npm run dev      # Dev server on :3000
npm test                        # Jest tests
npm run build                   # Production build

# pdfa-generator (Java)
cd pdfa-generator
mvn clean package               # Build fat JAR
mvn test                        # JUnit tests (>95% coverage enforced)
./run.sh                        # Build + run on :8090

# Sample PDFs (both services must be running)
bash generate-sample-pdfs.sh    # Generates comparison PDFs in sample-pdf/
```

## Key integration points

- `pdf-creator` delegates to `pdfa-generator` for post-processing: PDF/A → sign → encrypt (in that order; encryption breaks PDF/A compliance).
- Connection configured via `PDFA_SERVICE_URL` env var (default `http://localhost:8090`).
- Template JSON schema is defined in `pdf-creator/types/template.ts` and consumed by both services.
- `pdf-creator` supports server-side ECharts rendering; `pdfa-generator` requires pre-rendered chart images.
- Both services use the same bundled fonts directory (`pdf-creator/public/fonts/` or `pdfa-generator/fonts/`).
- Uploaded fonts are stored at `/tmp/pdf-creator-fonts/` and shared between services when colocated.

## Project structure

```
pdf-creator/              # Next.js app (see pdf-creator/CLAUDE.md)
pdfa-generator/           # Java microservice (see pdfa-generator/CLAUDE.md)
docker-compose.yml        # Orchestrates both services
generate-sample-pdfs.sh   # Generates PDFs from all 18 templates via both services
generate_presentation.py  # Python script to generate a 12-page platform overview PDF
```

See each service's own `CLAUDE.md` for detailed architecture and development guidance.
