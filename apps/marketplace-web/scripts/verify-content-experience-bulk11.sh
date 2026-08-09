#!/usr/bin/env bash
set -euo pipefail
APP="${1:-$PWD/apps/ops-web}";[ -d "$APP" ]||APP="${1:-$PWD}"
node "$APP/scripts/verify-content-experience-bulk11.mjs" "$APP"
node "$APP/scripts/verify-content-experience-bulk11-syntax.cjs" "$APP"
node "$APP/scripts/verify-content-experience-bulk11-model.cjs"
echo "PASS — Bulk 11 static verification completed."
