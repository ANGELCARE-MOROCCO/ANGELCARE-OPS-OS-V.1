# AngelCare 360 — Phase 3K

## Role-Based Customer Portals, Permission-Aware Navigation & Mobile Execution Views

Phase 3K continues the French-native Morocco customer-end UI after Phase 3J. It does not add SQL. It strengthens the customer cockpit with role-specific experiences, permission-aware module visibility, and mobile execution surfaces while preserving the AC360 billing/governance doctrine and the premium white enterprise UI contract.

## Delivered

- French-native customer role portal model
- Direction, Finance, Admissions, Teacher/Class, and AngelCare Success portal profiles
- Permission-aware module visibility
- Role-specific cockpit KPIs
- Role-specific permission rules
- Role-specific mobile execution actions
- Portal home module routing
- Mobile execution dock for customer cockpit and dedicated module screens
- Billing, credits, restrictions, audit and governance copy preserved
- Premium white theme preserved
- Vercel build stability lock preserved

## New / updated files

- `lib/ac360/customer-role-portal-model.ts`
- `components/ac360/customer/Ac360CustomerRolePortal.tsx`
- `components/ac360/customer/Ac360CustomerExperienceShell.tsx`
- `components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx`
- `scripts/verify-ac360-phase3k-role-portals-mobile-execution.mjs`
- `AC360_PHASE3K_ROLE_PORTALS_MOBILE_EXECUTION_README.md`

## Verification

```bash
node scripts/verify-ac360-phase3k-role-portals-mobile-execution.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```

## UI rules preserved

- French-native Morocco customer-end UI
- White premium enterprise theme
- No generic admin dashboard
- Role, plan, billing, restriction and usage awareness
- Mobile execution without bypassing governance
- Vercel build stability lock preserved
