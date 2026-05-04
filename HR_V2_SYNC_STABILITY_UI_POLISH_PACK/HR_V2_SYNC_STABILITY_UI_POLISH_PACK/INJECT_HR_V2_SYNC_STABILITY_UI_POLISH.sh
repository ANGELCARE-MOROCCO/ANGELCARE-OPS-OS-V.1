#!/usr/bin/env bash
set -e
ROOT=".."
STAMP=$(date +%Y%m%d_%H%M%S)
echo "Injecting HR V2 Sync Stability UI Polish Pack..."
mkdir -p "$ROOT/.angelcare_backups/hr_v2_sync_stability_$STAMP"
if [ -d "$ROOT/app/(protected)/hr" ]; then
  cp -R "$ROOT/app/(protected)/hr" "$ROOT/.angelcare_backups/hr_v2_sync_stability_$STAMP/hr" || true
fi
mkdir -p "$ROOT/app/components/hr-v2" "$ROOT/lib/hr-v2" "$ROOT/lib/supabase/migrations"
cp -R app/components/hr-v2/* "$ROOT/app/components/hr-v2/" 2>/dev/null || true
cp -R lib/hr-v2/* "$ROOT/lib/hr-v2/" 2>/dev/null || true
cp -R lib/supabase/migrations/* "$ROOT/lib/supabase/migrations/" 2>/dev/null || true
if [ -d "app/(protected)/hr" ]; then
  mkdir -p "$ROOT/app/(protected)/hr"
  cp -R "app/(protected)/hr"/* "$ROOT/app/(protected)/hr/"
fi
echo "Done. Backup: .angelcare_backups/hr_v2_sync_stability_$STAMP"
echo "Run Supabase SQL: lib/supabase/migrations/019_hr_v2_sync_stability_ui_polish.sql"
