#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?root required}"
cd "$ROOT/apps/ops-web"
node scripts/revenue-command-os/verify-phase16.mjs
node scripts/revenue-command-os/test-phase16.mjs
node scripts/revenue-command-os/sql-review-phase16.mjs
echo '✓ MZ16 Mega Production static smoke passed.'
echo 'Live route: /revenue-command-os/mega-production'
echo 'Authenticated API: GET /api/revenue-command-os/mega-production'
