#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$(pwd)}"
cd "$ROOT"
node scripts/verify-content-experience-bulk6.mjs
node scripts/verify-content-experience-bulk6-syntax.cjs
echo "PASS — Bulk 6 static verification completed. No SQL, build, deployment or provider call was run."
