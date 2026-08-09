#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
cd "$APP"
if [ -x node_modules/.bin/tsc ]; then TSC=node_modules/.bin/tsc
elif command -v npx >/dev/null 2>&1; then TSC="npx --no-install tsc"
elif command -v tsc >/dev/null 2>&1; then TSC=tsc
else echo "FAIL — TypeScript CLI is unavailable."; exit 2; fi
$TSC -p tsconfig.content-command-production-operations.json --pretty false
echo "PASS — focused Content Command Production Operations TypeScript gate passed."
