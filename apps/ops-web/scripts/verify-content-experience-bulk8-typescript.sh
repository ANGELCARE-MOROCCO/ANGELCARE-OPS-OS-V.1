#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT"
tsc -p tsconfig.content-experience-bulk8.json --pretty false
printf '%s\n' 'PASS — focused Bulk 8 TypeScript gate passed.'
