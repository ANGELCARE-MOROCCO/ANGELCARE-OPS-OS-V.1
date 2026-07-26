# Phase 10 Live-Schema Reconciliation

The supplied Supabase inventory contained **91 relevant tables** across Revenue Command, Email OS, Market OS, AC360, browser-extension and legacy B2B domains.

## Authoritative structures retained

- `public.revenue_campaigns`
- `public.revenue_communication_threads`
- `public.revenue_communication_events`
- `public.revenue_communication_delivery_events`
- Canonical prospect, account, contact, appointment, opportunity, proposal, contract, payment and realization structures from v1-v9
- Email OS sender identities as a provider/sender readiness bridge
- Partner referral attribution for cross-source allocation control

## Structures deliberately not absorbed

- `market_os_campaign*` remains Market OS owned.
- AC360 campaign structures remain AngelCare 360 owned.
- Browser-extension campaign caches remain extension owned.
- Older B2B sequence/campaign tables remain legacy and are not silently declared canonical.
- Email OS provider/event structures remain Email OS owned.

## Compatibility strategy

The included preflight checks the canonical Revenue columns and identifier types before any mutation. It rejects a partially installed Phase 10 schema, a missing communication foundation, incompatible prospect identity, or missing conversion/realization dependencies. The migration is additive, transactional, RLS-protected and reversible.

## Live-data limitations

The inventory proves object shape and RLS posture, not business-data correctness or provider credential health. Provider and sender readiness must be recorded truthfully after deployment. No delivery/open/reply event is inferred from configuration alone.
