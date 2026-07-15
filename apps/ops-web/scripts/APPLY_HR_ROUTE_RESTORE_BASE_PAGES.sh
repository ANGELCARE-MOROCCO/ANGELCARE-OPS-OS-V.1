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
  echo "ERROR: Could not detect app root. Run from app root or place this package inside app root."
  exit 1
fi

echo "Detected app root: $APP_ROOT"
mkdir -p "$APP_ROOT/app" "$APP_ROOT/lib"

if [ -d "$SCRIPT_DIR/app" ]; then cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/"; fi
if [ -d "$SCRIPT_DIR/lib" ]; then cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/"; fi

echo ""
echo "Restored route check:"
for f in   "app/(protected)/hr/openings/page.tsx"   "app/(protected)/hr/openings/new/page.tsx"   "app/(protected)/hr/openings/[id]/page.tsx"   "app/(protected)/hr/recruitment/page.tsx"   "app/(protected)/hr/recruitment/kanban/page.tsx"   "app/(protected)/hr/recruitment/candidates/page.tsx"   "app/(protected)/hr/recruitment/candidates/[id]/page.tsx"   "app/(protected)/hr/onboarding/page.tsx"   "app/(protected)/hr/onboarding/checklists/page.tsx"   "app/(protected)/hr/onboarding/[id]/page.tsx"   "app/(protected)/hr/staff/page.tsx"   "app/(protected)/hr/staff/new/page.tsx"   "app/(protected)/hr/staff/[id]/page.tsx"   "app/(protected)/hr/departments/page.tsx"   "app/(protected)/hr/positions/page.tsx"   "app/(protected)/hr/rosters/page.tsx"   "app/(protected)/hr/rosters/planner/page.tsx"   "app/(protected)/hr/attendance/page.tsx"   "app/(protected)/hr/attendance/corrections/page.tsx"   "app/(protected)/hr/reports/page.tsx"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"
