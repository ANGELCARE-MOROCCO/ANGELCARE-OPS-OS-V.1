# Revenue Command Center Canonical Stabilization Audit

## What I found

The RCC is close, but not canonical yet. The main instability is not visual. It is architectural:

1. `useLiveProspects` reads `revenue_prospects` but also merges `/api/revenue-command-center/appointments/command`. That creates a competing second prospect source and can inflate or alter counts.
2. Profile controls have been partially moved to `revenue-action-engine`, but older files still exist for `prospect_*` tables and can be reintroduced accidentally.
3. Task and appointment pages depend on command views. That is useful for labels, but the canonical source must remain `revenue_tasks` and `revenue_appointments`.
4. Activity/event naming is split. Some code uses `revenue_events`; your target architecture says `revenue_activities`.
5. Some actions log after writing the business record. If the log RPC/table is missing, the main action can fail even though the task/appointment insert is valid.
6. LocalStorage recovery bridge is still present. It should remain isolated as a recovery/import tool, not as an active RCC runtime source.

## What this patch changes

This pack does not rewrite the UI. It stabilizes the data spine:

- `useLiveProspects` now reads only `revenue_prospects`.
- `useLiveTasks` now reads only `revenue_tasks`.
- `useLiveAppointments` now reads only `revenue_appointments`.
- Adds `useLiveActivities` for `revenue_activities`.
- Updates the export barrel so future modules share the same live sync layer.
- Updates `revenue-action-engine` so tasks, appointments, comments, documents, contacts, and pipeline moves write to canonical `revenue_*` tables.
- Adds safer activity logging: it writes to `revenue_activities`, falls back to `revenue_events`, then falls back to the RPC without blocking the main action.
- Updates `production-execution-store` so it uses canonical tables directly and only uses command views as safe read enhancement/fallback.
- Adds a SQL migration for `revenue_activities` and stable task/appointment command views.

## Injection order

1. Copy `lib/revenue-command-center/live-sync/*` into your app.
2. Copy `lib/revenue-command-center/revenue-action-engine.ts`.
3. Copy `lib/revenue-command-center/production-execution-store.ts`.
4. Run the SQL migration in Supabase SQL editor:
   `supabase/migrations/20260516_rcc_canonical_activity_and_views.sql`
5. Build locally:
   `npm run build`
6. Validate these routes:
   - `/revenue-command-center/prospects`
   - `/revenue-command-center/prospects/directory`
   - `/revenue-command-center/prospects/[id]`
   - `/revenue-command-center/daily-tasks`
   - `/revenue-command-center/appointments`
   - `/revenue-command-center/revenue-analytics`

## Rollback

This patch is rollback-safe because it only replaces library files and adds a non-destructive SQL table/view layer. To rollback code, restore the previous versions of the copied files. The SQL migration does not drop or modify business data.

## Next stabilization phase

After this pack passes build, the next phase should remove old active imports to:

- `prospect-action-engine.ts`
- `daily-tasks-command-store.ts`
- `appointments-command-store.ts`
- localStorage runtime stores

Do that after this canonical data spine is stable, not before.
