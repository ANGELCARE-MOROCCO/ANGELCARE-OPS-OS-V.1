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

mkdir -p "$APP_ROOT/app" "$APP_ROOT/lib"

if [ -d "$SCRIPT_DIR/app" ]; then cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/"; fi
if [ -d "$SCRIPT_DIR/lib" ]; then cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/"; fi

if [ -f "$APP_ROOT/app/(protected)/staff-home/page.tsx" ]; then
  cp "$APP_ROOT/app/(protected)/staff-home/page.tsx" "$APP_ROOT/app/(protected)/staff-home/page.tsx.backup_phase3_$(date +%Y%m%d_%H%M%S)"
  (cd "$APP_ROOT" && python3 "$SCRIPT_DIR/PATCH_STAFF_HOME_PHASE3.py")
fi

echo "Staff Portal OS Phase 3 installed:"
for f in \
  "lib/staff-portal-os/phase3-personalization.ts" \
  "app/(protected)/staff-home/_components/StaffPersonaStrip.tsx" \
  "app/(protected)/staff-portal-intelligence/page.tsx" \
  "app/(protected)/team-command/page.tsx"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "No SQL required."
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"
