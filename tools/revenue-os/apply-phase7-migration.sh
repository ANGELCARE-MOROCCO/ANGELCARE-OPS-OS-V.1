#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-}"
if [[ -z "$ROOT" ]]; then
  echo "Usage: DATABASE_URL='postgresql://...' bash tools/revenue-os/apply-phase7-migration.sh /Users/user/Desktop/angelcare-platform" >&2
  exit 64
fi
[[ -n "${DATABASE_URL:-}" ]] || { echo "DATABASE_URL is required in the environment." >&2; exit 65; }
command -v psql >/dev/null 2>&1 || { echo "psql is required." >&2; exit 66; }
ROOT="$(cd "$ROOT" && pwd)"
MIGRATION="$ROOT/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase7_commands_1000.sql"
VERIFY="$ROOT/apps/ops-web/docs/revenue-command-os/phase-07/VERIFY.sql"
[[ -f "$MIGRATION" ]] || { echo "Migration missing: $MIGRATION" >&2; exit 67; }
[[ -f "$VERIFY" ]] || { echo "Verification SQL missing: $VERIFY" >&2; exit 68; }
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$VERIFY"
