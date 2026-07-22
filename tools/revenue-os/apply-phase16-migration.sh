#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?root required}"
: "${DATABASE_URL:?DATABASE_URL required}"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase16_mega_production.sql"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$ROOT/apps/ops-web/docs/revenue-command-os/phase-16/VERIFY.sql"
