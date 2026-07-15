#!/usr/bin/env bash
set -e
echo "Checking Partnerships V12 files..."
test -f "components/revenue-command-center/RevenuePartnershipsV12MegaWorkspace.tsx"
test -f "app/(protected)/revenue-command-center/partnerships/page.tsx"
test -f "app/(protected)/revenue-command-center/partnerships/pipeline/page.tsx"
test -f "app/(protected)/revenue-command-center/partnerships/qualification/page.tsx"
test -f "app/(protected)/revenue-command-center/partnerships/agreements/page.tsx"
echo "Running TypeScript..."
npx tsc --noEmit --pretty false
echo "Partnerships V12 check passed."
