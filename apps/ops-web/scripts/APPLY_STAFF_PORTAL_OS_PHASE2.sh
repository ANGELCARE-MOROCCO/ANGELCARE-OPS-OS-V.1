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

echo "Staff Portal OS Phase 2 installed:"
for f in \
  "app/(protected)/staff-services/page.tsx" \
  "app/(protected)/staff-services/new/page.tsx" \
  "app/(protected)/staff-home/_components/StaffPortalMemoPanelV2.tsx" \
  "lib/staff-portal-os/phase2-data.ts" \
  "lib/staff-portal-os/phase2-actions.ts" \
  "lib/supabase/migrations/117_staff_portal_os_phase2_memos_services.sql"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "Run SQL:"
echo "lib/supabase/migrations/117_staff_portal_os_phase2_memos_services.sql"
echo ""
echo "Then:"
echo "rm -rf .next"
echo "npm run build"
