#!/bin/bash
#
# Generate PDFs from all templates using both pdf-creator and pdfa-generator.
# Output: sample-pdf/<template-id>-nextjs.pdf and sample-pdf/<template-id>-pdfa.pdf
#
# The pdfa-generator output is post-processed through /api/convert-to-pdfa so the
# resulting file is PDF/A-2b compliant (configurable via PDFA_PART/PDFA_CONFORMANCE).
#
# Requirements:
#   - pdf-creator running on http://localhost:3000
#   - pdfa-generator running on http://localhost:8090
#   - python3 available (used for base64/JSON marshalling)
#

set -e

SAMPLES_DIR="pdf-creator/public/samples"
OUTPUT_DIR="sample-pdf"
NEXTJS_URL="http://localhost:3000/api/generate-pdf"
PDFBOX_URL="http://localhost:8090/api/generate"
PDFA_CONVERT_URL="http://localhost:8090/api/convert-to-pdfa"

# PDF/A target — part: 1|2|3, conformance: A|B|U (default PDF/A-2b)
PDFA_PART="${PDFA_PART:-2}"
PDFA_CONFORMANCE="${PDFA_CONFORMANCE:-B}"

mkdir -p "$OUTPUT_DIR"

# Templates to generate (matching sample dirs that have template.json)
TEMPLATES=(
  report invoice employee-directory sensor-dashboard chart-showcase
  sensor-report cv cover-letter meeting-minutes project-proposal
  purchase-order quotation certificate nda research-paper
  lesson-plan event-invitation travel-itinerary
)

echo "=== Generating PDFs from both endpoints ==="
echo ""

for id in "${TEMPLATES[@]}"; do
  SAMPLE_DIR="$SAMPLES_DIR/$id"
  TEMPLATE_FILE="$SAMPLE_DIR/template.json"

  if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "SKIP $id — no template.json"
    continue
  fi

  # Check for placeholders
  PLACEHOLDERS_FILE="$SAMPLE_DIR/placeholders.json"
  HAS_PLACEHOLDERS=false
  if [ -f "$PLACEHOLDERS_FILE" ]; then
    HAS_PLACEHOLDERS=true
  fi

  # Check for CSV files
  CSV_FILES=()
  for csv in "$SAMPLE_DIR"/*.csv; do
    [ -f "$csv" ] && CSV_FILES+=("$csv")
  done

  # Check for metadata
  METADATA_FILE="$SAMPLE_DIR/metadata.json"
  HAS_METADATA=false
  if [ -f "$METADATA_FILE" ]; then
    HAS_METADATA=true
  fi

  echo "--- $id ---"

  # ── 1. Generate via Next.js (pdf-creator) ──
  NEXTJS_OUT="$OUTPUT_DIR/${id}-nextjs.pdf"
  CURL_ARGS=(-s -X POST "$NEXTJS_URL" -F "template=@$TEMPLATE_FILE")

  if [ "$HAS_PLACEHOLDERS" = true ]; then
    CURL_ARGS+=(-F "placeholders=@$PLACEHOLDERS_FILE")
  fi
  for csv in "${CSV_FILES[@]}"; do
    CURL_ARGS+=(-F "csv=@$csv")
  done
  if [ "$HAS_METADATA" = true ]; then
    CURL_ARGS+=(-F "metadata=@$METADATA_FILE")
  fi

  HTTP_CODE=$(curl "${CURL_ARGS[@]}" -o "$NEXTJS_OUT" -w "%{http_code}")
  if [ "$HTTP_CODE" = "200" ]; then
    SIZE=$(stat -c%s "$NEXTJS_OUT" 2>/dev/null || stat -f%z "$NEXTJS_OUT")
    echo "  Next.js:  OK  ($SIZE bytes)"
  else
    echo "  Next.js:  FAIL (HTTP $HTTP_CODE)"
    # Show error if JSON response
    if file "$NEXTJS_OUT" | grep -q "text\|JSON"; then
      cat "$NEXTJS_OUT"
      echo ""
    fi
    rm -f "$NEXTJS_OUT"
  fi

  # ── 2. Generate via pdfa-generator (PDFBox) and convert to PDF/A ──
  PDFA_OUT="$OUTPUT_DIR/${id}-pdfa.pdf"
  RAW_PDF=$(mktemp --suffix=.pdf)
  CONVERT_REQ=$(mktemp --suffix=.json)
  CONVERT_RESP=$(mktemp --suffix=.json)

  # Build JSON request body
  TEMPLATE_JSON=$(cat "$TEMPLATE_FILE")
  REQUEST_JSON="{\"template\": $TEMPLATE_JSON"

  if [ "$HAS_PLACEHOLDERS" = true ]; then
    PLACEHOLDERS_JSON=$(cat "$PLACEHOLDERS_FILE")
    REQUEST_JSON="$REQUEST_JSON, \"placeholders\": $PLACEHOLDERS_JSON"
  fi

  if [ ${#CSV_FILES[@]} -gt 0 ]; then
    CSV_ARRAY="["
    FIRST=true
    for csv in "${CSV_FILES[@]}"; do
      CSV_CONTENT=$(cat "$csv" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        CSV_ARRAY="$CSV_ARRAY,"
      fi
      CSV_ARRAY="$CSV_ARRAY $CSV_CONTENT"
    done
    CSV_ARRAY="$CSV_ARRAY]"
    REQUEST_JSON="$REQUEST_JSON, \"csv\": $CSV_ARRAY"
  fi

  if [ "$HAS_METADATA" = true ]; then
    METADATA_JSON=$(cat "$METADATA_FILE")
    REQUEST_JSON="$REQUEST_JSON, \"metadata\": $METADATA_JSON"
  fi

  REQUEST_JSON="$REQUEST_JSON}"

  # Step A: generate PDF (binary response)
  HTTP_CODE=$(curl -s -X POST "$PDFBOX_URL" \
    -H "Content-Type: application/json" \
    -H "Accept: application/pdf" \
    -d "$REQUEST_JSON" \
    -o "$RAW_PDF" \
    -w "%{http_code}")

  if [ "$HTTP_CODE" != "200" ]; then
    echo "  PDF/A:    FAIL (generate HTTP $HTTP_CODE)"
    if file "$RAW_PDF" | grep -q "text\|JSON"; then
      cat "$RAW_PDF"
      echo ""
    fi
    rm -f "$RAW_PDF" "$CONVERT_REQ" "$CONVERT_RESP"
    echo ""
    continue
  fi

  # Step B: build conversion request and POST to /api/convert-to-pdfa
  python3 -c "
import base64, json, sys
with open(sys.argv[1], 'rb') as f:
    pdf_b64 = base64.b64encode(f.read()).decode()
with open(sys.argv[2], 'w') as out:
    json.dump({
        'pdf': pdf_b64,
        'part': int(sys.argv[3]),
        'conformance': sys.argv[4],
    }, out)
" "$RAW_PDF" "$CONVERT_REQ" "$PDFA_PART" "$PDFA_CONFORMANCE"

  HTTP_CODE=$(curl -s -X POST "$PDFA_CONVERT_URL" \
    -H "Content-Type: application/json" \
    -d @"$CONVERT_REQ" \
    -o "$CONVERT_RESP" \
    -w "%{http_code}")

  if [ "$HTTP_CODE" = "200" ]; then
    python3 -c "
import base64, json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
with open(sys.argv[2], 'wb') as out:
    out.write(base64.b64decode(data['pdf']))
" "$CONVERT_RESP" "$PDFA_OUT"
    SIZE=$(stat -c%s "$PDFA_OUT" 2>/dev/null || stat -f%z "$PDFA_OUT")
    echo "  PDF/A:    OK  ($SIZE bytes, PDF/A-${PDFA_PART}${PDFA_CONFORMANCE,,})"
  else
    echo "  PDF/A:    FAIL (convert HTTP $HTTP_CODE)"
    if file "$CONVERT_RESP" | grep -q "text\|JSON"; then
      cat "$CONVERT_RESP"
      echo ""
    fi
  fi

  rm -f "$RAW_PDF" "$CONVERT_REQ" "$CONVERT_RESP"
  echo ""
done

echo "=== Done ==="
echo "Output files in: $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR/"
