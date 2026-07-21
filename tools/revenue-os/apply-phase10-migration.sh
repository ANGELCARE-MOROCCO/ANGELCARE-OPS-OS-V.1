#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo root required}"; : "${DATABASE_URL:?DATABASE_URL required}"
export PGOPTIONS="${PGOPTIONS:--c statement_timeout=0 -c lock_timeout=0}"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase10_strategy_brain.sql"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$ROOT/apps/ops-web/docs/revenue-command-os/phase-10/VERIFY.sql"
