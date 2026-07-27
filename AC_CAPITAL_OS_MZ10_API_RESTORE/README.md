# AC CAPITAL OS — MZ10 Coordinator Cockpit API Restore

This surgical patch restores only the missing previous API required by the MZ11 verifier:

`apps/ops-web/app/api/ac-capital-os/coordinator-cockpit/route.ts`

It does not touch pages, components, migrations, Market OS, or AI Provider Control.

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MZ10_COORDINATOR_COCKPIT_API_RESTORE.zip -d .

node ./AC_CAPITAL_OS_MZ10_API_RESTORE/scripts/apply_mz10_coordinator_api_restore.mjs

node ./AC_CAPITAL_OS_MZ10_API_RESTORE/scripts/verify_mz10_coordinator_api_restore.mjs

node ./AC_CAPITAL_OS_MZ11/scripts/verify_ac_capital_os_mz11.mjs
```

Then:

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web
npx tsc -p tsconfig.json --noEmit --pretty false
```
