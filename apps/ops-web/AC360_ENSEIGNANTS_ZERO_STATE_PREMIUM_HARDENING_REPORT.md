# AngelCare 360 — Enseignants Premium Zero-State Hardening Patch

## Target

- Route: `/angelcare-360-command-center/enseignants`
- Page: `Enseignants`

## Why this patch exists

The first surgical page was backend-honest, but with zero real teachers it looked too empty and weak. Since the rule remains zero fake data, the correct production response is not to invent teachers, but to create a premium operational empty state.

## What this hardens

- Adds a premium “Activation enseignants” cockpit when no real teacher exists.
- Explains clearly that the page is empty because no teacher record is active.
- Adds four real activation steps:
  - créer les profils
  - affecter classes & matières
  - publier les horaires
  - charger les documents
- Improves the empty teacher table with a direct create action when the user has permission.
- Improves empty-state language for:
  - charge d’enseignement
  - remplacements
  - formation
  - matrice pédagogique
- Keeps all existing backend-driven sections.
- Keeps the teacher create/edit drawer wired.

## Still respected

- No fake teachers.
- No fake classes.
- No fake workload.
- No fake evaluations.
- No fake documents.
- No seed.
- No migration.
- No sidebar/global shell change.

## Verify

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
rm -rf .next
npm run dev
```

Open:

```txt
http://localhost:3000/angelcare-360-command-center/enseignants
```
