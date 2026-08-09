#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
node "$APP/scripts/verify-content-command-owner-cascade.mjs" "$APP"
node "$APP/scripts/verify-content-command-owner-cascade-syntax.cjs" "$APP"
echo "PASS — Content Command owner-controlled cascade static verification completed."
