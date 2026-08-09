#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CWD="$(pwd)"

if [ -f "$CWD/package.json" ]; then
  APP_ROOT="$CWD"
elif [ -f "$SCRIPT_DIR/../package.json" ]; then
  APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  echo "Could not detect app root"
  exit 1
fi

mkdir -p "$APP_ROOT/app" "$APP_ROOT/lib" "$APP_ROOT/components"

cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/" || true
cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/" || true
cp -R "$SCRIPT_DIR/components/"* "$APP_ROOT/components/" || true

echo "OPSOS AI Copilot Mega Pack V1 installed."
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"
