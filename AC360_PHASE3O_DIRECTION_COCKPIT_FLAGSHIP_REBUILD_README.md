# AngelCare 360 — Phase 3O Cockpit de Direction Flagship Rebuild

Phase 3O rebuilds only the customer-end `Cockpit de Direction` as a dedicated flagship executive operating cockpit.

## Scope

- French-native Morocco customer-end UI.
- Dedicated route: `/angelcare-360/customer/cockpit-direction`.
- Dedicated subroutes:
  - `/synthese`
  - `/aujourdhui`
  - `/risques`
  - `/decisions`
  - `/finance`
  - `/admissions`
  - `/parents`
  - `/equipe`
  - `/securite`
  - `/transport`
  - `/automatisations`
  - `/rapports`
  - `/gouvernance`
- No SQL migration.
- No generic shared-module body for this flagship page.

## UX coverage

- Top Intelligence Bar.
- Executive Daily Brief.
- Institution Health Score.
- Critical Decision Zone.
- Risk Board.
- Deep in-page navigation.
- Section-specific workflows and tables.
- Right Context Rail.
- Direction action modal with guarded payload preview.
- Mobile execution dock.
- Governance, billing, credits, restrictions and proof language.

## Files

- `lib/ac360/customer-direction-cockpit-model.ts`
- `components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx`
- `app/(protected)/angelcare-360/customer/cockpit-direction/page.tsx`
- `app/(protected)/angelcare-360/customer/cockpit-direction/[view]/page.tsx`
- `scripts/verify-ac360-phase3o-direction-cockpit-flagship-rebuild.mjs`

## Verify

```bash
node scripts/verify-ac360-phase3o-direction-cockpit-flagship-rebuild.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```

## Build lock preserved

- `webpackBuildWorker: false`
- `config.cache = false`
- `NODE_OPTIONS=--max-old-space-size=16384 next build --webpack`
- Node `20.x`
