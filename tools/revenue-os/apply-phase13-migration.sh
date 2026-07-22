#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"; : "${DATABASE_URL:?DATABASE_URL required}"
SQL="$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase13_mission_compiler.sql"
VERIFY="$ROOT/apps/ops-web/docs/revenue-command-os/phase-13/VERIFY.sql"
[[ -f "$SQL" && -f "$VERIFY" ]] || { echo 'MZ13 SQL or verification missing'; exit 1; }
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$SQL"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$VERIFY"
echo '✓ MZ13 database migration and verification completed.'
