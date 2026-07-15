#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CWD="$(pwd)"

if [ -f "$CWD/package.json" ]; then
  APP_ROOT="$CWD"
else
  APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

if [ -d "$SCRIPT_DIR/app" ]; then cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/"; fi
if [ -d "$SCRIPT_DIR/lib" ]; then cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/"; fi

echo "Phase 9 installed."
echo "Run SQL: lib/supabase/migrations/112_hr_v3_max_phase9_analytics_intelligence.sql"
echo "Then: rm -rf .next && npm run build"
