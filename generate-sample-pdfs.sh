#!/bin/bash
#
# Generate PDFs from all templates using both pdf-creator and pdfa-generator.
# Output: sample-pdf/<template-id>-nextjs.pdf and sample-pdf/<template-id>-pdfbox.pdf
#
# Requirements:
#   - pdf-creator running on http://localhost:3000
#   - pdfa-generator running on http://localhost:8090
#

set -e

SAMPLES_DIR="pdf-creator/public/samples"
OUTPUT_DIR="sample-pdf"
NEXTJS_URL="http://localhost:3000/api/generate-pdf"
PDFBOX_URL="http://localhost:8090/api/generate"

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

  # ── 2. Generate via pdfa-generator (PDFBox) ──
  PDFBOX_OUT="$OUTPUT_DIR/${id}-pdfbox.pdf"

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

  HTTP_CODE=$(curl -s -X POST "$PDFBOX_URL" \
    -H "Content-Type: application/json" \
    -H "Accept: application/pdf" \
    -d "$REQUEST_JSON" \
    -o "$PDFBOX_OUT" \
    -w "%{http_code}")

  if [ "$HTTP_CODE" = "200" ]; then
    SIZE=$(stat -c%s "$PDFBOX_OUT" 2>/dev/null || stat -f%z "$PDFBOX_OUT")
    echo "  PDFBox:   OK  ($SIZE bytes)"
  else
    echo "  PDFBox:   FAIL (HTTP $HTTP_CODE)"
    if file "$PDFBOX_OUT" | grep -q "text\|JSON"; then
      cat "$PDFBOX_OUT"
      echo ""
    fi
    rm -f "$PDFBOX_OUT"
  fi

  echo ""
done

echo "=== Done ==="
echo "Output files in: $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR/"
