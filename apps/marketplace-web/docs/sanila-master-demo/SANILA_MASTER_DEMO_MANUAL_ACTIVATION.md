# SANILA Master Demo — Manual Migration and Activation Runbook

Status: source prepared only. No command in this document has been executed by Codex.

Seed authority: `SANILA_MASTER_DEMO_SEED_2026_09_V1`.

## Safety doctrine

- Apply every migration manually and individually.
- Never infer an environment from its name. Record the resolved database host and project identity before any write.
- Take an independently verified backup before production activation.
- Never paste or log the service-role key, database password, generated PIN, or native School Admin password.
- Stop after every migration and complete its read-only gate before proceeding.
- Set `SANILA_DEMO_PIN_PEPPER` to a stable, randomly generated secret of at least 32 characters in the application secret store before issuing a PIN. Rotation invalidates existing PIN lookup digests and requires controlled PIN regeneration.

## Baseline preflight

READ-ONLY VERIFICATION:

```sql
select current_database() as database_name,
       inet_server_addr() as server_address,
       current_user as database_user,
       current_setting('server_version') as server_version;

select to_regclass('public.app_users') as app_users,
       to_regclass('public.angelcare360_schools') as schools,
       to_regclass('public.angelcare360_operator_tenants') as operator_tenants,
       to_regclass('public.angelcare_marketplace_public_inquiries') as public_inquiries,
       to_regclass('public.angelcare360_students') as students,
       to_regclass('public.angelcare360_invoices') as invoices;
```

Expected: every `to_regclass` value is non-null. If any dependency is missing, stop and apply the repository’s existing schema baseline first. Never fabricate the missing table.

## Migration 1

FILE: `supabase/migrations/20260903_sanila_master_demo_foundation.sql`

PURPOSE: Master Demo configuration, grants, sessions, audit/reset/side-effect event stores, one-active-demo constraint, deterministic seed factory, canonical seed, verification and guarded reset authorities, RLS and service-role-only grants.

PRECONDITIONS: baseline preflight passes; no active transaction; verified backup; application has not begun issuing Demo PINs.

WRITE / MIGRATION COMMAND — USER EXECUTES MANUALLY:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/marketplace-web/supabase/migrations/20260903_sanila_master_demo_foundation.sql
```

EXPECTED SUCCESS: one transaction commits without warnings or skipped dependencies.

POST-MIGRATION READ-ONLY VERIFICATION:

```sql
select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in (
  'sanila_demo_configs','sanila_demo_access_grants','sanila_demo_sessions',
  'sanila_demo_access_events','sanila_demo_reset_runs','sanila_demo_side_effect_events'
)
order by c.relname;

select indexname, indexdef from pg_indexes
where schemaname='public' and indexname like 'sanila_demo_%'
order by indexname;

select p.proname, has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
       has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('sanila_seed_master_demo','sanila_verify_master_demo','sanila_reset_master_demo','sanila_is_master_demo_school')
order by p.proname;

select count(*) as active_master_demo_count
from public.sanila_demo_configs where classification='master_demo' and active;
```

Expected: all six tables have RLS enabled; expected indexes exist; anon/authenticated cannot execute mutating authorities; service role can; active count is `0` before provisioning or `1` if resuming a controlled activation.

ROLLBACK / RECOVERY NOTES: the file is transaction-wrapped, so a statement failure rolls back the entire migration. Do not manually drop objects after a failed transaction. Capture the exact error, repair source, and reapply the corrected file. After a committed production migration, use a separately reviewed forward recovery migration rather than ad-hoc destructive rollback.

NEXT GATE: Migration 1 read-only verification must pass.

## Migration 2

FILE: `supabase/migrations/20260903_sanila_master_demo_security_hardening.sql`

PURPOSE: keyed PIN lookup digest, fingerprint-based failure throttle/lockout, service-only attempt authorities, and explicit Operator Demo view/manage RBAC permissions.

PRECONDITIONS: Migration 1 verification passes; `app_permissions`, `app_roles`, and `app_role_permissions` exist; `super_admin` and/or `operator_admin` roles have been provisioned by the existing identity baseline.

WRITE / MIGRATION COMMAND — USER EXECUTES MANUALLY:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/marketplace-web/supabase/migrations/20260903_sanila_master_demo_security_hardening.sql
```

EXPECTED SUCCESS: one transaction commits; no PIN values are generated or stored by the migration.

POST-MIGRATION READ-ONLY VERIFICATION:

```sql
select column_name, is_nullable, data_type
from information_schema.columns
where table_schema='public' and table_name='sanila_demo_access_grants' and column_name='pin_lookup_digest';

select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='sanila_demo_pin_attempts';

select code,label,module_key from public.app_permissions
where code in ('operator.demo.environment.view','operator.demo.environment.manage') order by code;

select r.code as role_code,p.code as permission_code
from public.app_role_permissions rp
join public.app_roles r on r.id=rp.role_id
join public.app_permissions p on p.id=rp.permission_id
where p.code in ('operator.demo.environment.view','operator.demo.environment.manage')
order by r.code,p.code;

select grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='sanila_demo_pin_attempts' order by grantee,privilege_type;
```

Expected: digest column exists; attempts table has RLS; both permissions exist; only intended Operator roles are mapped; service-role grants exist and client roles have none.

ROLLBACK / RECOVERY NOTES: statement failure rolls back the transaction. If the migration committed but application activation has not begun, recovery should still be a reviewed forward migration. Never expose or backfill plaintext PINs. Existing pre-hardening grants, if any, must receive newly generated PINs through the Demo Desk after `SANILA_DEMO_PIN_PEPPER` is configured.

NEXT GATE: source deployment with the stable pepper configured, followed by real Operator provisioning.

## Manual provisioning and activation order

All actions below are WRITE actions unless explicitly marked read-only. They are prepared, not executed.

1. Apply Migration 1 manually.
2. Run Migration 1 read-only verification.
3. Apply Migration 2 manually.
4. Run Migration 2 read-only verification.
5. Configure the stable `SANILA_DEMO_PIN_PEPPER` application secret and deploy the reviewed source.
6. Use the existing AngelCare 360 Operator client/tenant provisioning workflow to create exactly one Operator tenant. Do not insert a tenant directly.
7. Use that workflow to create/link the real SANILA school record.
8. Use Tenant Access to create the internal School Admin identity and active school role. Do not expose its password to prospects.
9. Open `/angelcare-360-operator/demo`; classify the linked tenant/school/Admin with the exact confirmation `CLASSIFY SANILA MASTER DEMO`.
10. READ-ONLY: verify exactly one active configuration and validate its tenant/school/Admin links.
11. Run `SEED CANONIQUE` with confirmation `SEED SANILA MASTER DEMO`.
12. Run `VÉRIFIER`; require seed version `SANILA_MASTER_DEMO_SEED_2026_09_V1`, healthy status and canonical counts.
13. Create an internal public inquiry using the real public inquiry flow.
14. In `/angelcare-marketplace/admin/sanila-demo`, move the grant through review and formal approval; issue an internal test grant.
15. Test gateway activation, exact usage accounting, expiry combinations, suspension, reactivation, revocation and PIN regeneration.
16. Test two independent grants resolving to the same school and independent sessions.
17. Test demo/normal-school cross-tenant boundaries and RLS using separate principals.
18. Test all provider paths using mocks/inactive adapters; require `MASTER_DEMO_SIDE_EFFECT=BLOCKED_OR_SIMULATED` for the demo and normal guard pass-through for a normal school.
19. Test global suspension and reactivation.
20. Mutate safe finance, attendance, inventory, claims and admissions records; execute confirmed reset; verify canonical restoration and preserved authorities/history. Repeat reset and test normal-school refusal.
21. Review Operator and Demo Desk audit surfaces.
22. Obtain explicit release approval before any external prospect grant is issued.

## Post-provision read-only authority checks

```sql
select id,operator_tenant_id,school_id,school_admin_app_user_id,classification,active,
       access_status,billing_mode,seed_version,seed_health,safety_status,seeded_at,verified_at,last_reset_at
from public.sanila_demo_configs order by created_at;

select c.id,c.school_id,t.id as tenant_id,t.school_id as tenant_school_id,s.name,s.status,
       u.id as school_admin_id,u.status as school_admin_status
from public.sanila_demo_configs c
join public.angelcare360_operator_tenants t on t.id=c.operator_tenant_id
join public.angelcare360_schools s on s.id=c.school_id
left join public.app_users u on u.id=c.school_admin_app_user_id
where c.active;

select public.sanila_verify_master_demo(id) from public.sanila_demo_configs where active;
```

The last query invokes the verification authority and updates verification metadata; treat it as an application verification operation, not a strictly read-only SQL statement. For a strictly read-only inspection, use the configuration/link query and the Operator snapshot without invoking the function.

## Expected canonical counts after seed

`students=600`, `parents=450`, `classes=36`, `employees=72`, `teachers=48`, `admissions=60`, `attendance=6000`, `invoices=600`, `payments=480`, `transport=300`, `library=120`, `library_loans=45`, `inventory=40`, `claims=8`.

These are design authorities until the user applies the migrations and records actual database results.

## External adapter coverage authority

- Email: `lib/angelcare360/email/email-os-bridge.ts` and `lib/angelcare360/operator/email-command.ts` call the central authority before SMTP/Email OS delivery.
- SMS, WhatsApp and push: `lib/ac360/school-communication.ts` calls the central authority before every channel dispatch RPC, even when providers are later enabled.
- Payments: `lib/angelcare360/payment-gates/customer-gate.ts` checks the central authority before provider configuration, customer or checkout creation.
- GPS: current School Transport exposes a locked, audited GPS placeholder and performs no provider request. `gps.dispatch` and `gps.sync` are reserved as blocked external operations in the central mutation policy.
- Webhooks and third-party integrations: current School Branding functions persist connector/webhook configuration and delivery records but contain no outbound HTTP dispatch. Webhook/integration/provider send, dispatch, sync and invoke operations are centrally classified as external side effects so a future reachable dispatcher must call `assertExternalSideEffectAllowed` before I/O.
- Normal customers: the authority returns `allowed=true` when the resolved school/tenant is not the active Master Demo; it does not install a platform-wide provider switch.

## Production activation gate

Production activation remains a separate, explicitly approved operation: independently identify production, back up, apply each migration manually with the gates above, provision through Operator authority, classify, seed, verify, create one internal grant, complete runtime/security/reset certification, then request release approval. No production action is authorized by this runbook alone.
