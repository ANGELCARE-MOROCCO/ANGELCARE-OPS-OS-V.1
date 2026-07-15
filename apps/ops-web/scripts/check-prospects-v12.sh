#!/usr/bin/env bash
set -e
echo "Checking Prospects V12 files..."
test -f "components/revenue-command-center/RevenueProspectsV12MegaWorkspace.tsx"
test -f "app/(protected)/revenue-command-center/prospects/page.tsx"
test -f "app/(protected)/revenue-command-center/prospects/pipeline/page.tsx"
test -f "app/(protected)/revenue-command-center/prospects/qualification/page.tsx"
test -f "app/(protected)/revenue-command-center/prospects/decision-map/page.tsx"
echo "Running TypeScript..."
npx tsc --noEmit --pretty false
echo "Prospects V12 check passed."
