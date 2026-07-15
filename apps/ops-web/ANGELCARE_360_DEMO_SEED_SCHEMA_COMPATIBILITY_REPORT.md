# ANGELCARE 360 Demo Seed Schema Compatibility Report

## Error Found
- Supabase SQL Editor failed on `column "metadata_json" of relation "angelcare360_operator_clients" does not exist`.
- The current SQL shape error was `VALUES lists must all be the same length` in `public.angelcare360_operator_feature_flags`.
- The demo seed also hit `column "hire_date" is of type date but expression is of type text` in the staff insert/select block.
- The current hardening pass fixed `column "id" is of type uuid but expression is of type text` in the `angelcare360_emergency_contacts` block.
- The current hardening pass also fixed `there is no unique or exclusion constraint matching the ON CONFLICT specification` by moving eligible demo upserts to primary-key conflict mode.

## Root Cause
- The demo seed used `metadata_json` in operator-table inserts even though the migration-backed operator schema does not define that column on those tables.
- The feature-flags block had a shorter column list after the earlier compatibility fix, but a few locked rows still carried a trailing JSON value.
- A `VALUES` CTE alias was inferred as `text` and then inserted into a `uuid` `id` column without an explicit cast.

## Tables Affected
- `public.angelcare360_operator_clients`
- `public.angelcare360_operator_tenants`
- `public.angelcare360_operator_feature_flags`
- `public.angelcare360_staff`
- `public.angelcare360_students`
- `public.angelcare360_admission_leads`
- `public.angelcare360_admission_applications`
- `public.angelcare360_emergency_contacts`
- `public.angelcare360_invoices`
- `public.angelcare360_payments`
- `public.angelcare360_reclamations`

## Columns Removed Or Adjusted
- Removed `metadata_json` from the `angelcare360_operator_clients` insert and conflict update.
- Removed `metadata_json` from the `angelcare360_operator_tenants` insert and conflict update.
- Removed `metadata_json` from the `angelcare360_operator_feature_flags` insert and conflict update.
- Preserved the demo notes in `angelcare360_operator_clients.notes`.
- Removed the stray trailing JSON values from the locked `angelcare360_operator_feature_flags` rows so every VALUES tuple matches the column list.

## Other Schema Mismatches Fixed
- Verified the remaining operator-table inserts match the migration-backed schema for:
  - `angelcare360_operator_plans`
  - `angelcare360_operator_packages`
  - `angelcare360_operator_subscriptions`
  - `angelcare360_operator_billing_accounts`
  - `angelcare360_operator_invoices`
  - `angelcare360_operator_payments`
  - `angelcare360_operator_payment_gates`
  - `angelcare360_operator_dunning_actions`
  - `angelcare360_operator_onboarding_tasks`
  - `angelcare360_operator_support_tickets`
  - `angelcare360_operator_contracts`
  - `angelcare360_operator_renewals`
  - `angelcare360_operator_service_requests`
  - `angelcare360_operator_incidents`
  - `angelcare360_operator_tasks`
  - `angelcare360_operator_notes`
  - `angelcare360_operator_service_events`
  - `angelcare360_operator_audit_logs`
  - `angelcare360_operator_usage_limits`
- Verified the seed blocks around the feature flags insert and the nearby operator/customer multi-row inserts for tuple-length consistency.
- Added explicit `::date` and `::timestamptz` casts in the AngelCare 360 demo seed for values sourced from `VALUES` CTEs and inserted into typed date/timestamp columns.
- Completed full `VALUES` CTE hardening across the customer-school seed for `uuid`, `date`, `timestamptz`, `numeric`, `integer`, and `boolean` targets.
- Converted eligible demo upserts to `ON CONFLICT (id)` so reruns do not depend on business-key unique constraints in the live project.

## Payment Gate Row Preserved
- `AC360-GATE-DEMO-PE-CASA-0001` remains in the seed.
- The payment-gate row still uses the migration-backed columns from `20260709_angelcare360_payment_gate_document_export_engine.sql`.
- The demo client `AC360-DEMO-PE-CASA` remains in the seed.

## Demo Identity Preserved
- `AC360-DEMO-PE-CASA` remains in the seed.
- The corrected seed stays idempotent via stable IDs and `ON CONFLICT` upserts.

## Cleanup Script
- Created `supabase/seeds/20260709_angelcare360_complete_demo_customer_cleanup.sql`.
- The cleanup removes only demo-specific records tied to `AC360-DEMO-PE-CASA`, `AC360-DEMO-PE-CASA-SCHOOL`, `petits-explorateurs-casa-demo`, and the demo invoice/contract/gate codes.

## Idempotency
- The seed remains idempotent because the operator inserts continue to use stable IDs or unique conflict keys with `ON CONFLICT` upserts.
- Eligible inserts now use stable primary-key ids, so the seed reruns even when business-key unique constraints are missing in the live database.
- The cleanup is also precise and uses demo-specific filters rather than broad truncation.
- The current seed file is already wrapped in `begin; ... commit;`.

## ON CONFLICT Audit
- Audited every `ON CONFLICT` clause in `supabase/seeds/20260709_angelcare360_complete_demo_customer.sql`.
- Eligible demo upserts now use `ON CONFLICT (id)` primary-key mode.
- Business-key unique constraints are no longer required for the seed rerun path on the supported demo rows.

## One Project Mode
- The seed and cleanup pair support the one-Supabase-project workflow when the project is intentionally used as the demo environment.
- Seed now, verify, test, then run cleanup later if the demo data needs to be removed permanently.

## V2 Schema-Safe Seed
- Old seed deprecated for execution: `supabase/seeds/20260709_angelcare360_complete_demo_customer.sql`
- New v2 schema-safe seed: `supabase/seeds/20260710_angelcare360_complete_demo_customer_schema_safe.sql`
- New v2 cleanup: `supabase/seeds/20260710_angelcare360_complete_demo_customer_schema_safe_cleanup.sql`
- The source of truth for inserts moved from guessed/hand-maintained columns to runtime live-table shape via `jsonb_populate_record`.
- Optional tables are skipped when the live project does not have them.
- The demo client `AC360-DEMO-PE-CASA` remains preserved in the v2 seed.
- The payment gate `AC360-GATE-DEMO-PE-CASA-0001` remains preserved in the v2 seed.

## Production Warning
- Do not run this seed in production unless you intentionally want demo data in production.
- Prefer local or staging databases.
