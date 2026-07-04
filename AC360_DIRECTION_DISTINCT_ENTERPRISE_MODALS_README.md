# AC360 Direction Cockpit — Distinct Enterprise Workflow Modals

This build replaces the uniform enterprise action modal experience with distinct workflow families.

## What changed

- Period selector is now a compact analytical context-control workflow.
- Multi-site selector is now a network scope control panel.
- Alert center is now a three-column operational drawer.
- Command palette is now a command launcher workspace.
- Direction action creation is now a structured executive action form.
- Launch control is now a governed control/audit workflow.
- Risk register is now a risk matrix + risk declaration workflow.
- Reports and report builder are now board-pack/report-production workflows with A4 preview.
- Export center is now a file/proof/export workflow.
- KPI/detail views open analytical drawers.
- Decision approval opens a governance approval drawer.
- Escalation opens an urgent SLA escalation drawer.
- Mobile quick action opens a compact mobile-oriented workflow.

## User-facing rules preserved

- French-native Morocco-ready UI.
- Premium white corporate style.
- No developer/internal language exposed.
- No Supabase/SQL/migration/runtime/phase vocabulary in modal UI.
- Execution still flows through `/api/ac360/customer/cockpit-direction`.

## Verification

Run:

```bash
node scripts/verify-ac360-direction-distinct-enterprise-modals.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```
