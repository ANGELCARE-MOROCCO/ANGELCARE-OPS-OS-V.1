#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
SQL="$APP/supabase/migrations/20260731_angelcare360_operator_tenant_identity_access_security_command.sql"
URL="${ANGELCARE_TENANT_ACCESS_DATABASE_URL:-${DATABASE_URL:-}}"
[ -f "$SQL" ] || { echo "FAIL: SQL migration missing: $SQL"; exit 1; }
[ -n "$URL" ] || { echo "FAIL: set ANGELCARE_TENANT_ACCESS_DATABASE_URL or DATABASE_URL."; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "FAIL: psql is unavailable."; exit 1; }
psql "$URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "PASS: Tenant Identity & Access migration applied."
