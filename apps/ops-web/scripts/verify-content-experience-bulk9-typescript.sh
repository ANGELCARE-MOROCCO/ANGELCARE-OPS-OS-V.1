#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP"
npx tsc -p tsconfig.content-experience-bulk9.json --pretty false
