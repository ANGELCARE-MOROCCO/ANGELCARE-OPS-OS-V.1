#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
cd "$APP"
if [ -x "./node_modules/.bin/tsc" ]; then
  ./node_modules/.bin/tsc -p tsconfig.content-command-owner-cascade.json --pretty false
elif command -v npx >/dev/null 2>&1; then
  npx tsc -p tsconfig.content-command-owner-cascade.json --pretty false
else
  echo "FAIL — TypeScript CLI unavailable. Install repository dependencies first." >&2
  exit 1
fi
echo "PASS — focused Content Command owner-cascade TypeScript gate passed."
