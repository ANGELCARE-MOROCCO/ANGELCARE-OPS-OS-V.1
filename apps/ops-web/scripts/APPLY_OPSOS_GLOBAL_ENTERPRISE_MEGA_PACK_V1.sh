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

mkdir -p "$APP_ROOT/app" "$APP_ROOT/lib" "$APP_ROOT/components"

if [ -d "$SCRIPT_DIR/app" ]; then cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/"; fi
if [ -d "$SCRIPT_DIR/lib" ]; then cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/"; fi
if [ -d "$SCRIPT_DIR/components" ]; then cp -R "$SCRIPT_DIR/components/"* "$APP_ROOT/components/"; fi

echo "OPSOS Global Enterprise Mega Pack V1 installed:"
for f in \
  "components/angelcare-enterprise/GlobalEnterpriseUI.tsx" \
  "lib/opsos-global/mega-pack-v1.ts" \
  "app/(protected)/enterprise-command/page.tsx" \
  "app/(protected)/executive-cockpit/page.tsx" \
  "app/(protected)/module-specialization/page.tsx" \
  "app/(protected)/operations-war-room/page.tsx" \
  "app/(protected)/growth-war-room/page.tsx" \
  "app/(protected)/revenue-war-room/page.tsx" \
  "app/(protected)/academy-campus-command/page.tsx" \
  "app/(protected)/opsos-final-qa/page.tsx" \
  "app/(protected)/opsos-design-system/page.tsx"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "No SQL required."
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"
