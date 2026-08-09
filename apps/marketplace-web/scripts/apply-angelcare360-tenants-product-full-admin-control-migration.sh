#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
SQL="$APP/supabase/migrations/20260731_angelcare360_operator_product_full_admin_control.sql"
URL="${ANGELCARE_PRODUCT_KERNEL_DATABASE_URL:-${DATABASE_URL:-}}"
if [ ! -f "$SQL" ]; then echo "FAIL: migration not found: $SQL"; exit 1; fi
if [ -z "$URL" ]; then echo "FAIL: set ANGELCARE_PRODUCT_KERNEL_DATABASE_URL or DATABASE_URL"; exit 1; fi
if ! command -v psql >/dev/null 2>&1; then echo "FAIL: psql not available"; exit 1; fi
psql "$URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "PASS: Product Full Administrator Control migration applied."
