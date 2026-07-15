# AngelCare 360 — Enseignants Figma Surgical Patch

## Target

- Batch 1 / Image 5
- Route: `/angelcare-360-command-center/enseignants`
- Page: `Enseignants`
- Purpose: teacher workforce, pedagogy assignment, workload, replacements, training and document cockpit.

## Files touched

- `app/(protected)/angelcare-360-command-center/(people)/layout.tsx`
- `app/(protected)/angelcare-360-command-center/(people)/enseignants/page.tsx`
- `components/angelcare360/people/Angelcare360TeachersOverview.tsx`
- `lib/angelcare360/server/teachers-overview.ts`

## What this patch builds

- Figma-grade header and tabs:
  - Vue d’ensemble
  - Profils
  - Affectations
  - Horaires
  - Performance
  - Formation
  - Documents
- KPI rail:
  - Enseignants actifs
  - Présence équipe
  - Cours aujourd’hui
  - Remplacements ouverts
  - Formations à planifier
- Command bar:
  - Nouveau profil
  - Affecter à une classe
  - Publier emploi du temps
  - Ajouter observation
  - Gérer documents
- Teacher table:
  - Enseignant
  - Classes
  - Matières
  - Disponibilité
  - Score d’évaluation
  - Actions
- Operational panels:
  - Charge d’enseignement
  - Remplacements urgents
  - Développement professionnel
  - Répartition par niveaux et matières
  - Documents expirant bientôt

## Backend wiring

Uses real available sources where present:

- `listAngelcare360Teachers(...)`
- existing teacher create/edit drawer through `Angelcare360PeopleDrawer`
- `angelcare360_staff_assignments`
- `angelcare360_staff_attendance`
- `angelcare360_course_sessions`
- `angelcare360_teacher_replacements`
- `angelcare360_staff_training_records`
- `angelcare360_documents`

If optional tables are absent or empty, the page shows professional empty states instead of invented values.

## Constraints respected

- No fake teachers.
- No fake classes.
- No fake workload.
- No fake evaluations.
- No fake documents.
- No static business rows.
- No seed files.
- No migrations.
- No global sidebar redesign.
- Existing teacher create/edit workflow preserved.

## Local verification

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
