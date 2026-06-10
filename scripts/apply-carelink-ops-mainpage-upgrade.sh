#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Applying CareLink Ops main page enterprise enhancement..."

for f in \
  app/carelink-ops/page.tsx \
  app/api/carelink/ops/dashboard/route.ts \
  app/api/carelink/ops/actions/route.ts \
  components/carelink/ops/CareLinkOpsProductionDashboard.tsx \
  lib/carelink/ops-dashboard-data.ts; do
  if [ ! -f "$f" ]; then
    echo "Missing expected file: $f"
    exit 1
  fi
done

echo "CareLink Ops enhancement files are present."
echo "Next: rm -rf .next && npm run build"
