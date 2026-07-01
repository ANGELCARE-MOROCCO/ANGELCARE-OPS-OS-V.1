# AngelCare 360 — Phase 3C Customer Module Workspace Deep Navigation

Phase 3C keeps the French-native Morocco customer-end UI and adds deep operational module workspaces inside the AC360 customer cockpit.

## Added

- `components/ac360/customer/Ac360CustomerModuleWorkspace.tsx`
- `lib/ac360/customer-workspace-model.ts`
- `scripts/verify-ac360-phase3c-customer-module-workspaces.mjs`
- Updated `components/ac360/customer/Ac360CustomerExperienceShell.tsx`

## Scope

No SQL migration. No dark theme. No detached admin-template pages. The customer cockpit now exposes dense module-level workspaces with saved views, filters, pipeline/status cards, operational tables, command surfaces, timeline proof, billing/governance states, and premium empty states.

## Apply

```bash
cd ~/Desktop/angelcare-opsos-app
unzip -o ~/Downloads/AngelCare_360_Phase3C_Customer_Module_Workspaces_Patch_20260701.zip -d .
node scripts/verify-ac360-phase3c-customer-module-workspaces.mjs
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false
```

Open:

```text
/angelcare-360/customer
```
