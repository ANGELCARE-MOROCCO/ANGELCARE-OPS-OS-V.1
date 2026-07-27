# AC CAPITAL OS — Mega Ultra ZIP 12
## Strategy Simulator + Executive Reports + SOP Manual + Production Readiness Control Plane

This package installs the MZ12 workspace for AC CAPITAL OS.

## Canonical protected route

`apps/ops-web/app/(protected)/ac-capital-os/page.tsx`

## New workspace route

`apps/ops-web/app/(protected)/ac-capital-os/strategy/page.tsx`

## New API

`apps/ops-web/app/api/ac-capital-os/strategy-production-command/route.ts`

## New migration

`supabase/migrations/20260727_ac_capital_os_mz12_strategy_production_command.sql`

## What MZ12 delivers

- Strategy Simulator & Production Command
- Capital Scenarios
- Bank-first Strategy
- Grant Impact Strategy
- VC Angel Strategy
- Strategic Partner Strategy
- Blended Finance Strategy
- Scenario Comparison Matrix
- Financial Sensitivity Simulator
- Risk Stress Test
- Executive Reports
- SOP Manual and Coordinator Workbook
- Production Readiness Audit
- Seeded-to-Live Wiring Map
- Launch Control Checklist
- Database Foundation Activated truth dashboard
- AI Provider Control bridge visibility
- Production blocker wall
- API contract
- Supabase migration foundation

## Truth boundary

Database foundation: activated.
UI/API contracts: installed.
Live persistence: next phase.
AI execution: next phase.
File storage: next phase.
Automation: disabled for safety.

MZ12 does **not** claim full production readiness, live AI calls, automatic reports export, automatic outreach, automatic submission or completed Supabase migration-history reconciliation.

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MEGA_ULTRA_ZIP_12_STRATEGY_PRODUCTION_COMMAND.zip -d .

node ./AC_CAPITAL_OS_MZ12/scripts/apply_ac_capital_os_mz12.mjs

node ./AC_CAPITAL_OS_MZ12/scripts/verify_ac_capital_os_mz12.mjs
```

## Verify TypeScript

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web

npx tsc -p tsconfig.json --noEmit --pretty false
```

## SQL after applying

MZ12 does not run SQL automatically.

After verifier passes, apply only:

`supabase/migrations/20260727_ac_capital_os_mz12_strategy_production_command.sql`

through the same controlled `psql` method used for MZ1-MZ11.

No build. No git stage. No commit. No push.
