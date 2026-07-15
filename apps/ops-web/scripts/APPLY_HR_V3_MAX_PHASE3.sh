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
  echo "ERROR: Could not detect app root. Run from app root or place package inside app root."
  exit 1
fi

echo "Detected app root: $APP_ROOT"
mkdir -p "$APP_ROOT/app" "$APP_ROOT/lib"

if [ -d "$SCRIPT_DIR/app" ]; then cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/"; fi
if [ -d "$SCRIPT_DIR/lib" ]; then cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/"; fi

echo "Phase 3 route check:"
for f in   "app/(protected)/hr/staff/new/page.tsx"   "app/(protected)/hr/documents/page.tsx"   "app/(protected)/hr/rosters/conflicts/page.tsx"   "app/(protected)/hr/onboarding/board/page.tsx"   "app/(protected)/hr/recruitment/interviews/page.tsx"   "app/(protected)/hr/recruitment/sources/page.tsx"   "app/(protected)/hr/openings/board/page.tsx"   "app/(protected)/hr/reports/export/page.tsx"   "app/(protected)/hr/settings/page.tsx"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "Run SQL:"
echo "lib/supabase/migrations/106_hr_v3_max_phase3_production_hardening.sql"
echo ""
echo "Then:"
echo "rm -rf .next"
echo "npm run build"
