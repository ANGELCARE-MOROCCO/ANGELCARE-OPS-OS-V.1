#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
SQL="$APP/supabase/migrations/20260731_angelcare360_operator_revenue_relationship_sovereign_os.sql"
URL="${ANGELCARE_REVENUE_RELATIONSHIP_DATABASE_URL:-${DATABASE_URL:-}}"
[ -f "$SQL" ] || { echo "FAIL: migration not found: $SQL"; exit 1; }
[ -n "$URL" ] || { echo "FAIL: set ANGELCARE_REVENUE_RELATIONSHIP_DATABASE_URL or DATABASE_URL."; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "FAIL: psql is required."; exit 1; }
psql "$URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "PASS: Revenue Relationship Sovereign migration applied."
