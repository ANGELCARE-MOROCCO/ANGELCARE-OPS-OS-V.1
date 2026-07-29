# AC CAPITAL OS MZ15 — TypeScript Runtime Resolution Fix

## Exact failure corrected

The MZ15 verification suite passed its first five gates, then stopped at:

```text
Error: TypeScript runtime not found.
```

This was not an AC CAPITAL OS application TypeScript error. The verifier's helper resolved `typescript` relative to the extracted verification package instead of the monorepo application at:

```text
apps/ops-web/node_modules/typescript
```

## What this patch changes

Only:

```text
AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/_lib.mjs
```

The new resolver searches:

- the current repository and its parent roots;
- `apps/ops-web/package.json`;
- local `node_modules/typescript`;
- `NODE_PATH`;
- NVM global installations;
- Homebrew and standard global Node module locations.

## What it does not change

- no application UI;
- no API route;
- no Supabase migration;
- no SQL;
- no business logic;
- no AC CAPITAL OS production source file;
- no package installation.

## Apply

```bash
cd ~/Desktop/angelcare-platform

cp ~/Downloads/AC_CAPITAL_OS_MZ15_TYPESCRIPT_RUNTIME_RESOLUTION_FIX.zip .

unzip -o AC_CAPITAL_OS_MZ15_TYPESCRIPT_RUNTIME_RESOLUTION_FIX.zip -d .

node ./AC_CAPITAL_OS_MZ15_TS_RUNTIME_FIX_01/scripts/apply_mz15_ts_runtime_fix.mjs

node ./AC_CAPITAL_OS_MZ15_TS_RUNTIME_FIX_01/scripts/verify_mz15_ts_runtime_fix.mjs

node ./AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/verify_ac_capital_os_mz15_final.mjs
```
