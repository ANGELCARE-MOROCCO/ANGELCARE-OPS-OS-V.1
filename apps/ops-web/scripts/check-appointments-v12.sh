#!/usr/bin/env bash
set -e
echo "Checking Appointments V12 files..."
test -f "components/revenue-command-center/RevenueAppointmentsV12MegaWorkspace.tsx"
test -f "app/(protected)/revenue-command-center/appointments/page.tsx"
test -f "app/(protected)/revenue-command-center/appointments/control-tower/page.tsx"
test -f "app/(protected)/revenue-command-center/appointments/live/page.tsx"
test -f "app/(protected)/revenue-command-center/appointments/recovery/page.tsx"
echo "Running TypeScript..."
npx tsc --noEmit --pretty false
echo "Appointments V12 check passed."
