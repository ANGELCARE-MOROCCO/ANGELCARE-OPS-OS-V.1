#!/usr/bin/env bash
set -euo pipefail
REPO="${1:-$(pwd)}"
APP="$REPO/apps/ops-web"
[ -d "$APP" ] || { echo "FAIL — Application not found: $APP"; exit 2; }
node "$APP/scripts/verify-content-command-canonical-consolidation.mjs" "$APP"
node "$APP/scripts/verify-content-command-canonical-consolidation-syntax.cjs" "$APP"
echo "PASS — Content Command canonical consolidation static verification completed."
