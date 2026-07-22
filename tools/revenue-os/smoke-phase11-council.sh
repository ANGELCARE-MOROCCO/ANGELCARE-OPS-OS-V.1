#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/Users/user/Desktop/angelcare-platform}"; APP="$ROOT/apps/ops-web"
cd "$APP"
node scripts/revenue-command-os/verify-phase11.mjs
node scripts/revenue-command-os/test-phase11.mjs
printf '\nAuthenticated live endpoint:\nPOST /api/revenue-command-os/validation-council/run\nExpected: 10 reviews, red-team attacks, optimized version, audit, classification, externalActions=0.\n'
