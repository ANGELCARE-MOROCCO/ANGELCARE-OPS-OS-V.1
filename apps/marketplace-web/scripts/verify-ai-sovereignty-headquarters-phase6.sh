#!/usr/bin/env bash
set -eo pipefail
APP="${1:-$(pwd)}"
cd "$APP"

echo "============================================================"
echo "SANILA AI SOVEREIGNTY HEADQUARTERS PHASE 6 · STATIC GATE"
echo "============================================================"
node scripts/verify-ai-sovereignty-headquarters-phase6.mjs "$APP"
node scripts/check-ai-sovereignty-headquarters-phase6-syntax.cjs "$APP"

TSC=""
if test -x "$APP/node_modules/.bin/tsc"; then
  TSC="$APP/node_modules/.bin/tsc"
elif command -v tsc >/dev/null 2>&1; then
  TSC="$(command -v tsc)"
elif test -f "/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/bin/tsc"; then
  TSC="node /opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/bin/tsc"
fi

if test -n "$TSC"; then
  # shellcheck disable=SC2086
  $TSC -p tsconfig.ai-sovereignty-headquarters-phase6-ui.json --pretty false
  echo "PASS · Focused semantic UI TypeScript gate"
else
  echo "WARN · Semantic UI TypeScript gate skipped because tsc is unavailable."
fi

echo "PASS · Phase 6 static acceptance complete"
echo "Production build: NOT RUN"
