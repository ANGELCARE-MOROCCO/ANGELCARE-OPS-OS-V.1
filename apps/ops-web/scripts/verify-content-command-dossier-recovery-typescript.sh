#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
cd "$APP"
npx tsc -p tsconfig.content-command-dossier-recovery.json --pretty false
echo "PASS — focused Dossier Lifecycle Recovery TypeScript gate completed."
