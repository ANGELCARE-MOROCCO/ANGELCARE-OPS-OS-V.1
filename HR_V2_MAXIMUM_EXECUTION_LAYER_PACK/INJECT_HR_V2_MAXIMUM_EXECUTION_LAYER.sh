#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)/.."
PACK="$(pwd)"
TS="$(date +%Y%m%d_%H%M%S)"

cd "$ROOT"
echo "Creating backup folder: .hr_v2_max_backup_$TS"
mkdir -p ".hr_v2_max_backup_$TS"
if [ -d "app/(protected)/hr" ]; then
  cp -R "app/(protected)/hr" ".hr_v2_max_backup_$TS/hr"
fi
mkdir -p app components lib/supabase/migrations
cp -R "$PACK/app" ./
cp -R "$PACK/components" ./
cp -R "$PACK/lib" ./
echo "HR V2 Maximum Execution Layer injected."
echo "Run the SQL migration: lib/supabase/migrations/015_hr_v2_maximum_execution_layer.sql"
