# AC CAPITAL OS — Surgical TypeScript Fix
## TS2322: `"Needs Finance Review"` not allowed in `case-builder.ts`

This patch only targets the AC CAPITAL OS TypeScript error reported in:

`lib/ac-capital-os/case-builder.ts(259,33)`

It adds `"Needs Finance Review"` to the allowed case-builder status declaration.

## Touched file

`apps/ops-web/lib/ac-capital-os/case-builder.ts`

No AC CAPITAL OS page, API route, component, migration, or Market OS file is touched.

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_CASE_BUILDER_STATUS_FIX_TS2322.zip -d .

node ./AC_CAPITAL_OS_TS_FIX_01/scripts/apply_ac_capital_os_case_builder_status_fix.mjs

node ./AC_CAPITAL_OS_TS_FIX_01/scripts/verify_ac_capital_os_case_builder_status_fix.mjs
```

## Then run TypeScript

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web

npx tsc -p tsconfig.json --noEmit --pretty false
```

No build. No git stage. No commit. No push.
