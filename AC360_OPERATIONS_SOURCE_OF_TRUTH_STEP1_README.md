# AngelCare 360 — Operations Source-of-Truth Step 1

This patch creates the real operational backbone required before building the Operations workspace UI. It is not a projection layer. It gives Operations a source of truth for daily execution, routines, incidents, tasks, staffing, transport events, quality controls, day closure and audit proof.

## What is included

- Operations database migration: `database/ac360_operations_source_of_truth_step1.sql`
- Runtime library: `lib/ac360/customer-operations-source.ts`
- Operations dashboard source API: `GET /api/ac360/customer/operations`
- Governed command API: `POST/PATCH /api/ac360/customer/operations`
- Dedicated execution endpoints for day open/close, sites, classes, capacity, routines, incidents, tasks, staff coverage, transport, quality checks and report queue.
- Verification script: `scripts/verify-ac360-operations-source-step1.mjs`

## Real source-of-truth tables

- `ac360_ops_sites`
- `ac360_ops_days`
- `ac360_ops_classes`
- `ac360_ops_class_capacity_snapshots`
- `ac360_ops_routine_templates`
- `ac360_ops_routine_events`
- `ac360_ops_incidents`
- `ac360_ops_tasks`
- `ac360_ops_staff_coverage`
- `ac360_ops_transport_events`
- `ac360_ops_quality_checks`
- `ac360_ops_day_closures`
- `ac360_ops_audit_events`

## Operations now owns these real business sources

| KPI / signal | Source table |
|---|---|
| Sites actifs | `ac360_ops_sites` |
| Journée ouverte / clôturée | `ac360_ops_days`, `ac360_ops_day_closures` |
| Classes ouvertes / capacité | `ac360_ops_classes`, `ac360_ops_class_capacity_snapshots` |
| Enfants présents / taux d’occupation | `ac360_ops_class_capacity_snapshots` |
| Couverture équipe terrain | `ac360_ops_staff_coverage` |
| Routines complétées | `ac360_ops_routine_events` |
| Incidents ouverts / critiques | `ac360_ops_incidents` |
| Tâches ouvertes / en retard | `ac360_ops_tasks` |
| Retards transport | `ac360_ops_transport_events` |
| Contrôles qualité terrain | `ac360_ops_quality_checks` |
| Preuve et historique | `ac360_ops_audit_events` |

## Main endpoints

```text
GET    /api/ac360/customer/operations
POST   /api/ac360/customer/operations
PATCH  /api/ac360/customer/operations

POST   /api/ac360/customer/operations/day/open
POST   /api/ac360/customer/operations/day/close
POST   /api/ac360/customer/operations/sites
POST   /api/ac360/customer/operations/classes
POST   /api/ac360/customer/operations/capacity-snapshots
POST   /api/ac360/customer/operations/routine-templates
POST   /api/ac360/customer/operations/routine-events
POST   /api/ac360/customer/operations/routines/[id]/complete
POST   /api/ac360/customer/operations/incidents
PATCH  /api/ac360/customer/operations/incidents/[id]
POST   /api/ac360/customer/operations/tasks
PATCH  /api/ac360/customer/operations/tasks/[id]
POST   /api/ac360/customer/operations/staff-coverage
POST   /api/ac360/customer/operations/transport-events
POST   /api/ac360/customer/operations/quality-checks
POST   /api/ac360/customer/operations/reports
```

## Apply

1. Apply `database/ac360_operations_source_of_truth_step1.sql` in the production database console.
2. Apply this patch in the app.
3. Run:

```bash
node scripts/verify-ac360-operations-source-step1.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```

## Smoke tests

```bash
curl -s http://localhost:3000/api/ac360/customer/operations | python3 -m json.tool
```

Open the operational day:

```bash
curl -s -X POST http://localhost:3000/api/ac360/customer/operations/day/open \
  -H 'Content-Type: application/json' \
  -d '{"operationalDate":"2026-07-03","payload":{"source":"manual_smoke_test"}}' | python3 -m json.tool
```

Create an operational incident:

```bash
curl -s -X POST http://localhost:3000/api/ac360/customer/operations/incidents \
  -H 'Content-Type: application/json' \
  -d '{"title":"Incident test opérations","category":"operational","severity":"medium","notes":"Validation du registre incidents opérations."}' | python3 -m json.tool
```

Create a terrain task:

```bash
curl -s -X POST http://localhost:3000/api/ac360/customer/operations/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Tâche test opérations","priority":"normal","ownerLabel":"Responsable opérations"}' | python3 -m json.tool
```

## Definition of done for this step

- The migration applies successfully.
- The verification script passes.
- TypeScript and production build pass.
- `GET /api/ac360/customer/operations` returns an Operations source summary.
- Day open/close, incidents, tasks, routines, staff coverage, transport and quality endpoints persist records with proof references.
- Direction Cockpit and future Operations UI can consume this as real source data instead of projections.
