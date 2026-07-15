#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CWD="$(pwd)"
if [ -f "$CWD/package.json" ]; then APP_ROOT="$CWD"; elif [ -f "$SCRIPT_DIR/../package.json" ]; then APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"; else echo "Could not detect app root"; exit 1; fi
mkdir -p "$APP_ROOT/app" "$APP_ROOT/lib" "$APP_ROOT/components"
if [ -d "$SCRIPT_DIR/app" ]; then cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/"; fi
if [ -d "$SCRIPT_DIR/lib" ]; then cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/"; fi
if [ -d "$SCRIPT_DIR/components" ]; then cp -R "$SCRIPT_DIR/components/"* "$APP_ROOT/components/"; fi
echo "OPSOS Automation Intelligence Mega Pack V1 installed."
echo "Run SQL: lib/supabase/migrations/120_opsos_automation_intelligence_mega_pack_v1.sql"
echo "Then: rm -rf .next && npm run build"
