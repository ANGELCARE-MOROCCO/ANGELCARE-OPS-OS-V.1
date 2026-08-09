# Ambassador OS Production Transition Plan

## Phase A — Database
Apply schema, indexes, and adapted RLS.

## Phase B — API
Replace placeholder route handlers with authenticated Supabase operations.

## Phase C — Permissions
Connect user role source and server-side enforcement.

## Phase D — Audit
Persist all high-risk actions.

## Phase E — Queues
Add real worker runtime and retry/dead-letter logic.

## Phase F — Realtime
Connect live channels with role filtering.

## Phase G — AI Runtime
Persist AI recommendations, memory, approvals, and execution logs.

## Phase H — Notifications
Connect providers with consent and delivery logs.

## Phase I — Observability
Add telemetry, incident tracking, and alerting.

## Phase J — Production Release
Run full test checklist, deploy, validate, monitor.
