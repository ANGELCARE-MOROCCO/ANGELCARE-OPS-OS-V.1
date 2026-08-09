#!/usr/bin/env bash
set -euo pipefail

echo "Injecting Market-OS Pack 4 into current app root..."
ROOT="$(pwd)"
BACKUP="../backup-before-market-os-pack4-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"
for path in lib/market-os app/api/market-os app/'(protected)'/market-os/_lib supabase/migrations scripts; do
  if [ -e "$ROOT/$path" ]; then
    mkdir -p "$BACKUP/$(dirname "$path")"
    cp -R "$ROOT/$path" "$BACKUP/$path"
  fi
done
cp -R ./* "$ROOT/"
echo "Done. Backup saved at: $BACKUP"
echo "Run Supabase SQL: supabase/migrations/20260502_market_os_execution_pack4_workspace_persistence_qa.sql"
