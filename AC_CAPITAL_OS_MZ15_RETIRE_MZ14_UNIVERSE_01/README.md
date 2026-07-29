# AC CAPITAL OS MZ15 — Retire Obsolete MZ14 Universe

## Why the verifier stopped

The following MZ15 gates already passed:

- all 18 protected routes;
- dedicated page architecture;
- no generic-universe route regression;
- real API bindings;
- action handler parity;
- schema/payload compatibility;
- modal async states;
- specialized drawers.

The no-dead-buttons verifier then scanned this old, inactive MZ14 file:

```text
apps/ops-web/components/ac-capital-os/universe/CapitalUniverseClient.tsx
```

The reported dead buttons are inside the obsolete MZ14 generic command-palette facade, not the active MZ15 page-by-page implementation.

## Correct engineering action

This patch does **not** weaken or exclude the verifier.

It:

1. confirms no active source imports the MZ14 universe;
2. backs up the complete obsolete folder;
3. removes the retired folder from active source;
4. verifies all 18 dedicated MZ15 routes remain present;
5. verifies no `CapitalUniverseClient` reference remains.

## Apply

```bash
cd ~/Desktop/angelcare-platform

cp ~/Downloads/AC_CAPITAL_OS_MZ15_RETIRE_OBSOLETE_MZ14_UNIVERSE_FIX.zip .

unzip -o AC_CAPITAL_OS_MZ15_RETIRE_OBSOLETE_MZ14_UNIVERSE_FIX.zip -d .

node ./AC_CAPITAL_OS_MZ15_RETIRE_MZ14_UNIVERSE_01/scripts/apply_retire_mz14_universe.mjs

node ./AC_CAPITAL_OS_MZ15_RETIRE_MZ14_UNIVERSE_01/scripts/verify_retired_mz14_universe.mjs

node ./AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/verify_ac_capital_os_mz15_final.mjs
```
