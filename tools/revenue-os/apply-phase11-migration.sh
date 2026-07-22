#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/Users/user/Desktop/angelcare-platform}"; : "${DATABASE_URL:?DATABASE_URL is required}"
M="$ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase11_validation_council.sql"; V="$ROOT/apps/ops-web/docs/revenue-command-os/phase-11/VERIFY.sql"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$M"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$V"
echo '✓ MZ11 database migration and verification completed.'
