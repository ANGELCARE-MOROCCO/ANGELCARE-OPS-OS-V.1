#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
node "$APP/scripts/verify-content-command-universal-media-preview.mjs" "$APP"
node "$APP/scripts/verify-content-command-universal-media-preview-syntax.cjs" "$APP"
echo "PASS — Content Command Universal Media Preview static verification completed."
