# AC360 Phase 3G — Advanced Live Records, Module-Specific Action Forms & Real Data Tables

Phase 3G upgrades the French-native Morocco customer-end routed module screens with:

- live endpoint record extraction from each module route,
- safe fallback when runtime dashboards return only aggregates or empty data,
- advanced dense real-record tables,
- module-specific action forms for Finance, Admissions, Présence, Élèves & Familles, ParentTrust and Growth Menu,
- guarded payload preview before AC360 command modal execution,
- endpoint, billing, entitlement, credit and governance signals preserved in French.

No SQL migration is required. The phase remains customer-end UI only and preserves the premium white theme.

## Apply

```bash
unzip -o AngelCare_360_Phase3G_Live_Records_Action_Forms_Patch_20260701.zip -d .
node scripts/verify-ac360-phase3g-live-records-action-forms.mjs
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false
```

## Test routes

- `/angelcare-360/customer/finance-creances`
- `/angelcare-360/customer/admissions-crm`
- `/angelcare-360/customer/presence-operations`
- `/angelcare-360/customer/eleves-familles`
- `/angelcare-360/customer/parenttrust`
- `/angelcare-360/customer/facturation-growth-menu`
