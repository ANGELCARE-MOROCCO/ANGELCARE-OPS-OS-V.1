# AC CAPITAL OS · Mega Ultra ZIP 04 · Qualification Engine

This package installs the signed and approved Mega ZIP 04 contract for AC CAPITAL OS.

## What it adds

- Premium Qualification Engine workspace.
- Investment-committee-style opportunity scoring dossiers.
- Fit Score, Eligibility Fit, Women Cofounder Fit, SaaS Fit, Childcare Impact Fit, Deadline Feasibility and Documentation Readiness.
- Risk and Objections panel.
- Missing documents and readiness panel.
- Recommended next action panel.
- Qualification board.
- Safe API contract at `/api/ac-capital-os/qualification-engine`.
- Supabase migration for qualification tables.
- Preservation of MZ1 Foundation, MZ2 Executive Cockpit and MZ3 Capital Radar.

## Apply

Run from repo root:

```bash
node ./AC_CAPITAL_OS_MZ4/scripts/apply_ac_capital_os_mz4.mjs
node ./AC_CAPITAL_OS_MZ4/scripts/verify_ac_capital_os_mz4.mjs
```

Then run your normal static check from `apps/ops-web`:

```bash
npx tsc -p tsconfig.json --noEmit --pretty false
```

No build, no git stage, no commit, no push.
