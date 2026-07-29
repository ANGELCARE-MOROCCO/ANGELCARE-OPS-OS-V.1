#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
node "$APP/scripts/verify-content-experience-bulk9.mjs"
node "$APP/scripts/verify-content-experience-bulk9-syntax.cjs"
node "$APP/scripts/verify-content-experience-bulk9-model.cjs"
echo 'PASS — Bulk 9 static verification completed.'
