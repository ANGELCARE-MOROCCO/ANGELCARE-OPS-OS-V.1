#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"
cd "$ROOT/apps/ops-web"
node scripts/revenue-command-os/verify-phase15.mjs
node scripts/revenue-command-os/test-phase15.mjs
node scripts/revenue-command-os/sql-review-phase15.mjs
printf '%s\n' '✓ MZ15 cockpit static smoke passed.'
printf '%s\n' 'Live route: /revenue-command-os/cockpit'
printf '%s\n' 'Authenticated API: GET /api/revenue-command-os/cockpit?roleView=executive'
