#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/Users/user/Desktop/angelcare-platform}"
cd "$ROOT/apps/ops-web"
[[ -f .env.local ]] || { echo '.env.local missing'; exit 1; }
node --env-file=.env.local scripts/revenue-command-os/test-phase10-1-live-gemini.mjs
printf '\nLive Strategy Brain smoke test endpoint (authenticated session required):\n'
printf 'POST /api/revenue-command-os/strategy-engine/generate\n'
printf 'Expected: at least 5 persisted strategies, provider=gemini, externalActions=0.\n'
