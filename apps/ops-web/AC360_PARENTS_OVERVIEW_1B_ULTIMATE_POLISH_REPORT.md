# AngelCare 360 — Parents & familles Ultimate Polish / Hardening Patch

## Target

- Batch 1 / Image 4
- Route: `/angelcare-360-command-center/parents`
- Page: `Parents & familles`

## What this one-shot final hardening fixes

### Visual / Figma matching

- Removes the extra readiness strip that was not present in the reference image.
- Keeps the sequence closer to the target:
  - title
  - tabs
  - KPI rail
  - actions/search
  - family table
  - appointment/right panel
  - communication/authorization/engagement/relance cards
- Replaces emoji-style KPI icons with compact professional labels.
- Tightens KPI wording and customer-facing labels.
- Keeps the page as a dedicated family cockpit, not a generic people table.

### Operational hardening

- Replaces non-existing or risky navigation targets with known customer-side routes:
  - Relations enfants → `/angelcare-360-command-center/eleves`
  - Programmer rendez-vous → `/angelcare-360-command-center/emploi-du-temps/calendrier`
  - Exporter contacts → `/angelcare-360-command-center/exports/csv-xlsx`
- Keeps create/edit parent workflow wired through the existing `Angelcare360PeopleDrawer`.
- Keeps optional sources safe: missing appointment/authorization sources remain empty states, not fake data.

### Production data discipline

- No fake parents.
- No fake children.
- No fake balances.
- No fake appointments.
- No static business rows.
- No seed.
- No migration.
- No global sidebar change.
- No admin/operator route touched.

## Files included

- `app/(protected)/angelcare-360-command-center/(people)/layout.tsx`
- `app/(protected)/angelcare-360-command-center/(people)/parents/page.tsx`
- `components/angelcare360/people/Angelcare360ParentsOverview.tsx`
- `lib/angelcare360/server/parents-overview.ts`

## Verify

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
rm -rf .next
npm run dev
```

Open:

```txt
http://localhost:3000/angelcare-360-command-center/parents
```
