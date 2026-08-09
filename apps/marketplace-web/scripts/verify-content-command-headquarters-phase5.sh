#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
cd "$APP"
node scripts/verify-content-command-headquarters-phase5.mjs
npx tsc -p tsconfig.content-command-headquarters-phase5.json --pretty false
printf '\nPASS · Phase 5 structural and TypeScript acceptance\n'
