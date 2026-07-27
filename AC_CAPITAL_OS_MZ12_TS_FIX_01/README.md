# AC CAPITAL OS — MZ12 Badge Children TypeScript Fix

This patch fixes the TypeScript error:

`app/(protected)/ac-capital-os/page.tsx(475,16): error TS2322`

The issue is a Badge component typed with:

`children: string`

but one JSX usage passed mixed children:

`{test.impact} impact`

React interprets that as multiple children. The patch converts it to a single string:

```tsx
{`${test.impact} impact`}
```

## Touched file

`apps/ops-web/app/(protected)/ac-capital-os/page.tsx`

## Not touched

- APIs
- SQL/migrations
- Market OS
- AI Provider Control
- Supabase
- package.json

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MZ12_BADGE_CHILDREN_TS2322_FIX.zip -d .

node ./AC_CAPITAL_OS_MZ12_TS_FIX_01/scripts/apply_ac_capital_os_mz12_badge_children_fix.mjs

node ./AC_CAPITAL_OS_MZ12_TS_FIX_01/scripts/verify_ac_capital_os_mz12_badge_children_fix.mjs
```

## Then TypeScript

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web

npx tsc -p tsconfig.json --noEmit --pretty false
```
