# AC360 Phase 3O-R2 — Visual Contract Mega Rebuild: Cockpit de Direction

This patch rebuilds `Cockpit de Direction` according to the signed visual/UIX contract created from the generated high-end image projections.

## What this patch enforces

- Persistent AngelCare 360 customer shell with left sidebar visible.
- Premium white corporate UI, no dark theme.
- Top intelligence bar: search, date range, sites, notifications, quick action, user context.
- Deep subnavigation and real subroutes for the cockpit.
- Dense executive KPI strips with sparkline microcharts.
- Real page-specific layouts for:
  - Vue exécutive
  - Opérations & multi-sites
  - Finance & rentabilité
  - Admissions & croissance
  - RH & capacité
  - Qualité, risques & conformité
  - ParentTrust & expérience familles
  - Décisions, rapports & exports
  - Gouvernance compte
- Dashboard cards, heatmaps, tables, funnels, status chips, alerts, action rails and governed action modal.
- Morocco/French-native wording and MAD currency.
- Vercel build stability lock preserved.

## Routes

- `/angelcare-360/customer/cockpit-direction`
- `/angelcare-360/customer/cockpit-direction/operations`
- `/angelcare-360/customer/cockpit-direction/finance`
- `/angelcare-360/customer/cockpit-direction/admissions`
- `/angelcare-360/customer/cockpit-direction/equipe`
- `/angelcare-360/customer/cockpit-direction/securite`
- `/angelcare-360/customer/cockpit-direction/parents`
- `/angelcare-360/customer/cockpit-direction/rapports`
- `/angelcare-360/customer/cockpit-direction/gouvernance`

## Verify

```bash
node scripts/verify-ac360-phase3o-r2-visual-contract.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```
