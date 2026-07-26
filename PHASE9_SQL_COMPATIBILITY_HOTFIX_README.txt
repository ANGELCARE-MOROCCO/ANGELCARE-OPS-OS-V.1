ANGELCARE Revenue Command Center — Phase 9 SQL compatibility hotfix

Purpose
- Supports live revenue_b2c_cases schemas that expose legacy textual `owner`
  without the newer `owner_id` column.
- Adds preflight checks for ownership and all legacy core columns used by the
  migration before any mutation begins.
- Builds the ownership index against owner_id when available, otherwise owner.
- Builds revenue_b2c_retention_command_view with a stable textual owner alias.

Execution order
1. Extract this ZIP at the repository root.
2. Run the corrected canonical preflight:
   apps/ops-web/supabase/revenue-command-center/preflight/
   20260725_b2c_family_matching_retention_live_schema_preflight.sql
3. Continue only if CUTOVER_GATE = READY.
4. Run the corrected canonical migration:
   apps/ops-web/supabase/migrations/
   20260725_0700_revenue_b2c_family_matching_retention_completion.sql
5. After migration success, run the three existing Phase 9 verification files.

The prior failed migration was transactional and the missing Phase 9 tables in
verification confirm that its changes were rolled back. Do not run verification
before the corrected migration commits.
