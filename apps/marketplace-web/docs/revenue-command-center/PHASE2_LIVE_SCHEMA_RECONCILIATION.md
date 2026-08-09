# Revenue Command Center — Phase 2 Live-Schema Reconciliation

## Purpose

This note governs the production cutover for the prospect, account, contact and opportunity completion package. It does not authorize blind migration execution.

## Confirmed source drift

The supplied repository contains two incompatible historical definitions for `public.revenue_prospects`:

- `20260514_revenue_prospects_source_of_truth.sql` defines `id text`.
- `20260521_0100_revenue_command_center_full_production_consolidation.sql` defines `id uuid` and introduces UUID foreign keys from accounts, contacts, opportunities, tasks and appointments.

A `CREATE TABLE IF NOT EXISTS` statement does not convert an existing text primary key to UUID. Therefore, source files alone cannot prove which physical contract is active in production.

## Mandatory preflight

Run the read-only file below in the Supabase SQL editor before the Phase 2 migration:

`supabase/revenue-command-center/preflight/20260725_prospect_enterprise_live_schema_preflight.sql`

The final `CUTOVER_GATE` must report `READY` and `public.revenue_prospects.id` must be `uuid`.

## Blocked condition

If the live identifier is `text`, stop. Do not apply the Phase 2 migration. A separate approved data migration must provide:

1. A deterministic legacy ID → UUID mapping table.
2. Backups and row-count evidence.
3. Foreign-key discovery across every schema.
4. UUID backfill for child records.
5. Atomic constraint and primary-key cutover.
6. Compatibility handling for external deep links or browser-extension references.
7. Validation queries and rollback instructions.

## Additive Phase 2 contract

When the UUID gate passes, the migration:

- preserves existing canonical rows;
- adds missing enterprise columns;
- creates 11 operational support tables;
- creates the prospect enterprise read model;
- creates auditable opportunity stage history;
- creates an atomic dossier-creation RPC;
- enables RLS on new tables;
- adds indexes and update triggers;
- performs no table drop, truncation or business-data deletion.

## Rollback

The controlled rollback file removes Phase 2-only objects but intentionally retains additive base-table columns to prevent live data loss:

`supabase/revenue-command-center/rollback/20260725_revenue_prospect_enterprise_phase2_rollback.sql`

Run it only after backup and explicit approval.
