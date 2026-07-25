# Patch Manifest — ANGELCARE Revenue Command Center Excellence v6

## Delivery

**Name:** Proposal Studio, Pricing, Margin Protection & Negotiation Command
**Cumulative prerequisite:** Excellence v1–v5 installed
**Application root:** repository root
**Revenue routes preserved:** 151
**Existing routes individually rebuilt in this phase:** 8
**Governed proposal/negotiation sub-experiences:** 38
**Protected proposal API route files:** 29
**Additive operational tables:** 23

## Protected boundaries

This patch does not convert or rename legacy prospect identifiers. It preserves `public.revenue_prospects.id` as TEXT and does not replace authentication, the Revenue sidebar, tasks, appointments, communications, browser-extension contracts, Gmail, WhatsApp, Calendar, workers or unrelated Market OS modules.

## Application files

- Eight route wrappers for prospect proposals, negotiations, partnership offers and B2C quotations
- `components/revenue-command-center/proposal-enterprise/*`
- `lib/revenue-command-center/proposal-enterprise/server.ts`
- `app/api/revenue-command-center/proposal/**`
- Cumulative static-verifier updates
- Focused phase TypeScript configuration

## Database files

- Read-only live-schema preflight
- Additive transactional migration
- Controlled destructive rollback
- RLS/object verification
- Calculation verification

## Documentation

- Full implementation report
- Route acceptance ledger
- Modal and sub-experience acceptance ledger
- Live-schema reconciliation note
- Application instructions

## Installation rule

Extract the ZIP at the repository root. Do not extract from inside `apps/ops-web`. Run all cumulative static verifiers before database activation. Run the SQL preflight before the migration and continue only when `CUTOVER_GATE = READY`.

## Honest acceptance boundary

The package has passed offline static, syntax, focused TypeScript, CSS reference, patch and ZIP simulation gates. It does not claim that a live Supabase migration, authenticated transaction or Vercel build was executed in the offline source environment.
