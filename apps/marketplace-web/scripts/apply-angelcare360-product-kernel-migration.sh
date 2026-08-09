#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="${1:-$(pwd)}"
MIGRATION="$APP_ROOT/supabase/migrations/20260730_angelcare360_operator_product_monetization_kernel.sql"
DATABASE_URL="${ANGELCARE_PRODUCT_KERNEL_DATABASE_URL:-${DATABASE_URL:-}}"
if [ ! -f "$MIGRATION" ]; then echo "FAIL: migration not found: $MIGRATION"; exit 1; fi
if [ -z "$DATABASE_URL" ]; then
  echo "FAIL: set ANGELCARE_PRODUCT_KERNEL_DATABASE_URL to the Supabase/Postgres connection string."
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "FAIL: psql is required to apply the migration."
  exit 1
fi
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"
echo "PASS: Product Kernel migration applied."
