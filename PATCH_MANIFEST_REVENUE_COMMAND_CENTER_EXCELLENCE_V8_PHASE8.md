# PATCH MANIFEST — ANGELCARE Revenue Command Center Excellence v8

## Phase
Strategic Partnerships, Referrals, Performance, Renewal & Expansion Control Plane.

## Cumulative prerequisite
Excellence v1 through v7, including production TEXT prospect compatibility and the Phase 7 SQL compatibility hotfix.

## Changed application files
- Total changed or added files under `apps/ops-web`: **59**
- Individually rebuilt partnership route wrappers: **18**
- Protected partnership API route files: **24**
- Partnership route estate governed: **24/24** (18 newly rebuilt + 6 authoritative specialized Phase 6/7 routes)

## Database additions
- 26 additive support tables
- 3 command/read views
- 5 business atomic commands
- 1 realization-reversal synchronization trigger
- Read-only preflight, controlled rollback and three verification SQL files

## Mandatory release control
This package includes `scripts/release-revenue-command-center-partnership-phase8.mjs` and the npm command:

```bash
npm run revenue-command-center:phase8:release
```

The command blocks deployment unless Node is 22.17+ or 24, dependencies are installed, cumulative static gates pass, focused TypeScript passes, CSS Module purity passes and the exact `npm run build` succeeds.

## Production-build status of this generated artifact
Not claimed. Dependency installation could not complete in the artifact environment, and its Node 22.16 runtime is below the release gate minimum. The package must not be deployed until the included release gate passes on the user repository.

## File inventory
- `app/(protected)/revenue-command-center/partnerships/[id]/decision-map/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/[id]/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/[id]/qualification/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/[id]/recovery/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/[id]/referrals/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/decision-map/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/executive/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/growth/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/high-value/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/meetings/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/new/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/performance/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/pipeline/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/qualification/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/recovery/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/referrals/page.tsx`
- `app/(protected)/revenue-command-center/partnerships/risk/page.tsx`
- `app/api/revenue-command-center/partnership/activation/evaluate/route.ts`
- `app/api/revenue-command-center/partnership/benefits/route.ts`
- `app/api/revenue-command-center/partnership/closure/route.ts`
- `app/api/revenue-command-center/partnership/expansion/route.ts`
- `app/api/revenue-command-center/partnership/milestones/route.ts`
- `app/api/revenue-command-center/partnership/obligations/route.ts`
- `app/api/revenue-command-center/partnership/partnerships/[id]/route.ts`
- `app/api/revenue-command-center/partnership/partnerships/route.ts`
- `app/api/revenue-command-center/partnership/performance/close/route.ts`
- `app/api/revenue-command-center/partnership/performance/periods/route.ts`
- `app/api/revenue-command-center/partnership/portfolio/route.ts`
- `app/api/revenue-command-center/partnership/programs/route.ts`
- `app/api/revenue-command-center/partnership/qualification/route.ts`
- `app/api/revenue-command-center/partnership/recovery/route.ts`
- `app/api/revenue-command-center/partnership/referrals/[id]/route.ts`
- `app/api/revenue-command-center/partnership/referrals/accept/route.ts`
- `app/api/revenue-command-center/partnership/referrals/attribution/route.ts`
- `app/api/revenue-command-center/partnership/referrals/conflicts/route.ts`
- `app/api/revenue-command-center/partnership/referrals/route.ts`
- `app/api/revenue-command-center/partnership/renewal/route.ts`
- `app/api/revenue-command-center/partnership/reviews/route.ts`
- `app/api/revenue-command-center/partnership/risks/route.ts`
- `app/api/revenue-command-center/partnership/stakeholders/route.ts`
- `app/api/revenue-command-center/partnership/transition/route.ts`
- `components/revenue-command-center/partnership-enterprise/RevenuePartnershipWorkspace.module.css`
- `components/revenue-command-center/partnership-enterprise/RevenuePartnershipWorkspace.tsx`
- `components/revenue-command-center/partnership-enterprise/route-contracts.ts`
- `components/revenue-command-center/partnership-enterprise/types.ts`
- `components/revenue-command-center/partnership-enterprise/usePartnershipPortfolio.ts`
- `lib/revenue-command-center/partnership-enterprise/server.ts`
- `package.json`
- `scripts/release-revenue-command-center-partnership-phase8.mjs`
- `scripts/verify-revenue-command-center-partnership-enterprise-phase8.mjs`
- `scripts/verify-revenue-command-center-uiux-excellence.mjs`
- `supabase/migrations/20260725_0600_revenue_partnership_referral_performance_completion.sql`
- `supabase/revenue-command-center/preflight/20260725_partnership_referral_performance_live_schema_preflight.sql`
- `supabase/revenue-command-center/rollback/20260725_revenue_partnership_enterprise_phase8_rollback.sql`
- `supabase/revenue-command-center/verification/20260725_partnership_performance_calculation_verification.sql`
- `supabase/revenue-command-center/verification/20260725_partnership_referral_attribution_verification.sql`
- `supabase/revenue-command-center/verification/20260725_partnership_referral_performance_rls_verification.sql`
- `tsconfig.revenue-command-center-partnership-phase8.json`
