#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/Users/user/Desktop/angelcare-platform}"
: "${DATABASE_URL:?DATABASE_URL is required}"
SQL="$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase10_1_gemini_stabilization.sql"
VERIFY="$ROOT/apps/ops-web/docs/revenue-command-os/phase-10-1/VERIFY.sql"
[[ -s "$SQL" && -s "$VERIFY" ]] || { echo "MZ10.1 SQL or VERIFY missing"; exit 1; }
command -v psql >/dev/null || { echo "psql is required"; exit 1; }
export PGOPTIONS="${PGOPTIONS:--c statement_timeout=0 -c lock_timeout=0}"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "select count(*) from public.revenue_os_installations where installation_key='revenue-command-os' and release_code='AC-REVENUE-OS-MZ10-STRATEGY-BRAIN' and external_actions_enabled=false" | grep -qx '1' || { echo 'MZ10 verified prerequisite missing'; exit 1; }
set -o pipefail
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$SQL" 2>&1 | tee "$HOME/Desktop/MZ10_1_DATABASE_APPLY.log"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$VERIFY" 2>&1 | tee "$HOME/Desktop/MZ10_1_DATABASE_VERIFY.log"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "select count(*) from public.revenue_os_installations where installation_key='revenue-command-os' and release_code='AC-REVENUE-OS-MZ10.1-GEMINI-STABILIZATION' and external_actions_enabled=false" | grep -qx '1' || { echo 'MZ10.1 final verification failed'; exit 1; }
echo '✓ MZ10.1 database migration and verification completed.'
