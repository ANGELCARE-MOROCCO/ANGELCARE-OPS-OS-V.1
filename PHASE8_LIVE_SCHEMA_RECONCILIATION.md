# Phase 8 Live-Schema Reconciliation

## Production contracts preserved

- `public.revenue_prospects.id` is TEXT and remains TEXT.
- `public.revenue_partnerships.id` is UUID.
- Cross-module partnership links in tasks, appointments and contracts remain TEXT-compatible.
- Accounts, opportunities, proposals, negotiations, contracts, payment confirmations and realization events remain authoritative in their existing phase layers.

## Additive Phase 8 ownership

Phase 8 owns partnership stakeholders, qualifications, programs, benefits, obligations, activation planning, referrals, attribution conflicts and decisions, performance periods, scorecards, reviews, recovery, renewal readiness, expansion, risks and closure.

## Source-of-truth boundaries

- Proposal/Negotiation: Phase 6.
- Agreement/Signature/Payment/Activation/Realization: Phase 7 and Finance.
- Commission or reward payment: Finance only.
- Referral attribution: Phase 8, but realized value must reference an authoritative Phase 7 realization event.

## Cutover rule

Run `20260725_partnership_referral_performance_live_schema_preflight.sql`. Any partial Phase 8 install, wrong identifier type, missing Phase 6/7 dependency, orphan cross-module partnership reference or conflicting authoritative table must return `BLOCKED`. Do not run the migration in that state.
