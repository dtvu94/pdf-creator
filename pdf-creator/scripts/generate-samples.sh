#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SAMPLES_DIR="$(cd "$(dirname "$0")/../public/samples" && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

mkdir -p "$OUTPUT_DIR"

generate_pdf() {
  local name="$1"
  local dir="$SAMPLES_DIR/$name"
  local out="$OUTPUT_DIR/$name.pdf"

  local args=(-X POST "$BASE_URL/api/generate-pdf")
  args+=(-F "template=@$dir/template.json;type=application/json")

  if [[ -f "$dir/placeholders.json" ]]; then
    args+=(-F "placeholders=@$dir/placeholders.json;type=application/json")
  fi

  if [[ -f "$dir/metadata.json" ]]; then
    args+=(-F "metadata=@$dir/metadata.json;type=application/json")
  fi

  args+=(-o "$out" -f -s -S)

  echo "Generating $out ..."
  if curl "${args[@]}"; then
    echo "  -> $out"
  else
    echo "  !! Failed to generate $name" >&2
  fi
}

# Invoice
generate_pdf "invoice"

# Professional CV
generate_pdf "cv"

# Annual Report
generate_pdf "report"
