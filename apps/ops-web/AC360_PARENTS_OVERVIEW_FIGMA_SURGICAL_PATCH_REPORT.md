# AngelCare 360 — Parents & familles Figma Surgical Patch

## Target

- Batch 1 / Image 4
- Route: `/angelcare-360-command-center/parents`
- Page: `Parents & familles`
- Objective: build a purpose-specific family relationship, communication, authorization and finance cockpit.

## Files touched

- `app/(protected)/angelcare-360-command-center/(people)/layout.tsx`
- `app/(protected)/angelcare-360-command-center/(people)/parents/page.tsx`
- `components/angelcare360/people/Angelcare360ParentsOverview.tsx`
- `lib/angelcare360/server/parents-overview.ts`

## What this page now contains

- Figma-grade page header and tabs.
- KPI rail:
  - Familles actives
  - Paiements à relancer
  - Messages non lus
  - Autorisations en attente
  - Engagement familles
- Command bar:
  - Nouveau parent
  - Lier à un enfant
  - Envoyer message
  - Programmer rendez-vous
  - Exporter contacts
- Main table:
  - Parent / Famille
  - Enfants liés
  - Contact préféré
  - Dernière interaction
  - Solde dû
  - Statut
  - Actions
- Right and bottom cockpit:
  - Prochains rendez-vous
  - Communications récentes
  - Autorisations à traiter
  - Indice d’engagement familles
  - Soldes en retard

## Backend wiring

The page uses:

- `listAngelcare360Parents(...)`
- existing parent create/edit drawer through `Angelcare360PeopleDrawer`
- `angelcare360_invoices` for family balances through linked students
- `angelcare360_messages` for communication signals
- `angelcare360_authorizations` if present
- `angelcare360_parent_appointments` if present
- `angelcare360_audit_logs` for activity signals

Missing optional sources are handled as empty states rather than invented values.

## Constraints respected

- No fake parents.
- No fake children.
- No fake balances.
- No fake appointments.
- No static business rows.
- No seed files.
- No migrations.
- No global sidebar redesign.
- No operator/admin pages touched.
- Existing parent create/edit workflow preserved.

## Local verification

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
