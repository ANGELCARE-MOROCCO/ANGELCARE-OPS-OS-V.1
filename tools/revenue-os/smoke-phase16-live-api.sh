#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE="${REVENUE_OS_SESSION_COOKIE:-}"
[[ -n "$COOKIE" ]] || { echo 'Set REVENUE_OS_SESSION_COOKIE with an authenticated application session.'; exit 2; }
curl -fsS -H "Cookie: $COOKIE" "$BASE_URL/api/revenue-command-os/mega-production" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const x=JSON.parse(s);if(!x.ok)process.exit(1);console.log(JSON.stringify({mode:x.data.mode,activationLevel:x.data.activationLevel,learningCoverage:Object.keys(x.data.learningCoverage).length,productionCoverage:Object.keys(x.data.productionCoverage).length,externalActions:x.data.externalActionsEnabled},null,2))})"
