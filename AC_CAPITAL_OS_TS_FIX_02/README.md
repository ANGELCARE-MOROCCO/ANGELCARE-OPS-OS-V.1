# AC CAPITAL OS — Surgical TypeScript Fix V2
## TS2322: `"Needs Finance Review"` not allowed in `case-builder.ts`

This V2 patch is more robust than V1.

It handles:
- single quotes or double quotes;
- status type declarations in `lib/ac-capital-os/types.ts`;
- status type declarations in `lib/ac-capital-os/case-builder.ts`;
- const-array status declarations;
- stale logs where `"Needs Finance Review"` no longer exists.

## Concerned area only

It only scans and may modify:

`apps/ops-web/lib/ac-capital-os/*.ts`

Expected changed file is usually one of:
- `apps/ops-web/lib/ac-capital-os/types.ts`
- `apps/ops-web/lib/ac-capital-os/case-builder.ts`

It does not touch:
- Market OS;
- app pages;
- API routes;
- components;
- migrations.

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_CASE_BUILDER_STATUS_FIX_TS2322_V2.zip -d .

node ./AC_CAPITAL_OS_TS_FIX_02/scripts/apply_ac_capital_os_case_builder_status_fix_v2.mjs

node ./AC_CAPITAL_OS_TS_FIX_02/scripts/verify_ac_capital_os_case_builder_status_fix_v2.mjs
```

## Then run TypeScript

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web

npx tsc -p tsconfig.json --noEmit --pretty false
```

No build. No git stage. No commit. No push.
