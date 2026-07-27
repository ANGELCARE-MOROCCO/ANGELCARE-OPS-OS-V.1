# AC CAPITAL OS — Mega Ultra ZIP 09
## Capital Pipeline CRM + Follow-Up Engine

This package installs the MZ9 workspace for AC CAPITAL OS.

## Canonical protected route

`apps/ops-web/app/(protected)/ac-capital-os/page.tsx`

## New workspace route

`apps/ops-web/app/(protected)/ac-capital-os/pipeline/page.tsx`

## New API

`apps/ops-web/app/api/ac-capital-os/capital-pipeline/route.ts`

## New migration

`supabase/migrations/20260727_ac_capital_os_mz9_capital_pipeline_crm.sql`

## What MZ9 delivers

- Capital Pipeline CRM
- Deal Flow board
- Follow-Up Engine
- Pipeline Board
- Table, Timeline, Calendar, Value Forecast and Relationship view concepts
- Pipeline record dossier structure
- Stage History
- Communication Log
- Submission Log
- Due Diligence Requests
- Negotiation Tracker
- Outcome and Learning
- Relationship Temperature
- Weighted Pipeline Value
- Follow-Up Due / Overdue Follow-Up
- Learning Injected
- Capital pipeline API contract
- Supabase migration foundation

## Truth boundary

This ZIP delivers the UI, seeded API contract, migration foundation and lifecycle model.
It does **not** send emails, sync calendars, submit investor applications, automate portal submissions, create legal guarantees or run live CRM integrations.

## Apply

```bash
cd ~/Desktop/angelcare-platform
unzip -o AC_CAPITAL_OS_MEGA_ULTRA_ZIP_09_CAPITAL_PIPELINE_CRM.zip -d .
node ./AC_CAPITAL_OS_MZ9/scripts/apply_ac_capital_os_mz9.mjs
node ./AC_CAPITAL_OS_MZ9/scripts/verify_ac_capital_os_mz9.mjs
```

## Verify TypeScript

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web
npx tsc -p tsconfig.json --noEmit --pretty false
```

No build. No git stage. No commit. No push.
