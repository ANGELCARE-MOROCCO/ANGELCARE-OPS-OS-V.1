# AngelCare Market OS Ambassador — Patch 1 Enterprise Design System & Route Shell

## Scope
Patch 1 installs the shared Figma-style UIX foundation for the Ambassador module before deeper route-by-route implementation.

This patch does not attempt to finish all 14 routes. It creates the design contract and reusable shell components needed to implement the 14 official visible journey tabs reliably in later patches.

## Strategic intent
The existing Ambassador workspace was already functional, but the page shell still carried a generic command-center feel. This patch introduces a premium, light enterprise route system aligned with the 14 reference images:

- refined white/icy-blue canvas
- production route header
- route-specific French title/subtitle/action language
- premium KPI cards
- horizontal journey navigation
- cleaner operational notices
- improved filter shell
- route definition dictionary for all core Ambassador journeys

## Files changed

- `components/market-os/ambassadors/ambassador-production-workspace.tsx`
- `components/market-os/ambassadors/design/ambassador-design-tokens.ts`
- `components/market-os/ambassadors/design/ambassador-enterprise-primitives.tsx`
- `scripts/verify-market-os-ambassadors-production.mjs`

## New design-system files

### `components/market-os/ambassadors/design/ambassador-design-tokens.ts`
Defines the route design contract:

- `ambassadorDesignTokens`
- `ambassadorRouteDefinitions`
- `getAmbassadorRouteDefinition()`

Route definitions now exist for:

1. Cockpit de pilotage
2. Ambassadeurs
3. Candidats
4. Leads & referrals
5. Conversions
6. Activation & onboarding
7. Missions terrain
8. Territoires & couverture
9. Incentives & commissions
10. Incentives & Payouts
11. Rapports & pilotage exécutif
12. Ressources & playbooks
13. Gouvernance, conformité & audit
14. Paramètres & gouvernance

Additional related modes also receive proper route definitions:

- Formation & certification
- Objectifs & KPIs
- Performances

### `components/market-os/ambassadors/design/ambassador-enterprise-primitives.tsx`
Adds reusable premium primitives:

- `AmbassadorRouteHeader`
- `AmbassadorEnterpriseButton`
- `AmbassadorMetricCard`
- `AmbassadorJourneyNav`
- `AmbassadorOperationalNotice`
- `AmbassadorFilterFrame`
- `AmbassadorSectionCard`

## Workspace changes

### Main shell
The Ambassador page canvas is now aligned to a premium enterprise dashboard structure:

- `bg-[#f6f8fb]`
- `max-w-[1680px]`
- refined white route header
- route-specific French language from the design dictionary
- no RefferQ imports or runtime changes

### Header
The old dark gradient header was replaced with `AmbassadorRouteHeader`, using:

- route-specific title
- route-specific description
- route-specific primary action
- route-specific secondary actions
- source/status chips
- updated timestamp

### KPI rail
The former generic KPI cards were replaced with six premium cards:

- Ambassadeurs actifs
- Candidats en cours
- Missions en cours
- Couverture territoires
- Readiness onboarding
- Incentives payés

### Journey navigation
The 14 visible journey tabs now render through `AmbassadorJourneyNav`, giving the module a more controlled, image-aligned route navigation foundation.

### Filter shell
The non-overview workspace filters now use `AmbassadorFilterFrame` and French operator-facing labels.

## Verification

Executed successfully in this extracted workspace:

```bash
node scripts/verify-market-os-ambassadors-production.mjs
```

Result:

```txt
Ambassador Market OS production verification passed.
```

## Not run here

This environment does not include `node_modules`, so TypeScript and Next build were not run here. Run locally after applying:

```bash
NODE_OPTIONS="--max-old-space-size=8192" ./node_modules/.bin/tsc --noEmit --pretty false
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

## Constraints respected

- No RefferQ active runtime returned.
- No DB/env/schema changes.
- No unrelated modules touched.
- No git staging, commit, or push performed.
- No alert/confirm/prompt introduced.
- This is Patch 1 only: shared design-system and route shell foundation.

## Next patch
Patch 2 should implement the first deep route group:

- `/market-os/ambassadors`
- `/market-os/ambassadors/directory`
- `/market-os/ambassadors/[id]`

Focus:

- Cockpit de pilotage
- Ambassadeurs table/CRM
- Dossier 360 drawer
- real action depth for create/edit/archive/assign territory/create mission/notes/audit
