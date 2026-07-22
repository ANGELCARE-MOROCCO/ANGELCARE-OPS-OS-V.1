#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"; STRATEGY_ID="${STRATEGY_ID:?persisted MZ11-ready strategy ID required}"; COOKIE="${AUTH_COOKIE:?authenticated cookie required}"
curl -fsS -H "cookie: $COOKIE" "$BASE_URL/api/revenue-command-os/strategy-studio/strategies/$STRATEGY_ID" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s);if(!j.ok||j.externalActions!==0)process.exit(1);console.log(JSON.stringify({dossier:true,strategy:j.data.strategy.code,status:j.data.status,externalActions:0},null,2))})'
