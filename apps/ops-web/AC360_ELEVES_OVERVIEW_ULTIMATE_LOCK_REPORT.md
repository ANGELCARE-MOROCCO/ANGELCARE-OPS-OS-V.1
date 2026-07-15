# AngelCare 360 — Élèves Overview Ultimate Lock Patch

## Target

- Batch 1 / Image 3
- Route: `/angelcare-360-command-center/eleves`
- Page: `Élèves`
- Objective: stop the A/B/C micro-patch cycle and lock the page into a cleaner, more reference-aligned, production-safe state.

## Files touched

- `app/(protected)/angelcare-360-command-center/(people)/layout.tsx`
- `app/(protected)/angelcare-360-command-center/(people)/eleves/page.tsx`
- `components/angelcare360/people/Angelcare360StudentsOverview.tsx`
- `lib/angelcare360/server/students-overview.ts`

## What this all-in-one lock patch does

### 1. Removes the old generic people wrapper

The `(people)` layout now returns the page directly so `/eleves` is not polluted by the generic “Espace personnes / Command Center” frame.

### 2. Closer reference alignment

- Cleaner page start.
- More compact premium header.
- Context chips matching the page purpose without adding a generic shell.
- Tighter KPI rail.
- Better action/search bar density.
- Sharper table presentation.
- More mature side panels and bottom cards.
- Removes the aggressive bottom orange warning banner.

### 3. Sparse-data handling

When the real database has only one or very few students, the page no longer tries to look like a fake full dashboard. It shows a controlled compact state while keeping the layout premium and useful.

### 4. Backend and production hardening

- Keeps student rows backend-driven through existing people loaders.
- Keeps existing create/edit drawer and API flow.
- Keeps real classes, sections, attendance, invoices and audit data.
- Attendance filtering uses `recorded_at`.
- Student detail href fallback is protected.
- Health signal detection checks metadata and direct health/allergy fields.
- Financial display remains MAD.

### 5. Non-negotiables respected

- No fake students.
- No fake balances.
- No fake attendance values.
- No seed files.
- No migrations.
- No operator/admin routes.
- No global sidebar/shell redesign.
- No generic shared dashboard-template strategy.

## Local verification

Run:

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
rm -rf .next
npm run dev
```

Open:

```txt
http://localhost:3000/angelcare-360-command-center/eleves
```

## Completion gate

This page can be considered locked when:

- The route opens directly with `Élèves`.
- There is no “Espace personnes” wrapper.
- There is no bottom orange warning banner.
- The UI still works with one student and scales with many students.
- Create/edit drawer still opens according to permissions.
- TypeScript passes.
- Build passes.
