#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TARGET="components/carelink/ops/CareLinkOpsProductionDashboard.tsx"

if [ -f "$TARGET" ]; then
  cp "$TARGET" "$TARGET.before-clean-rebuild"
fi

mkdir -p app/carelink-ops app/api/carelink/ops/dashboard app/api/carelink/ops/actions components/carelink/ops lib/carelink docs

echo "CareLink Ops clean rebuild files are in place."
echo "Recommended next commands:"
echo "  rm -rf .next"
echo "  npm run build"
echo "  npm run dev"
