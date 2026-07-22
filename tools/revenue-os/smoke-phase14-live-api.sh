#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE="${ANGELCARE_SESSION_COOKIE:?Set ANGELCARE_SESSION_COOKIE to an authenticated cookie string}"
curl -fsS "$BASE_URL/api/revenue-command-os/execution-autopilot" -H "Cookie: $COOKIE" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);if(!j.ok||!j.data||j.data.adapters.length!==16)throw new Error("MZ14 live API failed");console.log(JSON.stringify({ok:true,adapters:j.data.adapters.length,actions:j.data.actions.length,externalActionsExecuted:j.data.externalActionsExecuted},null,2))})'
