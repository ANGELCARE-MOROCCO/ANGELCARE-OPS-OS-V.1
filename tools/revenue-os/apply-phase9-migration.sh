#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/Users/user/Desktop/angelcare-platform}"
: "${DATABASE_URL:?DATABASE_URL must contain the Supabase Session Pooler URL}"
SQL="$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase9_commands_3000.sql"
VERIFY="$ROOT/apps/ops-web/docs/revenue-command-os/phase-09/VERIFY.sql"
[[ -s "$SQL" ]] || { echo "MZ09 migration not found: $SQL" >&2; exit 65; }
[[ -s "$VERIFY" ]] || { echo "MZ09 verification not found: $VERIFY" >&2; exit 66; }
export PGOPTIONS="${PGOPTIONS:--c statement_timeout=0 -c lock_timeout=0}"
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-30}"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c "select count(*) as mz08_commands from public.revenue_os_command_library_active;"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$SQL" 2>&1 | tee "$HOME/Desktop/MZ09_DATABASE_APPLY.log"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$VERIFY" 2>&1 | tee "$HOME/Desktop/MZ09_DATABASE_VERIFY.log"
COUNT="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -c "select count(*) from public.revenue_os_command_library_active;")"
[[ "$COUNT" == "3000" ]] || { echo "MZ09 verification failed: expected 3000, got $COUNT" >&2; exit 67; }
echo "✓ MZ09 database verified at exactly 3,000 commands"
