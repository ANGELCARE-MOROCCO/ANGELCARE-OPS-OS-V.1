# AC CAPITAL OS - Mega Ultra ZIP 03: Capital Radar

This package installs the signed AC CAPITAL OS MZ3 Capital Radar workspace into:

`apps/ops-web/app/(protected)/ac-capital-os`

It preserves MZ1 foundation and MZ2 Capital Executive Cockpit while adding:

- Capital Radar visual workspace
- premium global funding intelligence radar UI
- source confidence
- deadline heat
- research adapter monitor
- Morocco / Africa-MENA / International opportunity stream
- handoff panel for MZ4 Qualification Engine
- API: `/api/ac-capital-os/capital-radar`
- Supabase migration for radar foundation tables
- installer and verifier scripts

Run from repository root:

```bash
node ./AC_CAPITAL_OS_MZ3/scripts/apply_ac_capital_os_mz3.mjs
node ./AC_CAPITAL_OS_MZ3/scripts/verify_ac_capital_os_mz3.mjs
```

Then from `apps/ops-web` run your normal TypeScript static check.

No build. No git stage. No commit. No push.
