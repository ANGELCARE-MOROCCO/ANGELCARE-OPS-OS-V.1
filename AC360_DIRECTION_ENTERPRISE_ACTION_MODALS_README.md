# AngelCare 360 — Direction Cockpit Enterprise Action Map & Modal System

This patch upgrades the Cockpit de Direction from a generic confirmation-modal behavior to a mapped enterprise action system.

## What is included

- Centralized action map: `lib/ac360/customer-direction-action-map.ts`
- Specific modal families for all existing cockpit buttons
- Modal types: period selector, site selector, alert center, command palette, create action, launch control, risk register, report center, export center, report builder, detail drawer, decision approval, escalation drawer, mobile quick action, success/proof confirmation
- Every button resolves into a business operation, payload, form fields, entitlement message, proof label, recommended next actions, and server execution payload
- Existing cockpit production API remains the execution endpoint: `/api/ac360/customer/cockpit-direction`
- Client-facing French wording only; no SQL/Supabase/phase/runtime developer wording in modal UI
- Premium white corporate UI preserved

## Apply

```bash
cd ~/Desktop/angelcare-opsos-app
unzip -o ~/Downloads/AngelCare_360_Direction_Enterprise_Action_Modals_Mega_Patch_20260703.zip -d .
node scripts/verify-ac360-direction-enterprise-action-modals.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```

## Test

Open:

- `/angelcare-360`
- `/angelcare-360/customer`
- `/angelcare-360/customer/cockpit-direction`
- `/angelcare-360/customer/cockpit-direction/finance`
- `/angelcare-360/customer/cockpit-direction/admissions`
- `/angelcare-360/customer/cockpit-direction/rapports`
- `/angelcare-360/customer/cockpit-direction/gouvernance`

Click the existing buttons: period, sites, alerts, action rapide, créer action, ouvrir rapport, lancer contrôle, exporter, the execution strip buttons, `Voir tout`, `Voir détail`, report templates, generator controls, downloads and mobile dock actions.

Each one should open a specific enterprise-grade workflow, not the old repeated generic modal.
