#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP"
if [ ! -d node_modules ]; then echo "FAIL — node_modules absent. Run this gate in the full repository after dependencies are installed."; exit 1; fi
npx tsc -p tsconfig.content-experience-bulk12.json --pretty false
echo "PASS — focused Bulk 12 TypeScript gate passed."
