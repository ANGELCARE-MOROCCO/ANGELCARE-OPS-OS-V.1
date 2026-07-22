#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"
: "${DATABASE_URL:?DATABASE_URL is required}"
PSQL="${PSQL_BIN:-psql}"
MIG="$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase15_premium_cockpit.sql"
VERIFY="$ROOT/apps/ops-web/docs/revenue-command-os/phase-15/VERIFY.sql"
[[ -f "$MIG" && -f "$VERIFY" ]] || { echo 'MZ15 migration or verification SQL missing'; exit 1; }
"$PSQL" "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$MIG"
"$PSQL" "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$VERIFY"
echo '✓ MZ15 database migration and verification completed.'
