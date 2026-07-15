# AngelCare 360 — Élèves Overview Figma Surgical Patch

## Target

- Batch 1 / Image 3
- Route: `/angelcare-360-command-center/eleves`
- Source file: `app/(protected)/angelcare-360-command-center/(people)/eleves/page.tsx`
- Page identity: `Élèves`
- Objective: replace the generic people table experience with a purpose-built, Figma-grade student command page while keeping real backend wiring.

## Files changed

- `app/(protected)/angelcare-360-command-center/(people)/eleves/page.tsx`
- `components/angelcare360/people/Angelcare360StudentsOverview.tsx`
- `lib/angelcare360/server/students-overview.ts`

## Production behavior

The page remains backend-first and uses:

- `listAngelcare360Students(...)`
- `listAngelcare360Classes(...)`
- `listAngelcare360Sections(...)`
- `angelcare360_attendance_records`
- `angelcare360_invoices`
- `angelcare360_audit_logs`
- existing `Angelcare360PeopleDrawer` for create/edit student workflows
- existing `/api/angelcare360/people` flow through the drawer

## What changed

- Premium student page hero, tabs, KPI rail and command bar.
- Real student table with parent, class, status, balance and document status.
- Real create/edit drawer behavior preserved.
- Real links to detail pages and related modules.
- Attention panel for missing documents, class assignment, and balances.
- Class distribution from real student rows.
- Birthdays from real date of birth values.
- Activity panel from audit records.
- Professional empty states when source data is absent.
- MAD formatting for financial balances.

## Constraints respected

- No seed file changed.
- No migration changed.
- No sidebar or shell changed.
- No operator/admin route changed.
- No static business rows added.
- No fake students, fake balances, fake presence numbers, or fake documents added.

## Verification to run locally

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

The route now behaves like a premium student-management command center rather than a generic data table, while preserving real create/edit workflows and backend-driven values only.
