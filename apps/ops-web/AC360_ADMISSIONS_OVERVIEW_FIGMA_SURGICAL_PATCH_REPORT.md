# AngelCare 360 — Admissions Overview Figma Surgical Patch

## Target

- Batch 1 / Image 2
- Route: `/angelcare-360-command-center/admissions`
- Page: `Admissions`
- Scope: customer-side admissions overview only

## Files changed

- `components/angelcare360/admissions/Angelcare360AdmissionsHub.tsx`
- `lib/angelcare360/server/admissions.ts`
- `types/angelcare360/admissions.ts`

## What changed

- Replaces the old generic admissions hub with a Figma-grade admissions cockpit matching the accepted reference direction.
- Adds route-specific admissions layout: hero, in-page tabs, KPI rail, command bar, admissions pipeline, recent family requests table, conversion funnel, visits/follow-up actions, and admissions alerts.
- Uses existing backend lists already loaded by `getAngelcare360AdmissionsOverview`: leads, applications, documents, audit, classes and sections.
- Adds production-safe derived overview data to the server payload rather than hardcoding visual numbers.
- Keeps empty states professional when sources are not yet populated.

## Production safety

- No seed files changed.
- No migration files changed.
- No static demo records added.
- No mock arrays added.
- Sidebar and global shell untouched.
- Operator/admin routes untouched.

## Local verification

Run from app root:

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
npm run dev
```

Open:

```txt
http://localhost:3000/angelcare-360-command-center/admissions
```
