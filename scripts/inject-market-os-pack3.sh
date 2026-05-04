#!/usr/bin/env bash
set -euo pipefail
ZIP="${1:-MARKET_OS_EXECUTION_PACK3_ZERO_DEAD_BUTTON_DEEP_PRODUCTION.zip}"
if [ ! -f "$ZIP" ]; then
  echo "Zip not found: $ZIP"
  exit 1
fi
BACKUP="../backup-before-market-os-pack3-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup at $BACKUP"
cp -R . "$BACKUP"
echo "Injecting $ZIP"
unzip -o "$ZIP"
echo "Done. Now run Supabase SQL: supabase/migrations/20260502_market_os_execution_pack3_deep_foundation.sql"
echo "Then run: npm run build"
