#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo root required}"
: "${DATABASE_URL:?DATABASE_URL is required}"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase14_propagation_autopilot.sql"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$ROOT/apps/ops-web/docs/revenue-command-os/phase-14/VERIFY.sql"
