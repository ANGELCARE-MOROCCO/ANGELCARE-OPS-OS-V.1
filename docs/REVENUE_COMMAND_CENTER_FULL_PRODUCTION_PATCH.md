# Revenue Command Center Full Production Patch

This mega patch covers:

- Database consolidation
- Canonical API layer
- Prospects full production wiring
- Appointments full production wiring
- Daily tasks full production wiring
- Partnerships + B2C wiring
- Executive analytics from real tables
- Removal of fallback/localStorage as production source
- Route cleanup + sidebar sync registry

## Injection order

1. Copy the ZIP contents into the app root.
2. Run the SQL migration in Supabase:
   - `supabase/migrations/20260521_0100_revenue_command_center_full_production_consolidation.sql`
3. Run build:
   - `npm run build`
4. Start the app locally:
   - `npm run dev`
5. Smoke test:
   - `node scripts/revenue-command-center-production-smoke-test.mjs`

## What this patch changes

### Database

Creates/normalizes the canonical tables:

- `revenue_accounts`
- `revenue_contacts`
- `revenue_prospects`
- `revenue_opportunities`
- `revenue_tasks`
- `revenue_appointments`
- `revenue_partnerships`
- `revenue_b2c_cases`
- `revenue_documents`
- `revenue_activities`
- `revenue_command_action_logs`

It also adds:

- indexes
- update triggers
- compatibility entity backfill triggers
- analytics view: `revenue_command_center_analytics`
- baseline authenticated RLS policies

### Canonical APIs

Adds/overwrites canonical endpoints:

- `GET/POST/PATCH /api/revenue-command-center/prospects`
- `GET/POST/PATCH /api/revenue-command-center/tasks`
- `GET/POST/PATCH /api/revenue-command-center/appointments`
- `GET/POST /api/revenue-command-center/partnerships`
- `GET/POST /api/revenue-command-center/b2c`
- `GET /api/revenue-command-center/analytics`
- `GET/POST /api/revenue-command-center/activity`
- `GET /api/revenue-command-center/sidebar`

All write actions log into:

- `revenue_activities`
- `revenue_command_action_logs`

### Routes

Adds canonical production pages:

- `/revenue-command-center/daily-tasks`
- `/revenue-command-center/partnerships`
- `/revenue-command-center/b2c-workflow`
- `/revenue-command-center/revenue-analytics`
- `/revenue-command-center/activity-timeline`
- `/revenue-command-center/documents`

### Sidebar sync

Adds:

- `lib/revenue-command-center/route-registry.ts`
- `/api/revenue-command-center/sidebar`

Use this registry in your global sidebar instead of hardcoding Revenue links.

## Important production note

This patch does not delete your old visual workspaces. It consolidates production data underneath them and gives you one canonical API/data layer.

After this patch is stable, archive the old `v9`, `v10`, `v11`, `v12`, `max`, `recovery`, and localStorage-only flows gradually. Do not delete them before confirming all current pages compile and route correctly.

## No fake data rule

Production pages must not use fake fallback records. If Supabase returns empty data, show an empty state and a sync warning. This patch moves the system in that direction by making the canonical endpoints return only real database data.
