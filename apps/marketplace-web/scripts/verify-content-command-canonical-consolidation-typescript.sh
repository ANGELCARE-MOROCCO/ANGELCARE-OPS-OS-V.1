#!/usr/bin/env bash
set -euo pipefail
REPO="${1:-$(pwd)}"
APP="$REPO/apps/ops-web"
[ -d "$APP" ] || { echo "FAIL — Application not found: $APP"; exit 2; }
cd "$APP"
if [ ! -d node_modules ]; then
  echo "FAIL — node_modules is missing in $APP. Install repository dependencies first."
  exit 2
fi
npx tsc -p tsconfig.content-command-canonical-consolidation.json --noEmit --pretty false
echo "PASS — focused Content Command canonical consolidation TypeScript gate passed."
