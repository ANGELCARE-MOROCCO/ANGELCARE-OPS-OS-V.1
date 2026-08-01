#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
node "$APP/scripts/verify-content-command-production-operations.mjs" "$APP"
node "$APP/scripts/verify-content-command-production-operations-syntax.cjs" "$APP"
echo "PASS — Content Command Production Operations static verification completed."
