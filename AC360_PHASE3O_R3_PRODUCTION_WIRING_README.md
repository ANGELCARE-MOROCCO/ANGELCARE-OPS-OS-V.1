# AngelCare 360 — Phase 3O-R3
## Cockpit de Direction Production Wiring, CRUD Reality Pass & Sellable Runtime Foundation

This patch turns the Phase 3O-R2 visual contract cockpit into a production-wired direction cockpit foundation.

It does **not** claim every AC360 module is finished. It specifically makes the **Cockpit de Direction** more real and sellable by adding persistence, API execution, guarded action workflows, proof references, runtime readiness, and migration-backed CRUD surfaces.

## What is included

- SQL migration for real direction cockpit tables:
  - `ac360_direction_actions`
  - `ac360_direction_decisions`
  - `ac360_direction_risks`
  - `ac360_direction_reports`
  - `ac360_direction_exports`
  - `ac360_direction_audit_events`
- New server production library:
  - `lib/ac360/customer-direction-cockpit-production.ts`
- New API route:
  - `GET /api/ac360/customer/cockpit-direction`
  - `POST /api/ac360/customer/cockpit-direction`
  - `PATCH /api/ac360/customer/cockpit-direction`
- UI runtime layer inside `Cockpit de Direction`:
  - sellable readiness score
  - SQL persistence status
  - real decisions count
  - real actions count
  - critical risks count
  - reporting pipeline count
  - restrictions / plan signal
- Guarded action modal execution:
  - preflight AC360
  - policy/credits/restrictions signal
  - server-side execution
  - persisted row
  - audit event
  - proof reference
  - UI refresh after execution
- Vercel build stability lock preserved:
  - `webpackBuildWorker: false`
  - `config.cache = false`
  - `NODE_OPTIONS=--max-old-space-size=16384 next build --webpack`
  - Node `20.x`

## Required deployment order

1. Apply the patch.
2. Run the SQL migration in Supabase SQL Editor or your migration flow.
3. Run the verifier.
4. Run TypeScript.
5. Run production build.
6. Test the cockpit routes.

```bash
cd ~/Desktop/angelcare-opsos-app

node scripts/verify-ac360-phase3o-r3-production-wiring.mjs

NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false

npm run build
```

## SQL migration

Apply:

```text
database/ac360_phase3o_r3_direction_cockpit_production.sql
```

If this migration is not applied, the UI remains safe but shows `SQL requis`; actions will not be truly persisted.

## Routes to test

```text
/angelcare-360/customer/cockpit-direction
/angelcare-360/customer/cockpit-direction/operations
/angelcare-360/customer/cockpit-direction/finance
/angelcare-360/customer/cockpit-direction/admissions
/angelcare-360/customer/cockpit-direction/equipe
/angelcare-360/customer/cockpit-direction/securite
/angelcare-360/customer/cockpit-direction/parents
/angelcare-360/customer/cockpit-direction/rapports
/angelcare-360/customer/cockpit-direction/gouvernance
```

## Sellable reality boundary

This phase makes the Cockpit de Direction materially more real:

- real storage
- real action execution route
- real audit/proof references
- real dashboard runtime layer
- real guarded execution posture

The next production passes should continue replacing static visual widgets with live module data and attaching each subpage action to the correct module-specific backend endpoint.
