# AC CAPITAL OS MZ13 — Nested API Import Path Fix

This fixes the TypeScript errors from the final non-targeted batch gate:

- `capital-radar/research/run/route.ts` could not find `research-adapter`
- coordinator cockpit nested email/workflow routes could not find `automation-gates`

These API routes are nested one folder deeper than the earlier MZ13 import template expected. The imports were one `../` short.

## Touched files

- `apps/ops-web/app/api/ac-capital-os/capital-radar/research/run/route.ts`
- `apps/ops-web/app/api/ac-capital-os/coordinator-cockpit/email/mark-sent/route.ts`
- `apps/ops-web/app/api/ac-capital-os/coordinator-cockpit/email/prepare/route.ts`
- `apps/ops-web/app/api/ac-capital-os/coordinator-cockpit/workflow/complete-task/route.ts`

## Not touched

- SQL
- Supabase
- UI pages
- Market OS
- AI Provider Control
- AC Capital server library files

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MZ13_NESTED_API_IMPORT_PATH_FIX.zip -d .

node ./AC_CAPITAL_OS_MZ13_IMPORT_PATH_FIX_01/scripts/apply_mz13_nested_api_import_path_fix.mjs

node ./AC_CAPITAL_OS_MZ13_IMPORT_PATH_FIX_01/scripts/verify_mz13_nested_api_import_path_fix.mjs
```

Then TypeScript:

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web

npx tsc -p tsconfig.json --noEmit --pretty false
```
