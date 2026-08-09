#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$(pwd)}"
node "$APP/scripts/verify-content-command-dossier-recovery.mjs" "$APP"
node "$APP/scripts/verify-content-command-dossier-recovery-syntax.cjs" "$APP"
echo "PASS — Dossier Lifecycle Recovery static verification completed."
