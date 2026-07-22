#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${MZ11_BASE_URL:-http://localhost:3000}"; STRATEGY_ID="${1:?strategy id required}"; COOKIE="${MZ11_SESSION_COOKIE:?MZ11_SESSION_COOKIE is required for authenticated smoke}"
RESPONSE="$(curl -fsS -X POST "$BASE_URL/api/revenue-command-os/validation-council/run" -H 'content-type: application/json' -H "cookie: $COOKIE" -H "idempotency-key: mz11-smoke-$STRATEGY_ID" --data "{\"strategyId\":\"$STRATEGY_ID\"}")"
node - "$RESPONSE" <<'NODE'
const body=JSON.parse(process.argv[2]);if(!body.ok)throw new Error(JSON.stringify(body));const d=body.data;if(d.reviews?.length!==10)throw new Error(`Expected 10 reviews, got ${d.reviews?.length}`);if(d.externalActions!==undefined&&d.externalActions!==0)throw new Error('External action violation');if(d.run?.externalActions!==0)throw new Error('Run external action violation');if(!d.classification||!d.audit)throw new Error('Missing classification/audit');console.log(JSON.stringify({runId:d.run.id,reviews:d.reviews.length,classification:d.classification.classification,redTeamAttacks:d.redTeamAttacks?.length||0,optimizedVersion:d.optimized?.optimizedVersion,auditorVerdict:d.audit.auditorVerdict,externalActions:0},null,2));
NODE
