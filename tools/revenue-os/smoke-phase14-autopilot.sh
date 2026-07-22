#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo root required}"
cd "$ROOT/apps/ops-web"
node scripts/revenue-command-os/verify-phase14.mjs
node scripts/revenue-command-os/test-phase14.mjs
node scripts/revenue-command-os/sql-review-phase14.mjs
cat <<'EOF'
MZ14 static execution smoke passed.
Live authenticated endpoint: GET /api/revenue-command-os/execution-autopilot
Expected: 16 adapters, executionMode=approval_required or configured mode, externalActionsExecuted=0 before explicit activation.
EOF
