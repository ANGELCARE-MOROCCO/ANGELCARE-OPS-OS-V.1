#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
echo "Injecting HR V2 Execution Pages Pack..."
mkdir -p "$ROOT/_backups/hr_v2_execution_$STAMP"
if [ -d "$ROOT/app/(protected)/hr" ]; then
  cp -R "$ROOT/app/(protected)/hr" "$ROOT/_backups/hr_v2_execution_$STAMP/hr_backup" || true
fi
cp -R app "$ROOT/"
cp -R components "$ROOT/" 2>/dev/null || true
cp -R lib "$ROOT/" 2>/dev/null || true
echo "Done. Backup stored in _backups/hr_v2_execution_$STAMP"
echo "Run Supabase SQL: lib/supabase/migrations/012_hr_v2_execution_pages.sql"
echo "Then run: npm run dev"
