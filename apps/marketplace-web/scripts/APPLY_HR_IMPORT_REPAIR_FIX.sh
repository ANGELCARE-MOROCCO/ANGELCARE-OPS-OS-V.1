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
mkdir -p "$APP_ROOT/app/(protected)/hr/_components"
mkdir -p "$APP_ROOT/app/(protected)/hr/staff/new"

cp "$SCRIPT_DIR/app/(protected)/hr/_components/V3Primitives.tsx" "$APP_ROOT/app/(protected)/hr/_components/V3Primitives.tsx"
cp "$SCRIPT_DIR/app/(protected)/hr/staff/new/page.tsx" "$APP_ROOT/app/(protected)/hr/staff/new/page.tsx"

echo "Patched:"
echo "OK app/(protected)/hr/_components/V3Primitives.tsx"
echo "OK app/(protected)/hr/staff/new/page.tsx"
echo ""
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"
