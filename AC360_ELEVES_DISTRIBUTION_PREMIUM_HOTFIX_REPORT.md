# AngelCare 360 — Élèves Distribution Card Premium Hotfix

## Target

- Route: `/angelcare-360-command-center/eleves`
- Section: `Répartition par classe`
- File: `components/angelcare360/people/Angelcare360StudentsOverview.tsx`

## Problem fixed

The previous class distribution card looked unprofessional:

- static rainbow donut even with one real class
- overlapping number/text in the center
- weak legend
- no real dynamic visual meaning
- poor premium SaaS feeling

## What changed

- Replaced the static donut with a dynamic conic gradient generated from real `classDistribution`.
- Added a clean white center with proper text hierarchy.
- Added a live class-count pill.
- Added “Classe principale” summary.
- Added percentage bars per class.
- Added real percentage calculation from backend student rows.
- Preserved sparse-data behavior when only one class/student exists.
- Improved card background, shadow, spacing and density.

## Constraints respected

- No fake classes.
- No fake students.
- No fake percentages.
- No seed.
- No migration.
- No backend change.
- No sidebar/shell change.
- No route outside Élèves touched.

## Verify

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
