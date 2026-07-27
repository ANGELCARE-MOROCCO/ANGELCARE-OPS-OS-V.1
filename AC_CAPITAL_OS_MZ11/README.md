# AC CAPITAL OS — Mega Ultra ZIP 11
## AI Command Center + Skills + Troubleshooting Control Plane

This package installs the MZ11 workspace for AC CAPITAL OS.

## Canonical protected route

`apps/ops-web/app/(protected)/ac-capital-os/page.tsx`

## New workspace route

`apps/ops-web/app/(protected)/ac-capital-os/ai-command/page.tsx`

## New API

`apps/ops-web/app/api/ac-capital-os/ai-command-center/route.ts`

## New migration

`supabase/migrations/20260727_ac_capital_os_mz11_ai_command_center.sql`

## AI Provider Control bridge

MZ11 is designed to work with the existing AI Provider Control module:

- `/ai-provider-control`
- `/api/ai-provider-control/snapshot`
- `/api/ai-provider-control/action`

AC CAPITAL OS may use:

1. the same AI supplier governed by AI Provider Control;
2. a dedicated AC CAPITAL OS Gemini API dossier;
3. a hybrid/failover/manual model.

The module keys prepared conceptually include:

- `ac_capital_os`
- `ac_capital_os_radar`
- `ac_capital_os_qualification`
- `ac_capital_os_case_builder`
- `ac_capital_os_coordinator`
- `ac_capital_os_learning`

No keys are stored or exposed by AC CAPITAL OS. Secrets remain governed by AI Provider Control credentials.

## What MZ11 delivers

- AI Command Center
- Agent Registry
- AI Run History
- Prompt Control Library
- Skills Control Library
- Research Adapter monitor
- Provider Configuration panel
- Safety Rules wall
- Troubleshooting Center
- AI Confidence Policy
- AI Audit Log
- Cost Usage Monitor
- Permission Matrix
- Human Approval Queue
- API contract
- Supabase migration foundation

## Truth boundary

This ZIP delivers the AI governance control plane, seeded API contract, provider-control bridge model, safety/troubleshooting model, prompt/skill/agent management interface and future integration structure.

It does **not** expose API keys, run live Gemini/OpenAI calls, crawl the web, send emails, submit applications, activate doctrine automatically or run autonomous AI production actions.

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MEGA_ULTRA_ZIP_11_AI_COMMAND_CENTER.zip -d .

node ./AC_CAPITAL_OS_MZ11/scripts/apply_ac_capital_os_mz11.mjs

node ./AC_CAPITAL_OS_MZ11/scripts/verify_ac_capital_os_mz11.mjs
```

## Verify TypeScript

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web

npx tsc -p tsconfig.json --noEmit --pretty false
```

No build. No git stage. No commit. No push.
