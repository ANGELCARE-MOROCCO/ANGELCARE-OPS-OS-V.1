#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CWD="$(pwd)"

if [ -f "$CWD/package.json" ]; then
  APP_ROOT="$CWD"
elif [ -f "$SCRIPT_DIR/package.json" ]; then
  APP_ROOT="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../package.json" ]; then
  APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  echo "ERROR: Could not detect app root."
  exit 1
fi

echo "Detected app root: $APP_ROOT"
mkdir -p "$APP_ROOT/lib/hr-unified"
cp "$SCRIPT_DIR/lib/hr-unified/route-restore-data.ts" "$APP_ROOT/lib/hr-unified/route-restore-data.ts"

echo "Patched lib/hr-unified/route-restore-data.ts with corrections data."
echo ""
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"
