# ANGELCARE Revenue Command Center — Excellence v3 Phase 2 Patch Manifest

**Scope:** Prospect, Account, Contact & Opportunity Enterprise Completion
**Required baseline:** Excellence v2 — Workspace Sovereignty
**Changed implementation and report files (excluding this manifest):** 53 (25 modified, 28 new)

## Installation boundary

- Extract from the ANGELCARE repository root.
- Do not apply the SQL migration before the read-only live-schema preflight reports `CUTOVER_GATE = READY`.
- No unrelated module, worker, webhook, browser-extension contract or Revenue Command OS engine is included.
- No full Next.js build is claimed by this delivery environment.

## Static acceptance

```bash
cd apps/ops-web
node scripts/verify-revenue-command-center-uiux-excellence.mjs
node scripts/verify-revenue-command-center-prospect-enterprise-phase2.mjs
```

Expected: **99 global checks** and **258 Phase 2 checks**.

## File register

- **NEW** `ANGELCARE_REVENUE_COMMAND_CENTER_PHASE2_PROSPECT_ENTERPRISE_IMPLEMENTATION_REPORT.md`
- **NEW** `APPLY_REVENUE_COMMAND_CENTER_EXCELLENCE_V3_PHASE2.txt`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/[id]/decision-map/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/[id]/negotiation/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/[id]/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/[id]/proposal/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/[id]/qualification/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/[id]/recovery/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/analytics/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/appointments/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/decision-map/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/directory/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/executive/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/high-value/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/negotiation/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/new/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/performance/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/pipeline/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/proposals/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/qualification/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/recovery/page.tsx`
- **MODIFIED** `apps/ops-web/app/(protected)/revenue-command-center/prospects/risk/page.tsx`
- **NEW** `apps/ops-web/app/api/revenue-command-center/accounts/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/contacts/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/opportunities/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/opportunities/transition/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/prospects/[id]/decision-map/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/prospects/[id]/qualification/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/prospects/[id]/risks/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/prospects/[id]/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/prospects/enterprise/create/route.ts`
- **NEW** `apps/ops-web/app/api/revenue-command-center/prospects/enterprise/route.ts`
- **MODIFIED** `apps/ops-web/app/api/revenue-command-center/prospects/route.ts`
- **NEW** `apps/ops-web/components/revenue-command-center/prospects-enterprise/DossierEnterpriseModals.tsx`
- **NEW** `apps/ops-web/components/revenue-command-center/prospects-enterprise/ProspectEnterprise.module.css`
- **NEW** `apps/ops-web/components/revenue-command-center/prospects-enterprise/ProspectEnterpriseDossier.tsx`
- **NEW** `apps/ops-web/components/revenue-command-center/prospects-enterprise/ProspectEnterpriseWorkspace.tsx`
- **NEW** `apps/ops-web/components/revenue-command-center/prospects-enterprise/route-contracts.ts`
- **NEW** `apps/ops-web/components/revenue-command-center/prospects-enterprise/types.ts`
- **NEW** `apps/ops-web/components/revenue-command-center/prospects-enterprise/useEnterpriseDialog.ts`
- **NEW** `apps/ops-web/components/revenue-command-center/prospects-enterprise/useProspectEnterpriseData.ts`
- **NEW** `apps/ops-web/docs/revenue-command-center/PHASE2_LIVE_SCHEMA_RECONCILIATION.md`
- **MODIFIED** `apps/ops-web/lib/auth/permissions.ts`
- **NEW** `apps/ops-web/lib/revenue-command-center/api-access.ts`
- **MODIFIED** `apps/ops-web/lib/revenue-command-center/canonical-server.ts`
- **NEW** `apps/ops-web/lib/revenue-command-center/enterprise-server.ts`
- **NEW** `apps/ops-web/scripts/verify-revenue-command-center-prospect-enterprise-phase2.mjs`
- **MODIFIED** `apps/ops-web/scripts/verify-revenue-command-center-uiux-excellence.mjs`
- **NEW** `apps/ops-web/supabase/migrations/20260725_0100_revenue_prospect_account_opportunity_enterprise_completion.sql`
- **NEW** `apps/ops-web/supabase/revenue-command-center/preflight/20260725_prospect_enterprise_live_schema_preflight.sql`
- **NEW** `apps/ops-web/supabase/revenue-command-center/rollback/20260725_revenue_prospect_enterprise_phase2_rollback.sql`
- **NEW** `apps/ops-web/tsconfig.revenue-command-center-prospect-phase2.json`

## Database files

- Read-only preflight: `apps/ops-web/supabase/revenue-command-center/preflight/20260725_prospect_enterprise_live_schema_preflight.sql`
- Additive migration: `apps/ops-web/supabase/migrations/20260725_0100_revenue_prospect_account_opportunity_enterprise_completion.sql`
- Controlled rollback: `apps/ops-web/supabase/revenue-command-center/rollback/20260725_revenue_prospect_enterprise_phase2_rollback.sql`
- Reconciliation note: `apps/ops-web/docs/revenue-command-center/PHASE2_LIVE_SCHEMA_RECONCILIATION.md`

## Declared completion boundary

- 21 prospect-family routes individually rebuilt.
- 10 new controlled API route files plus the canonical prospect API extension.
- 11 additive operational support tables, one canonical read view and one atomic dossier RPC.
- Proposal-to-contract-to-payment, communication persistence and campaign attribution remain in later signed phases and are not represented as complete in this patch.
