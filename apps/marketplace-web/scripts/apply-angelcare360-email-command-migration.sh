#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SQL="$APP/supabase/migrations/20260801_angelcare360_operator_email_automation_correspondence_os.sql"
DATABASE_URL_VALUE="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
[ -f "$SQL" ] || { echo "FAIL: migration missing: $SQL"; exit 1; }
[ -n "$DATABASE_URL_VALUE" ] || { echo "FAIL: set SUPABASE_DB_URL or DATABASE_URL."; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "FAIL: psql is required for automatic migration mode."; exit 1; }
psql "$DATABASE_URL_VALUE" -v ON_ERROR_STOP=1 -f "$SQL"
