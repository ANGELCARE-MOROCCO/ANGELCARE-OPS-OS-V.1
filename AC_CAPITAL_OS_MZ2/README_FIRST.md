# AC CAPITAL OS — Mega Ultra ZIP 02
## Capital Executive Cockpit V2

This package installs the second signed AC CAPITAL OS build contract.

Target route:

```bash
apps/ops-web/app/(protected)/ac-capital-os/page.tsx
```

It upgrades the root AC CAPITAL OS page from the foundation view into the **Capital Executive Cockpit V2**: a premium finance/capital command room with readiness score, command metrics, today's coordinator plan, AI-prepared actions, high-fit opportunities, deadline heat, document blockers, pipeline snapshot and funding-route split.

## Install from repository root

```bash
cd ~/Desktop/angelcare-platform
unzip -o AC_CAPITAL_OS_MEGA_ULTRA_ZIP_02_CAPITAL_EXECUTIVE_COCKPIT.zip -d .
node ./AC_CAPITAL_OS_MZ2/scripts/apply_ac_capital_os_mz2.mjs
node ./AC_CAPITAL_OS_MZ2/scripts/verify_ac_capital_os_mz2.mjs
```

Then run your normal TypeScript static check from `apps/ops-web`.

No build, no git stage, no commit, no push.
