# AngelCare Academy Production Mega Phases

## Phase 1 — Database foundation
Run `supabase/migrations/20260521_001_academy_production_schema.sql` in Supabase. It creates the live `academy_*` tables used by the module, plus command records, action logs, notifications, integrations and evaluations.

## Phase 2 — Academy-native APIs
`app/api/academy/v10/*` no longer uses Revenue Command Center tables. It writes to `academy_command_records` and `academy_action_logs`.

## Phase 3 — Lifecycle and cross-module sync
`academyProductionSync` queues command records, notifications and integration events for Market OS, Revenue Command Center, Email OS, HR and Service OS.

## Phase 4 — Missing production pages
Added dossier, settings, notifications, control tickets, evaluations, job placement, revenue sync, email templates, import/export and role matrix pages.

## Phase 5 — QA and smoke test
Run:

```bash
npm run build
node scripts/academy-production-smoke-test.mjs
```

Then test:
- `/academy`
- `/academy/trainees/dossier`
- `/academy/revenue-sync`
- `/academy/job-placement`
- `/academy/role-matrix`
