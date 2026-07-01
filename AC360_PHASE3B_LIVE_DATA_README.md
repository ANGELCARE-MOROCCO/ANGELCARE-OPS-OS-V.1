# AngelCare 360 — Phase 3B Live Data Wiring & Executive Cockpit Hardening

Backend/system remains unchanged. This patch wires the French customer cockpit to existing Phase 1–2U runtime endpoints with safe French fallbacks, live sync indicators, module runtime signals, runtime coverage matrix, billing/credits/restrictions visibility, refresh action, and white-theme enforcement.

Apply:

```bash
unzip -o ~/Downloads/AngelCare_360_Phase3B_Live_Data_Executive_Cockpit_Patch_20260701.zip -d .
node scripts/verify-ac360-phase3b-live-data-executive-cockpit.mjs
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false
```

Open:

```text
/angelcare-360/customer
```
