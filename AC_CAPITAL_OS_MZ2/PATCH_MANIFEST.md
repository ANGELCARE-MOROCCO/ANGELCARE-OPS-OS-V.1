# AC CAPITAL OS MZ2 Patch Manifest

## Installed route
- `apps/ops-web/app/(protected)/ac-capital-os/page.tsx`

## Installed API
- `apps/ops-web/app/api/ac-capital-os/executive-cockpit/route.ts`

## Components
- `components/ac-capital-os/AcCapitalOsExecutiveCockpit.tsx`
- `components/ac-capital-os/AcCapitalOsShell.tsx`
- `components/ac-capital-os/AcCapitalOsFoundation.tsx`
- `components/ac-capital-os/AcCapitalOsWorkspaceCard.tsx`
- `components/ac-capital-os/ac-capital-os.module.css`

## Libraries
- `lib/ac-capital-os/types.ts`
- `lib/ac-capital-os/foundation.ts`
- `lib/ac-capital-os/routes.ts`
- `lib/ac-capital-os/executive-cockpit.ts`
- `lib/ac-capital-os/rbac.ts`
- `lib/ac-capital-os/audit.ts`

## Migration
- `supabase/migrations/20260727_ac_capital_os_mz2_executive_cockpit.sql`

## Contract tokens
- `Capital Executive Cockpit V2`
- `Today’s command plan`
- `AI-prepared actions`
- `Capital Readiness Score`
- `Human coordinator approves and executes`


## V2 surgical correction
- Corrected Executive Cockpit API import depth for `apps/ops-web/app/api/ac-capital-os/executive-cockpit/route.ts`.
- Verifier now checks the API import path, not only file presence.
