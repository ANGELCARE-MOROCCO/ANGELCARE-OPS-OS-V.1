#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"; : "${DATABASE_URL:?DATABASE_URL required}"
SQL="$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase12_strategy_studio.sql"
VERIFY="$ROOT/apps/ops-web/docs/revenue-command-os/phase-12/VERIFY.sql"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$SQL"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$VERIFY"
echo '✓ MZ12 database migration and verification completed.'
