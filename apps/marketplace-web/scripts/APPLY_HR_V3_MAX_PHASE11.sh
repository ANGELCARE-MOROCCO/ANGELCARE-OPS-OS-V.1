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

echo "Phase 11 route check:"
for f in   "app/(protected)/hr/enterprise-dashboard/page.tsx"   "app/(protected)/hr/kpi-drilldowns/page.tsx"   "app/(protected)/hr/activity-timeline/page.tsx"   "app/(protected)/hr/saved-views/page.tsx"   "app/(protected)/hr/boardroom/page.tsx"   "lib/hr-unified/max-phase11-data.ts"   "lib/hr-unified/max-phase11-actions.ts"   "lib/supabase/migrations/114_hr_v3_max_phase11_enterprise_ux_depth.sql"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "Run SQL:"
echo "lib/supabase/migrations/114_hr_v3_max_phase11_enterprise_ux_depth.sql"
echo ""
echo "Then:"
echo "rm -rf .next"
echo "npm run build"
