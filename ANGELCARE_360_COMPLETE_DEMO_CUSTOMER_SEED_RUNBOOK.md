# ANGELCARE 360 Complete Demo Customer Seed Runbook

## Purpose
Seed one realistic demo school/customer dossier for AngelCare 360 so the operator backoffice and customer command center can be exercised end to end without manual record creation.

## What The Demo Customer Contains
- Operator client, tenant, plan, subscription, billing account, invoices, payments, dunning, onboarding, support, contract, renewal, service events, and audit logs.
- School core data for one Casablanca crèche/preschool tenant.
- Students, parents, staff, classes, attendance, academics, finance, transport, library, inventory, messaging, notifications, complaints, reports, exports, and document metadata.
- A billing-overdue state for overlay and locked-action simulation.

## Exact Demo Identity
- Display name: `École Les Petits Explorateurs Casablanca`
- Legal name: `Les Petits Explorateurs Casablanca SARL`
- Client code: `AC360-DEMO-PE-CASA`
- Tenant slug: `petits-explorateurs-casa-demo`
- City: `Casablanca`
- Country: `Maroc`
- Client type: `Crèche & préscolaire`
- Primary contact: `Mme Salma Bennani`
- Primary email: `salma.bennani.demo@angelcarehub.ma`
- Primary phone: `+212 600 000 101`
- Billing email: `billing.demo@angelcarehub.ma`

## Operator Routes To Test
- `/angelcare-360-operator/clients`
- Client dossier detail view
- Tenant detail view
- Subscription detail view
- Invoices list and invoice print
- Payment gate related controls, if the UI already has them
- Feature flags
- Usage limits
- Onboarding tasks
- Support tickets
- Renewal records
- Audit trail

## Customer Command Center Routes To Test
- `/angelcare-360-command-center`
- School dashboard
- Students
- Parents / guardians
- Staff and educators
- Classes / sections
- Admissions
- Attendance
- Academics
- Finance
- Transport
- Library
- Inventory
- Messaging / notifications / reclamations
- Documents / reports / exports

## Payment Gate Simulation Steps
- The seed marks the SaaS subscription as `past_due`, the invoice `AC360-INV-DEMO-0003` as overdue, and seeds `AC360-GATE-DEMO-PE-CASA-0001` as the blocking payment gate.
- Use the migration-backed payment gate table, not billing heuristics, for the overlay test.
- Verify that online payment actions are blocked or locked while the active gate is present.
- Verify that manual validation or manual payment processing paths still work where the UI supports them.

## PDF/A4 Simulation Steps
- Use the seeded `DEMO-DOC-SCHOOL-001` document metadata and the report template `DEMO-RPT-TPL-001`.
- Open the report or invoice print route in the customer command center.
- Confirm the PDF/A4 action uses the seeded export metadata and prints in A4 format.

## Email-OS Simulation Steps
- Use the seeded invoice and billing notification rows as the source of truth for email-billing flows.
- The seed does not touch Email-OS code or dirty files.
- If the UI sends through Email-OS, use a safe internal test mailbox only.

## Exports Simulation Steps
- Open the seeded report exports and export files.
- Test PDF, CSV, and A4 print views where the UI exposes them.
- Confirm XLSX remains locked if the product flow checks feature flags.

## How To Apply Locally Or In Staging
1. Confirm you are on a local or staging database.
2. Do not run this on production.
3. Apply all required ANGELCARE 360 migrations first.
4. Confirm the operator foundation migration exists or is applied:
   `supabase/migrations/20260709_angelcare360_operator_backoffice_foundation.sql`
5. Confirm the payment gate / document / export migration exists or is applied:
   `supabase/migrations/20260709_angelcare360_payment_gate_document_export_engine.sql`
6. Apply the demo seed:
   `supabase/seeds/20260709_angelcare360_complete_demo_customer.sql`
7. Open `/angelcare-360-operator/clients`.
8. Find `AC360-DEMO-PE-CASA`.
9. Open the client dossier.
10. Confirm payment gate `AC360-GATE-DEMO-PE-CASA-0001` exists.
11. Open `/angelcare-360-command-center`.
12. Confirm the blocking overlay appears.
13. Confirm the overlay cannot close.
14. Confirm online payment is locked because no provider exists.
15. Mark the gate manual processed from the operator side.
16. Refresh the customer command center and confirm the overlay disappears.
17. Test waive/cancel flow if needed on a recreated gate.

## One Supabase Project Mode
- This seed can be run in the only Supabase project if that project is intentionally being used as the demo environment.
- The demo data is identifiable by `AC360-DEMO-PE-CASA`, `AC360-DEMO-PE-CASA-SCHOOL`, `petits-explorateurs-casa-demo`, and the related demo invoice, contract, and gate codes.
- The cleanup file can be run later to remove the demo data permanently.
- This is not recommended once real clients are live unless you are in a controlled maintenance window.
- Always export or back up anything important before running the cleanup.
- Exact run order:
  1. Run the operator foundation migration.
  2. Run the payment gate migration.
  3. Run the corrected demo seed.
  4. Verify the demo client and gate.
  5. Test simulations.
  6. Later, run `supabase/seeds/20260709_angelcare360_complete_demo_customer_cleanup.sql` if you want to remove the demo records.

## Strong Warning
- Do not run this seed against production.
- Do not stage, commit, or push from this task.
- Do not run remote database writes from this seed.
- Do not run this seed on production unless you are intentionally creating demo data there.
- Prefer local or staging databases.
- Cleanup is destructive.
- Do not run the cleanup unless you intentionally want to remove the demo records.
- Do not modify cleanup filters casually.
- Never run a broad delete without the demo code filters.

## How To Identify Demo Data
- `client_code = AC360-DEMO-PE-CASA`
- `tenant_slug = petits-explorateurs-casa-demo`
- `school_code = AC360-DEMO-PE-CASA-SCHOOL`
- Demo emails use `@angelcarehub.ma` or `@petits-explorateurs-casa.demo`
- Demo codes often start with `DEMO-`

## V2 Schema-Safe Seed - Recommended Runner
- Deprecated for execution: `supabase/seeds/20260709_angelcare360_complete_demo_customer.sql`
- Recommended execution seed: `supabase/seeds/20260710_angelcare360_complete_demo_customer_schema_safe.sql`
- Recommended cleanup: `supabase/seeds/20260710_angelcare360_complete_demo_customer_schema_safe_cleanup.sql`
- The v2 seed uses the live table shape at runtime through `jsonb_populate_record`, so extra JSON keys are ignored by the table row type.
- Missing optional tables are skipped with notices instead of failing the whole seed.
- Required monetization tables still fail fast if they are missing, which keeps the live project honest.
- The v2 flow supports the one-project demo workflow and keeps the demo client, tenant, and payment gate stable.
- Use the v2 cleanup when you need to remove only the v2 demo dossier after testing.

## How To Remove Demo Data Manually
- Remove rows in reverse dependency order starting from exports, reports, communications, attendance, academics, finance, transport, library, inventory, and then school/operator core rows.
- Filter by `client_code`, `tenant_slug`, `school_code`, `invoice_number`, `subscription_code`, `contract_code`, `message_code`, `notification_code`, `reclamation_code`, `report_code`, and `export_code`.
- If the database has foreign keys and cascades, still prefer an explicit cleanup plan rather than a blanket truncate.

## Known Skipped Areas
- No campus/site table was found, so the multi-site intent is stored in metadata only.

## Troubleshooting Seed Schema Mismatches
- Error: `column "metadata_json" of relation "angelcare360_operator_clients" does not exist`
- Cause: The seed was using a non-migration column in the operator dossier inserts.
- Fix: Use the corrected seed aligned to the migration-backed schema.
- If you see the same error on other operator tables, compare the seed column list to the exact migration definition before adding or renaming any field.
- Error: `column "hire_date" is of type date but expression is of type text`
- Cause: A CTE text date value was inserted into a `date` column without an explicit cast.
- Fix: Use the corrected seed with `st.hire_date::date` and equivalent casts for other date/timestamp columns sourced from `VALUES` CTEs.
- Error: `column "id" is of type uuid but expression is of type text`
- Cause: A `VALUES` CTE inferred UUID-like strings as `text` and inserted them into a `uuid` column without an explicit cast.
- Fix: Use the corrected seed with explicit `::uuid` casts in the affected `VALUES` CTE select lists.

## Reversible Cleanup
- Cleanup file: `supabase/seeds/20260710_angelcare360_complete_demo_customer_schema_safe_cleanup.sql`
- The cleanup removes only demo-specific records tied to the demo school, client, tenant, invoice, contract, and gate codes.
- The cleanup is meant for permanent removal later, not for casual resets in a live environment.

## Troubleshooting Relation Errors
- If a foreign key reference fails, check that the upstream demo row exists first.
- Verify that the school, academic year, class, section, student, parent, and staff codes match the exact values in the seed.
- If a unique conflict appears, rerun the SQL after confirming the target row exists and the conflict key is correct.
- If a missing table error appears, confirm the table exists in the migration set before adding any new seed rows.
- If relation `angelcare360_operator_payment_gates` does not exist, apply the payment gate migration first.
- If the overlay does not appear, verify the gate status is `active` or `manual_pending` and `blocking` is `true`.
- If the online payment button is disabled, this is expected because no real provider is configured.

## Troubleshooting Conflict Target Errors
- Error: `there is no unique or exclusion constraint matching the ON CONFLICT specification`
- Cause: The seed used an `ON CONFLICT` target that does not exist as a primary key or unique constraint in the active schema.
- Fix: Use `supabase/seeds/20260710_angelcare360_complete_demo_customer_schema_safe.sql`, which keys off the live table shape and uses stable primary-key ids.
- If the live project is missing a business-key unique index, do not fall back to that business key for the demo rerun path.
