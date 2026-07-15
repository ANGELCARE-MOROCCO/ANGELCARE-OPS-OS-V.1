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

echo "OPSOS Execution Engine Mega Pack V1 installed:"
for f in \
  "components/angelcare-enterprise/ExecutionEngineUI.tsx" \
  "lib/opsos-execution/data.ts" \
  "lib/opsos-execution/actions.ts" \
  "lib/supabase/migrations/119_opsos_execution_engine_mega_pack_v1.sql" \
  "app/(protected)/execution-engine/page.tsx" \
  "app/(protected)/execution-engine/workflows/page.tsx" \
  "app/(protected)/execution-engine/workflows/new/page.tsx" \
  "app/(protected)/execution-engine/command-actions/page.tsx" \
  "app/(protected)/execution-engine/escalations/page.tsx" \
  "app/(protected)/execution-engine/sync-map/page.tsx" \
  "app/(protected)/execution-engine/final-qa/page.tsx"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "Run SQL:"
echo "lib/supabase/migrations/119_opsos_execution_engine_mega_pack_v1.sql"
echo ""
echo "Then:"
echo "rm -rf .next"
echo "npm run build"
