#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT"
node scripts/verify-content-experience-bulk8.mjs
node scripts/verify-content-experience-bulk8-syntax.cjs
node scripts/test-content-experience-bulk8-model.cjs
printf '%s\n' 'PASS — Bulk 8 static verification completed.'
