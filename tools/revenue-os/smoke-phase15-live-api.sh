#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:?base url required}"
COOKIE="${2:?authenticated Cookie header value required}"
OUT="$(curl -fsS "$BASE_URL/api/revenue-command-os/cockpit?roleView=executive" -H "Cookie: $COOKIE")"
node -e 'const d=JSON.parse(process.argv[1]); if(!d?.data?.zones||d.data.zones.length!==13) throw new Error("MZ15 live cockpit did not expose 13 zones"); if(d.data.externalActionsExecuted!==0) throw new Error("unexpected external actions"); console.log(JSON.stringify({phase:"MZ15",zones:d.data.zones.length,externalActions:d.data.externalActionsExecuted,status:"passed"},null,2))' "$OUT"
