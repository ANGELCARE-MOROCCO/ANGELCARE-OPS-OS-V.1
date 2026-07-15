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

echo "Phase 13 route check:"
for f in   "app/(protected)/hr/launch-center/page.tsx"   "app/(protected)/hr/adoption-tracker/page.tsx"   "app/(protected)/hr/documentation/page.tsx"   "app/(protected)/hr/operator-training/page.tsx"   "lib/hr-unified/max-phase13-data.ts"   "lib/hr-unified/max-phase13-actions.ts"   "lib/supabase/migrations/116_hr_v3_max_phase13_launch_polish.sql"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "Run SQL:"
echo "lib/supabase/migrations/116_hr_v3_max_phase13_launch_polish.sql"
echo ""
echo "Then:"
echo "rm -rf .next"
echo "npm run build"
