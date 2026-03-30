#!/usr/bin/env bash
#
# Run pdfa-generator locally.
# Usage: ./run.sh
#
# Builds the jar if it doesn't exist, then starts the service on port 8090.

set -euo pipefail
cd "$(dirname "$0")"

JAR="target/pdfa-generator-1.0.0.jar"

if [ ! -f "$JAR" ]; then
  echo "Building pdfa-generator..."
  mvn package -B -q
fi

export PORT="${PORT:-8090}"

echo "Starting pdfa-generator on port $PORT"
exec java -jar "$JAR"
