#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://localhost:3000}"
echo "Checking Connect RLS health at $BASE_URL/api/connect/rls-health"
curl -s "$BASE_URL/api/connect/rls-health" | python3 -m json.tool

echo ""
echo "Checking Connect actions endpoint at $BASE_URL/api/connect/actions"
curl -s "$BASE_URL/api/connect/actions" | python3 -m json.tool
