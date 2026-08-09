
#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
SQL="$APP/supabase/migrations/20260801_angelcare360_global_brand_governance_tenant_whitelabel.sql"
[ -f "$SQL" ] || { echo "FAIL: migration missing: $SQL"; exit 1; }
if [ -z "${DATABASE_URL:-${SUPABASE_DB_URL:-}}" ]; then
  echo "NOTICE: DATABASE_URL or SUPABASE_DB_URL not configured."
  echo "Copy the migration into Supabase SQL Editor and run it once:"
  echo "$SQL"
  exit 0
fi
URL="${DATABASE_URL:-$SUPABASE_DB_URL}"
command -v psql >/dev/null 2>&1 || { echo "FAIL: psql unavailable."; exit 1; }
psql "$URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "SUCCESS: Brand Governance migration applied."
