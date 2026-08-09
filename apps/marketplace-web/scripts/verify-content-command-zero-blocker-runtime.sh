#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/verify-content-command-zero-blocker-runtime.mjs" "$APP"
