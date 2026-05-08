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

REPORT="$APP_ROOT/HR_PHASE6_INTEGRATION_REPORT.txt"
: > "$REPORT"

echo "HR V3 MAX Phase 6 Integration Report" | tee -a "$REPORT"
echo "App root: $APP_ROOT" | tee -a "$REPORT"
echo "Date: $(date)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

echo "Phase 6 route check:" | tee -a "$REPORT"
for f in \
  "app/(protected)/hr/navigation/page.tsx" \
  "app/(protected)/hr/route-map/page.tsx" \
  "app/(protected)/hr/system-health/page.tsx" \
  "app/(protected)/hr/_components/HRPhase6Nav.tsx" \
  "lib/hr-unified/max-phase6-routes.ts" \
  "lib/supabase/migrations/109_hr_v3_max_phase6_integration_navigation.sql"
do
  if [ -f "$APP_ROOT/$f" ]; then
    echo "OK  $f" | tee -a "$REPORT"
  else
    echo "MISS $f" | tee -a "$REPORT"
  fi
done

echo "" | tee -a "$REPORT"
echo "Current HR route inventory:" | tee -a "$REPORT"
if [ -d "$APP_ROOT/app/(protected)/hr" ]; then
  find "$APP_ROOT/app/(protected)/hr" -maxdepth 5 -name "page.tsx" | sed "s#$APP_ROOT/##" | sort | tee -a "$REPORT"
else
  echo "MISS app/(protected)/hr" | tee -a "$REPORT"
fi

echo "" | tee -a "$REPORT"
echo "Run SQL:" | tee -a "$REPORT"
echo "lib/supabase/migrations/109_hr_v3_max_phase6_integration_navigation.sql" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
echo "Then:" | tee -a "$REPORT"
echo "rm -rf .next" | tee -a "$REPORT"
echo "npm run build" | tee -a "$REPORT"
