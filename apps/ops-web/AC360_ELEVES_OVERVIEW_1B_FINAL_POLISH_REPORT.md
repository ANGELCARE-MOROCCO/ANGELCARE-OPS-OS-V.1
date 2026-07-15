# AngelCare 360 — Élèves Overview Patch 1B Final Polish & Hardening

## Target

- Batch 1 / Image 3
- Route: `/angelcare-360-command-center/eleves`
- Page: `Élèves`
- Scope: final polish and hardening after the first surgical implementation

## Files touched

- `app/(protected)/angelcare-360-command-center/(people)/eleves/page.tsx`
- `components/angelcare360/people/Angelcare360StudentsOverview.tsx`
- `lib/angelcare360/server/students-overview.ts`

## What this final hardening improves

### 1. Closer Figma matching

- Refines the page header to feel closer to the reference image: cleaner, less boxed, more premium SaaS.
- Improves contextual school/year/active-student chips without turning the page into a generic card.
- Tightens KPI cards, table width, side panels, bottom cards and action density.

### 2. Production wording and visual maturity

- Removes weak raw/technical presentation from student overview states.
- Improves empty-state language for missing presence, documents, audit and student follow-up signals.
- Improves action labels:
  - `Importer un dossier`
  - `Générer une fiche`
  - `Contacter parents`
  - `Assigner classe`

### 3. Real backend safety

- Keeps the page wired to the existing people backend.
- Keeps the existing create/edit drawer and API workflow.
- Keeps student rows, class rows, section rows, attendance, finance balances and audit activity backend-driven.
- Adds safer student detail href fallback logic so every row action lands on a valid customer route.

### 4. Data hardening

- Attendance daily filter now uses `recorded_at` for day-level presence tracking.
- Attendance select includes both `recorded_at` and `created_at`.
- Health-signal detection now checks metadata plus direct health/allergy fields where available.
- Dynamic Supabase select handling remains guarded.

### 5. Constraints respected

- No sidebar/shell change.
- No admin/operator route touched.
- No seed file changed.
- No migration changed.
- No fake students.
- No fake balances.
- No fake documents.
- No fake attendance values.
- No generic shared dashboard strategy.

## Local verification

Run:

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
npm run dev
```

Open:

```txt
http://localhost:3000/angelcare-360-command-center/eleves
```

## Expected result

The page should now look closer to the accepted reference image, feel more premium and stable, and remain fully backend-synced without temporary business data.
