#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT"
node scripts/verify-content-experience-bulk7.mjs
node scripts/verify-content-experience-bulk7-syntax.cjs
node scripts/test-content-experience-bulk7-model.cjs
printf '%s\n' 'PASS — Bulk 7 static verification completed.'
