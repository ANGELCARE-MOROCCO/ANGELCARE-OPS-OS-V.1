#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"
cd "$ROOT/apps/ops-web"
node scripts/revenue-command-os/verify-phase12.mjs
node scripts/revenue-command-os/test-phase12.mjs
node scripts/revenue-command-os/sql-review-phase12.mjs
cat <<'TXT'
{
  "phase": "MZ12",
  "strategyStudio": "passed",
  "humanApprovalOnly": true,
  "mandatoryActions": 12,
  "implementedWorkspaces": 16,
  "externalActions": 0,
  "nextPhase": "MZ13"
}
TXT
