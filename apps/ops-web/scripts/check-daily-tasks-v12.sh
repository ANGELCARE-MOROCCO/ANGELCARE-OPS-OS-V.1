#!/usr/bin/env bash
set -e
echo "Checking Daily Tasks V12 files..."
test -f "components/revenue-command-center/RevenueDailyTasksV12MegaWorkspace.tsx"
test -f "app/(protected)/revenue-command-center/daily-tasks/page.tsx"
test -f "app/(protected)/revenue-command-center/daily-tasks/board/page.tsx"
test -f "app/(protected)/revenue-command-center/tasks/page.tsx"
echo "Running TypeScript..."
npx tsc --noEmit --pretty false
echo "Daily Tasks V12 check passed."
