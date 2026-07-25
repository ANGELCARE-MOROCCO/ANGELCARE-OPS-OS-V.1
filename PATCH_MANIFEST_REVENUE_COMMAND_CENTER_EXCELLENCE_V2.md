# ANGELCARE Revenue Command Center Excellence v2
## Incremental Patch Manifest

**Patch type:** Incremental over `ANGELCARE_REVENUE_COMMAND_CENTER_EXCELLENCE_v1_PATCH.zip`
**Purpose:** Workspace Sovereignty Foundation — full-width page estate, uniform collapsible/extractable primary sidebar, removal of duplicate partnership primary navigation, and source-level full-cycle gap audit.

## Application files changed

1. `apps/ops-web/app/(protected)/revenue-command-center/_shared/RevenueCommandUnifiedLayout.tsx`
2. `apps/ops-web/app/(protected)/revenue-command-center/_shared/revenue-command-experience.css`
3. `apps/ops-web/components/revenue-command-center/RevenueCommandCenterSidebar.tsx`
4. `apps/ops-web/app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.module.css`
5. `apps/ops-web/components/revenue-command-center/CanonicalRevenueWorkspace.tsx`
6. `apps/ops-web/components/revenue-command-center/RevenuePartnershipsEnterprisePage.tsx`
7. `apps/ops-web/components/revenue-command-center/PartnersDirectoryWorkspace.tsx`
8. `apps/ops-web/scripts/verify-revenue-command-center-uiux-excellence.mjs`

## Documentation added

- `docs/revenue-command-center/ANGELCARE_REVENUE_COMMAND_CENTER_WORKSPACE_SOVEREIGNTY_AND_FULL_CYCLE_AUDIT.md`
- `PATCH_MANIFEST_REVENUE_COMMAND_CENTER_EXCELLENCE_V2.md`
- `APPLY_REVENUE_COMMAND_CENTER_EXCELLENCE_V2.txt`
- `ANGELCARE_REVENUE_COMMAND_CENTER_EXCELLENCE_v2.patch`

## Protected systems not changed

- `app/api/**`
- `supabase/**`
- database migrations
- authentication and `requireAccess('revenue.view')`
- permissions and RLS
- Revenue Command OS strategy/execution engines
- workers and webhooks
- Gmail, WhatsApp, Calendar and payment adapters
- Browser OS contracts
- existing route files and route parameters
- live hooks and data mutations

## Verification

Run from `apps/ops-web`:

```bash
node scripts/verify-revenue-command-center-uiux-excellence.mjs
```

Expected result:

```text
98 checks passed. No contract violation detected by the static acceptance gate.
```
