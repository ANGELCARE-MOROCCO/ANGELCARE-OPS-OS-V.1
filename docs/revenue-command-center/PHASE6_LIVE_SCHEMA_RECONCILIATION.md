# Mega ZIP 6 — Live Schema Reconciliation

## Required authoritative foundation

- `revenue_prospects.id` — TEXT
- `revenue_accounts.id` — UUID
- `revenue_contacts.id` — UUID
- `revenue_opportunities.id` — UUID
- `revenue_tasks.id` — UUID
- `revenue_appointments.id` — UUID
- `revenue_meeting_outcomes.id` — UUID
- `revenue_communication_events.id` — UUID

## Cutover classification

The supplied preflight returns:

- `READY / FRESH_INSTALL` when none of the 23 v6 tables exists
- `READY / COMPATIBLE_REAPPLY` when all 23 compatible tables exist
- `BLOCKED / PARTIAL_SCHEMA_RECONCILIATION_REQUIRED` when only part of the v6 schema exists
- `BLOCKED` when a foundation identity type is incompatible

## Prohibited action

Do not convert `revenue_prospects.id` to UUID. Existing TEXT identifiers remain the production authority.

## Migration behavior

The migration is additive and transactional. It creates the complete v6 object set as one governed unit, enables RLS, grants authenticated read-only visibility, reserves mutation functions for `service_role`, creates immutable snapshots, and produces contract handoffs only after final commercial gates pass.
