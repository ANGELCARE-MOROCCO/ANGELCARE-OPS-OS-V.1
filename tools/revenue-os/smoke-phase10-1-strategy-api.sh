#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:?Usage: $0 <base-url> <session-cookie>}"
COOKIE="${2:?Authenticated Cookie header value required}"
ID="$(python - <<'PY'
import uuid;print(uuid.uuid4())
PY
)"
PAYLOAD="$(cat <<JSON
{"objective":{"id":"$ID","title":"Expansion B2B Academy Rabat Casablanca sur six mois","objectiveType":"growth","businessReason":"Développer un pipeline Academy B2B mesurable à Rabat et Casablanca tout en protégeant la marge approuvée et la capacité réelle.","businessUnits":["Academy"],"targetMarkets":["B2B Education"],"targetSegments":["private-schools","preschools","corporate-childcare"],"territories":["Rabat","Casablanca"],"targetAccounts":[],"revenueTarget":1500000,"marginTarget":0.35,"timeHorizon":"6 months","priority":"high","approvedOffers":["academy-training"],"excludedOffers":[],"approvedChannels":["email","whatsapp","telephone","field-visit"],"excludedChannels":[],"riskAppetite":"balanced","authorityLevel":"director","constraints":["Preserve approved margin floor","Use current delivery capacity only"],"successDefinition":["At least five distinct strategies persisted"],"failureDefinition":["Fewer than five strategies","External action performed"]}}
JSON
)"
OUT="$(mktemp)"; trap 'rm -f "$OUT"' EXIT
curl -fsS "$BASE_URL/api/revenue-command-os/strategy-engine/generate" -H 'Content-Type: application/json' -H "Cookie: $COOKIE" -H "Idempotency-Key: mz10-1-smoke-$ID" --data "$PAYLOAD" > "$OUT"
node - "$OUT" <<'NODE'
const fs=require('fs');const body=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const count=body?.data?.strategies?.length||0;const provider=body?.data?.provider?.code;const external=body?.data?.externalActions;if(!body.ok||count<5||external!==0){console.error(JSON.stringify(body,null,2));process.exit(1)}console.log(JSON.stringify({ok:true,runId:body.data.runId,provider,strategyCount:count,persisted:true,externalActions:external},null,2));
NODE
