#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
cd "$APP"
npx tsc -p tsconfig.content-experience-bulk10.json --pretty false
echo "PASS — focused Bulk 10 TypeScript gate passed."
