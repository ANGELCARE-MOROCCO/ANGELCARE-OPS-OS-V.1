# Mega ZIP 7 — Live Schema Reconciliation and Production Boundary

## Confirmed cumulative production contract

Mega ZIP 7 is designed around the accepted live identity model established during previous phases:

- `public.revenue_prospects.id` remains `text`.
- `public.revenue_tasks.id` remains `uuid`.
- `public.revenue_appointments.id` remains `uuid`.
- Phase 6 provides `revenue_contract_handoffs` from accepted proposal outcomes.

The migration does not convert or rename legacy prospect identifiers.

## Required live preflight

Before applying the migration, run:

`apps/ops-web/supabase/revenue-command-center/preflight/20260725_contract_signature_payment_activation_live_schema_preflight.sql`

Proceed only when the final gate reports `READY`.

The preflight checks:

- TEXT prospect identity compatibility.
- Presence of the Phase 2 account/opportunity foundation.
- Presence of the Phase 4 execution/audit foundation.
- Presence of the Phase 5 communication/meeting foundation.
- Presence of the Phase 6 proposal, commercial outcome and contract-handoff foundation.
- Absence of a partially installed Mega ZIP 7 schema.
- Existing table and column compatibility.

## Additive objects

The migration creates 28 operational support tables, 3 read models and 7 protected atomic commands. Existing compatible tables remain authoritative and no accounting ledger is recreated.

## Revenue versus Finance ownership

Revenue Command owns:

- Contractual payment requirements.
- Payment schedules and promises.
- Collection actions.
- Finance handoff state.
- Activation gates.
- Commercial realization state and evidence references.

Finance remains authoritative for:

- Invoices.
- Payment ledger and bank reconciliation.
- Receipts and tax records.
- Final payment confirmation.

A realization command succeeds only when its Finance reference matches a persistent authoritative payment confirmation.

## Safety controls

- Transactional migration.
- Partial-installation stop gate.
- Read-only authenticated RLS on new support tables.
- Mutations restricted to protected server commands.
- `security definer` RPC execution revoked from browser roles.
- Service-role-only execution of atomic commands.
- Row locking for critical state changes.
- Idempotent creation and realization commands.
- One controlled reversal per realization event.
- Explicit rollback package.

## Honest limitation

The supplied build environment cannot inspect or mutate the user’s live Supabase project. The included preflight and verification scripts are the authoritative production gates. No claim of live migration success is made until those scripts pass in the real environment.
