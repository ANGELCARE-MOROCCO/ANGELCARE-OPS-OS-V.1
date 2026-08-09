#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CWD="$(pwd)"

# Detect app root safely.
if [ -f "$CWD/package.json" ]; then
  APP_ROOT="$CWD"
elif [ -f "$SCRIPT_DIR/package.json" ]; then
  APP_ROOT="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../package.json" ]; then
  APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  echo "ERROR: Could not detect app root. Run this script from your app root, or place this package inside your app root."
  exit 1
fi

echo "Detected app root: $APP_ROOT"
echo "Package source: $SCRIPT_DIR"

# Copy/merge package folders into app root.
mkdir -p "$APP_ROOT/app" "$APP_ROOT/lib"

if [ -d "$SCRIPT_DIR/app" ]; then
  cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/"
fi

if [ -d "$SCRIPT_DIR/lib" ]; then
  cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/"
fi

echo ""
echo "Route files now expected:"
for f in \
  "app/(protected)/hr/page.tsx" \
  "app/(protected)/hr/recruitment/page.tsx" \
  "app/(protected)/hr/recruitment/kanban/page.tsx" \
  "app/(protected)/hr/recruitment/candidates/page.tsx" \
  "app/(protected)/hr/recruitment/candidates/[id]/page.tsx" \
  "app/(protected)/hr/tasks/page.tsx" \
  "app/(protected)/hr/approvals/page.tsx" \
  "app/(protected)/hr/executive/page.tsx" \
  "app/(protected)/hr/_components/HRMaxUI.tsx" \
  "lib/hr-unified/max-phase1-data.ts" \
  "lib/hr-unified/max-phase1-actions.ts" \
  "lib/supabase/migrations/104_hr_v3_max_phase1_verified.sql"
do
  if [ -f "$APP_ROOT/$f" ]; then
    echo "OK  $f"
  else
    echo "MISS $f"
  fi
done

echo ""
echo "Now run SQL if not already done:"
echo "lib/supabase/migrations/104_hr_v3_max_phase1_verified.sql"
echo ""
echo "Then clean and build:"
echo "rm -rf .next"
echo "npm run build"
