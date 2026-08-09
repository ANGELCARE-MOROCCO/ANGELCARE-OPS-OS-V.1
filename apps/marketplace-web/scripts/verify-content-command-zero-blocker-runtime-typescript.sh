#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
REPO="$(cd "$APP/../.." && pwd)"
TS_CONFIG="$APP/tsconfig.content-command-zero-blocker-runtime.json"

if [ -x "$APP/node_modules/.bin/tsc" ]; then TSC="$APP/node_modules/.bin/tsc"
elif [ -x "$REPO/node_modules/.bin/tsc" ]; then TSC="$REPO/node_modules/.bin/tsc"
elif command -v tsc >/dev/null 2>&1; then TSC="$(command -v tsc)"
else
  echo "FAIL — TypeScript compiler is not available in the application, repository or PATH."
  exit 2
fi

"$TSC" -p "$TS_CONFIG" --pretty false
printf '%s\n' 'PASS — Content Command zero-blocker focused TypeScript gate passed.'
