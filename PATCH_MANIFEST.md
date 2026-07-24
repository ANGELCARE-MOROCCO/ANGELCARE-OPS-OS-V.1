# ANGELCARE Revenue Command Center — Excellence v1 Patch Manifest

Apply from the repository root. This archive contains the protected frontend transformation, static verifier and implementation report.

## Scope reach

- 151 Revenue Command Center routes retain their protected layout and receive the premium global foundation.
- 139 unique route experiences are directly or transitively transformed through the rebuilt executive cockpit and shared lifecycle workspaces.
- 12 routes receive the global foundation but are explicitly not claimed as individually rebuilt in this version.

## Existing files replaced

- `apps/ops-web/app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx`
- `apps/ops-web/app/(protected)/revenue-command-center/_shared/RevenueCommandUnifiedLayout.tsx`
- `apps/ops-web/components/revenue-command-center/CanonicalRevenueWorkspace.tsx`
- `apps/ops-web/components/revenue-command-center/RevenueCommandCenterSidebar.tsx`
- `apps/ops-web/components/revenue-command-center/RevenuePartnershipsEnterpriseWorkspace.tsx`
- `apps/ops-web/components/revenue-command-center/RevenuePartnershipsEnterprisePage.tsx`
- `apps/ops-web/components/revenue-command-center/PartnershipsWhiteTextGuard.tsx`
- `apps/ops-web/components/revenue-command-center/RevenueAppointmentsV12MegaWorkspace.tsx`
- `apps/ops-web/components/revenue-command-center/RevenueDailyTasksV13McKinseyWorkspace.tsx`
- `apps/ops-web/components/revenue-command-center/RevenuePartnershipsV13ActionsWorkspace.tsx`
- `apps/ops-web/lib/revenue-command-center/route-registry.ts`

## New files

- `apps/ops-web/app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.module.css`
- `apps/ops-web/app/(protected)/revenue-command-center/_shared/revenue-command-experience.css`
- `apps/ops-web/scripts/verify-revenue-command-center-uiux-excellence.mjs`
- `docs/revenue-command-center/ANGELCARE_REVENUE_COMMAND_CENTER_UIUX_EXCELLENCE_IMPLEMENTATION_REPORT.md`

## Verify

```bash
cd apps/ops-web
node scripts/verify-revenue-command-center-uiux-excellence.mjs
```

Expected result:

```text
93 checks passed. No contract violation detected by the static acceptance gate.
```
