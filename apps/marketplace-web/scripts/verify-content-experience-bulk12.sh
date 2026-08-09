#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
node "$APP/scripts/verify-content-experience-bulk12.mjs" "$APP"
node "$APP/scripts/verify-content-experience-bulk12-syntax.cjs" "$APP"
node "$APP/scripts/verify-content-experience-bulk12-model.cjs"
echo "PASS — Bulk 12 static verification completed."
