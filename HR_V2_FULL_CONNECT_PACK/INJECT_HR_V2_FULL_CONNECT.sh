#!/usr/bin/env bash
set -e
ROOT="$(pwd)"
PACK_DIR="$(cd "$(dirname "$0")" && pwd)/HR_V2_FULL_CONNECT_FILES"
STAMP="$(date +%Y%m%d_%H%M%S)"

echo "🛡️  Backing up current HR files..."
mkdir -p "$ROOT/_backups/hr_v2_full_connect_$STAMP"
[ -d "$ROOT/app/(protected)/hr" ] && cp -R "$ROOT/app/(protected)/hr" "$ROOT/_backups/hr_v2_full_connect_$STAMP/hr" || true
[ -d "$ROOT/lib/hr-v2" ] && cp -R "$ROOT/lib/hr-v2" "$ROOT/_backups/hr_v2_full_connect_$STAMP/hr-v2" || true

echo "📦 Injecting HR V2 full connection files..."
cp -R "$PACK_DIR"/* "$ROOT"/

echo "✅ HR V2 Full Connect injected."
echo "➡️  Now run the SQL in Supabase: lib/supabase/migrations/011_hr_v2_full_connection.sql"
echo "➡️  Then run: npm run dev"
