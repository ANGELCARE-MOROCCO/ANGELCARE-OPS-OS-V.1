#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
cd "$APP"
if [ -x "node_modules/.bin/tsc" ]; then
  node_modules/.bin/tsc -p tsconfig.content-command-universal-media-preview.json --pretty false
elif node -e 'require.resolve("typescript")' >/dev/null 2>&1; then
  node -e 'require("typescript").executeCommandLine(process.argv.slice(1))' -- -p tsconfig.content-command-universal-media-preview.json --pretty false
elif [ -f "/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/tsc.js" ]; then
  node /opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/tsc.js -p tsconfig.content-command-universal-media-preview.json --pretty false
else
  echo "FAIL — TypeScript compiler was not found."
  exit 1
fi
echo "PASS — focused Content Command Universal Media Preview TypeScript gate passed."
