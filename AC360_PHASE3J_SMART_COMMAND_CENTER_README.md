# AngelCare 360 — Phase 3J

## Cross-Module Smart Command Center, Global Search, Saved Views Sync & Customer Cockpit Intelligence Layer

Phase 3J extends the French-native Morocco customer cockpit with a global intelligent command surface. It does not add SQL and it does not replace the existing Phase 3A–3I module workspaces. It layers a cross-module search, smart action launcher, synchronized saved views and cockpit intelligence signals across the existing customer-end routes.

## Added

- `lib/ac360/customer-command-center-model.ts`
- `components/ac360/customer/Ac360CustomerSmartCommandCenter.tsx`
- `scripts/verify-ac360-phase3j-smart-command-center.mjs`

## Updated

- `components/ac360/customer/Ac360CustomerExperienceShell.tsx`
- `components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx`
- `next.config.ts`, `package.json`, `.nvmrc` preserved with the production build stability lock.

## UX coverage

- French-native global search: modules, commandes, facturation and governance.
- Cross-module command launcher.
- Saved Views Sync through localStorage/broadcast event.
- Cockpit intelligence: runtime coverage, credits, restrictions and risk map.
- Billing/usage/governance proof surfaces.
- Premium white theme only.

## Build lock preserved

- `webpackBuildWorker: false`
- `config.cache = false`
- `NODE_OPTIONS=--max-old-space-size=16384 next build --webpack`
- Node `20.x` + `.nvmrc` set to `20`

## Verification

```bash
node scripts/verify-ac360-phase3j-smart-command-center.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```
