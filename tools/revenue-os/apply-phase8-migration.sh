#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/Users/user/Desktop/angelcare-platform}"
: "${DATABASE_URL:?Set DATABASE_URL to the Supabase Session Pooler URL}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase8_commands_2000.sql"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/apps/ops-web/docs/revenue-command-os/phase-08/VERIFY.sql"
