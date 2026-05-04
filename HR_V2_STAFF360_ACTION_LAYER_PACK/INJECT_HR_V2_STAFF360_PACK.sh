#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
echo "Injecting HR V2 Staff 360 + Action Layer Pack..."
mkdir -p "$ROOT/_backups/hr_v2_staff360_$STAMP"
if [ -d "$ROOT/app/(protected)/hr" ]; then
  cp -R "$ROOT/app/(protected)/hr" "$ROOT/_backups/hr_v2_staff360_$STAMP/hr_backup" || true
fi
cp -R app "$ROOT/"
cp -R lib "$ROOT/" 2>/dev/null || true
echo "Done. Backup stored in _backups/hr_v2_staff360_$STAMP"
echo "Run Supabase SQL: lib/supabase/migrations/013_hr_v2_staff360_action_layer.sql"
echo "Then run: npm run dev"
