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

echo "Staff Portal OS Mega Phase 7 installed:"
for f in \
  "components/angelcare-enterprise/EnterpriseCommandUI.tsx" \
  "lib/staff-portal-os/mega-phase7.ts" \
  "app/(protected)/staff-home/page.tsx" \
  "app/(protected)/staff-portal-command/page.tsx" \
  "app/(protected)/staff-portal-executive/page.tsx" \
  "app/(protected)/staff-portal-workbench/page.tsx" \
  "app/(protected)/staff-portal-design-system/page.tsx" \
  "app/(protected)/staff-portal-mega-qa/page.tsx"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "No SQL required."
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"
