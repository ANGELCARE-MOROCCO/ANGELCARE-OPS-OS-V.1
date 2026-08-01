#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$PWD}"
SQL="$APP/supabase/migrations/20260731_angelcare360_operator_commercial_growth_customer_os.sql"
URL="${ANGELCARE_COMMERCIAL_GROWTH_DATABASE_URL:-${DATABASE_URL:-}}"
[ -f "$SQL" ] || { echo "FAIL: migration not found: $SQL"; exit 1; }
[ -n "$URL" ] || { echo "FAIL: set ANGELCARE_COMMERCIAL_GROWTH_DATABASE_URL or DATABASE_URL"; exit 1; }
command -v psql >/dev/null || { echo "FAIL: psql is not available"; exit 1; }
psql "$URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "PASS: Commercial Growth & Customer Portfolio migration applied."
