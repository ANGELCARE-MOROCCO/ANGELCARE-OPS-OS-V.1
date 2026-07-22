#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"; cd "$ROOT/apps/ops-web"
node scripts/revenue-command-os/verify-phase13.mjs
node scripts/revenue-command-os/test-phase13.mjs
node scripts/revenue-command-os/sql-review-phase13.mjs
echo '✓ MZ13 static compiler smoke passed. Live authenticated compilation remains environment-bound.'
