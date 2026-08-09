# Database activation order

## 1. Back up and select the intended database

Confirm the Supabase project and branch before applying anything. This migration is additive but creates a sovereign authorization control plane.

## 2. Run the preflight query

Execute `SCHEMA_PREFLIGHT_20260804.sql`. Existing objects with incompatible types must be reviewed before the migration. Do not convert unrelated production columns.

## 3. Apply the migration

Execute:

```text
supabase/migrations/20260804_global_authorization_intelligence_reconciliation_command.sql
```

It creates scanner jobs, persisted inventory and source work, evidence, topology, manifests, reconciliation findings/plans, approvals, executions, checkpoints, verification results, rollback packages, cache epochs, and command events.

All new tables have RLS enabled and are accessed through protected server-side service-role routes. Execution functions are revoked from `public` and granted to `service_role` only.

## 4. Verify objects

Run:

```sql
select
  to_regclass('public.access_scanner_jobs') as jobs,
  to_regclass('public.access_scan_inventory_items') as inventory,
  to_regclass('public.access_authorization_evidence') as evidence,
  to_regclass('public.access_topology_nodes') as topology,
  to_regclass('public.access_authority_manifests') as manifests,
  to_regclass('public.access_reconciliation_plans') as plans,
  to_regclass('public.access_execution_runs') as executions,
  to_regclass('public.access_rollback_packages') as rollbacks,
  to_regprocedure('public.access_governance_claim_inventory_items(uuid,text,integer)') as claim_inventory,
  to_regprocedure('public.access_governance_introspect_authority()') as introspection,
  to_regprocedure('public.access_governance_execute_plan(uuid,uuid,text,text)') as execute_plan,
  to_regprocedure('public.access_governance_execute_rollback(uuid,uuid,text,text)') as execute_rollback;
```

No returned value may be `NULL`.

## 5. Deploy application code

Deploy only after the static verifier and targeted TypeScript configuration pass.

## 6. First production scan

Run a scan from the UI. Review generated manifests and findings. Do not confirm a manifest until its mutation, verification, and optional rollback RPCs already exist and have been reviewed independently.

## 7. First execution

Use a low-risk, non-cross-tenant case. Confirm:

- approval is recorded;
- the operation is transactional;
- verification results are `passed`;
- the cache epoch changes;
- an audit event is written;
- a rollback package is available only when a registered rollback RPC exists.
