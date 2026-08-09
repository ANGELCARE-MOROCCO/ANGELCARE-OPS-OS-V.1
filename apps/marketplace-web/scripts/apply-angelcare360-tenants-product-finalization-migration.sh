#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${1:-$(pwd)}"
SQL_FILE="$APP_ROOT/supabase/migrations/20260730_angelcare360_operator_product_kernel_finalization.sql"
DATABASE_URL_VALUE="${ANGELCARE_PRODUCT_KERNEL_DATABASE_URL:-${DATABASE_URL:-}}"

if [ ! -f "$SQL_FILE" ]; then
  echo "FAIL: finalization migration not found: $SQL_FILE"
  exit 1
fi
if [ -z "$DATABASE_URL_VALUE" ]; then
  echo "FAIL: ANGELCARE_PRODUCT_KERNEL_DATABASE_URL or DATABASE_URL is required."
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "FAIL: psql is required."
  exit 1
fi

psql "$DATABASE_URL_VALUE" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
echo "PASS: Tenants & Product finalization migration applied."
