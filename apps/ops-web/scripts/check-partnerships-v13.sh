#!/usr/bin/env bash
set -e
test -f "lib/revenue-command-center/partnerships-v13.ts"
test -f "app/api/revenue-command-center/partnerships/v13/route.ts"
test -f "components/revenue-command-center/partnerships-v13-client.ts"
test -f "components/revenue-command-center/RevenuePartnershipsV13ActionsWorkspace.tsx"
test -f "app/(protected)/revenue-command-center/partnerships/page.tsx"
npx tsc --noEmit --pretty false
echo "Partnerships V13 check passed."
