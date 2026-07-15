#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# This package is intentionally targeted: it restores the original Dispatch Board root page/component,
# while keeping the added horizontal menu child workspaces.
mkdir -p .carelink-backups
if [ -f "app/carelink-ops/dispatch/page.tsx" ]; then
  cp "app/carelink-ops/dispatch/page.tsx" ".carelink-backups/dispatch-page-before-preserve-fix.tsx"
fi
if [ -f "components/carelink/ops/dispatch/CareLinkDispatchControlCenter.tsx" ]; then
  cp "components/carelink/ops/dispatch/CareLinkDispatchControlCenter.tsx" ".carelink-backups/CareLinkDispatchControlCenter-before-preserve-fix.tsx"
fi
printf 'CareLink Dispatch preserve-board nav fix applied. Run npm run build.\n'
