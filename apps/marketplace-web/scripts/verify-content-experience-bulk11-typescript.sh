#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$PWD/apps/ops-web}";[ -d "$APP" ]||APP="${1:-$PWD}"
cd "$APP"
npx tsc -p tsconfig.content-experience-bulk11.json --pretty false --noEmit
echo "PASS — focused Bulk 11 TypeScript gate passed."
