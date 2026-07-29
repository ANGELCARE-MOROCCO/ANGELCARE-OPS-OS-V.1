#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$(pwd)}"
cd "$ROOT"
if [ ! -x node_modules/.bin/tsc ]; then
  echo "FAIL — node_modules/.bin/tsc is unavailable. Install the repository dependencies first." >&2
  exit 2
fi
node_modules/.bin/tsc -p tsconfig.content-experience-bulk6.json --pretty false
echo "PASS — focused Bulk 6 TypeScript gate passed."
