#!/usr/bin/env bash
set -e
echo "Checking B2C Workflow V12 files..."
test -f "components/revenue-command-center/RevenueB2CWorkflowV12MegaWorkspace.tsx"
test -f "app/(protected)/revenue-command-center/b2c-workflow/page.tsx"
test -f "app/(protected)/revenue-command-center/b2c-workflow/pipeline/page.tsx"
test -f "app/(protected)/revenue-command-center/b2c-workflow/qualification/page.tsx"
test -f "app/(protected)/revenue-command-center/b2c-workflow/onboarding/page.tsx"
echo "Running TypeScript..."
npx tsc --noEmit --pretty false
echo "B2C Workflow V12 check passed."
