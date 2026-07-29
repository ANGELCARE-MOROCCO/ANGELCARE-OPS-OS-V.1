#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
cd "$APP"
node scripts/verify-content-experience-bulk10.mjs
node scripts/verify-content-experience-bulk10-syntax.cjs
node scripts/test-content-experience-bulk10-runtime.mjs
echo "PASS — Bulk 10 static verification completed."
