# AC CAPITAL OS — Free Provider Operations Control Plane 05

This package replaces AC Capital's live research path with:

- Tavily: public web evidence retrieval
- OpenRouter `openrouter/free`: structured external-evidence analysis
- AC Capital database: sources, opportunities, rejections, internal draft actions, usage, incidents and audit
- Gemini: disabled for AC Capital by the additive migration
- SearXNG/Docker: not included

## Delivered route

`/ac-capital-os/ai-control`

The route is a writable runtime control plane for providers, encrypted keys, internal quotas, agents, frequencies, schedules, prompts, permissions, intensity profiles, manual execution, scheduler ticks, usage and activity evidence.

## Installation

From the AngelCare repository root:

```bash
node ./AC_CAPITAL_OS_FREE_PROVIDER_OPERATIONS_05/scripts/apply_ac_capital_free_provider_operations_05.mjs
```

The installer only copies files and creates backups. It does not run TypeScript, a build, SQL, Git or provider requests.

Optional static contract verification, run separately:

```bash
node ./AC_CAPITAL_OS_FREE_PROVIDER_OPERATIONS_05/scripts/verify_ac_capital_free_provider_operations_05.mjs
```

Apply the database migration separately:

```bash
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 \
  -f ./supabase/migrations/20260728_ac_capital_os_free_provider_operations_05.sql
```

Restart the development server separately, then open:

`http://localhost:3000/ac-capital-os/ai-control`

Store and test the Tavily key and OpenRouter key from the Providers tab. Secret values are encrypted by the existing AI Provider Control credential vault and are never returned to the browser.

## Scheduler truth

The control page has a local watchdog while the page is open and a protected scheduler tick endpoint:

`POST /api/ac-capital-os/ai-control/scheduler/tick`

For unattended production execution, invoke that endpoint from the deployment scheduler under an authenticated internal session/service mechanism. The patch does not pretend that an external scheduler was deployed.

## Internal actions

Per-agent switches control:

- source capture
- opportunity creation
- rejection and duplicate handling
- draft qualification dossiers
- draft fundraising cases
- source-review pipeline records
- internal coordinator tasks
- report drafting through the executive report agent

All generated downstream records remain drafts or review-stage records. External outreach, submissions, communication and public release stay locked.
