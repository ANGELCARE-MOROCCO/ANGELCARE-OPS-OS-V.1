# Market OS Ambassador Retirement + RefferQ Replacement Report

## Decision implemented

The active Market OS Ambassador submodule is retired from the application route tree and replaced with a RefferQ referral-growth operating module.

## Active routes after patch

- `/market-os/ambassadors` opens the RefferQ replacement gate.
- `/market-os/ambassadors/refferq` opens the RefferQ mega module.
- Old nested ambassador paths are replaced by a redirect fallback after active legacy folders are removed.

## Active source retired by the apply script

The script moves these active paths into `backups/market-os-ambassadors-retired-<timestamp>/`, which is already excluded by the project TypeScript configuration:

- `app/(protected)/market-os/ambassadors`
- `app/api/ambassadors`
- `app/api/market-os/ambassadors`
- `components/market-os/ambassadors`
- `lib/market-os/ambassadors`

This prevents the old module from continuing to compile, import, or drift.

## New source added

- `app/(protected)/market-os/ambassadors/page.tsx`
- `app/(protected)/market-os/ambassadors/refferq/page.tsx`
- `app/(protected)/market-os/ambassadors/[...legacy]/page.tsx`
- `components/market-os/refferq/RefferQGateway.tsx`
- `components/market-os/refferq/RefferQMegaModule.tsx`
- `lib/market-os/refferq/refferq-data.ts`
- `app/api/market-os/refferq/route.ts`

## Why this patch avoids drift

The patch does not try to merge RefferQ's separate Prisma app blindly into the existing AngelCare Supabase/Next 16 app. Instead, it removes the unstable Ambassador module from active compilation and installs a self-contained RefferQ route layer that can be backend-wired in the next step without dragging the previous Ambassador runtime forward.

## Commands

```bash
unzip -o angelcare-market-os-refferq-replacement-patch.zip -d .
node scripts/apply-refferq-ambassador-replacement.mjs
node scripts/verify-refferq-ambassador-replacement.mjs
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

## What to test

1. Open `/market-os/ambassadors`.
2. Confirm the page is the RefferQ gate, not the old Ambassador workspace.
3. Click `Open RefferQ mega module`.
4. Confirm `/market-os/ambassadors/refferq` opens the module.
5. Test tab switching: Cockpit, Partners, Referrals, Transactions, Payouts, Programs, Resources, API & Webhooks, Risk, Settings.
6. Add a referral from quick intake.
7. Confirm old routes like `/market-os/ambassadors/directory` redirect to RefferQ instead of opening old Ambassador UI.
