# AC CAPITAL OS MZ7 — Fundraising Case Builder

Run from repository root:

```bash
node ./AC_CAPITAL_OS_MZ7/scripts/apply_ac_capital_os_mz7.mjs
node ./AC_CAPITAL_OS_MZ7/scripts/verify_ac_capital_os_mz7.mjs
```

Then run your normal static TypeScript check from `apps/ops-web`:

```bash
npx tsc -p tsconfig.json --noEmit --pretty false
```

No build. No git stage. No commit. No push.
