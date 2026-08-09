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

echo "Phase 10 route check:"
for f in   "app/(protected)/hr/sync-center/page.tsx"   "app/(protected)/hr/linked-records/page.tsx"   "app/(protected)/hr/crud-audit/page.tsx"   "app/(protected)/hr/data-quality/page.tsx"   "lib/hr-unified/max-phase10-data.ts"   "lib/hr-unified/max-phase10-actions.ts"   "lib/supabase/migrations/113_hr_v3_max_phase10_sync_crud_hardening.sql"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "Run SQL:"
echo "lib/supabase/migrations/113_hr_v3_max_phase10_sync_crud_hardening.sql"
echo ""
echo "Then:"
echo "rm -rf .next"
echo "npm run build"
