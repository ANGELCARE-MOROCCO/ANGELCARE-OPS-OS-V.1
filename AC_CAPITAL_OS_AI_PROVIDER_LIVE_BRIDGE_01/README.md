# AC CAPITAL OS ↔ AI Provider Control Live Bridge 01

This package corrects the missing integration between the already-installed AC CAPITAL OS and the already-operational AI Provider Sovereign Control Plane.

## Delivered correction

- registers canonical module key `ac_capital_os`;
- makes **AC CAPITAL OS** visible in Provider Control assignment, routing, quota, usage and simulation surfaces;
- activates the validated **Gemini AC CAPITAL OS Production** credential when SQL is applied;
- assigns the dedicated dossier to AC CAPITAL OS as its primary provider;
- registers Gemini 3.6 Flash primary and Gemini 3.5 Flash-Lite fallback model policies;
- publishes module routing, conservative quotas and one manual governed command policy;
- replaces the AC Capital placeholder provider bridge with the central governor and Vault credential resolution;
- upgrades `/api/ac-capital-os/ai-command-center/run` from dry-run-only to controlled Gemini execution;
- seeds the first `AC Capital Intelligence Director` agent, prompt, four skills, nine safety rules, three confidence policies and permission record;
- records provider usage in AI Provider Control and operational run/audit state in AC CAPITAL OS;
- keeps email, submissions and all external actions disabled;
- keeps Founder / Managing Director approval mandatory for financial-sensitive output.

## Apply source files

```bash
cd ~/Desktop/angelcare-platform

cp ~/Downloads/AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01.zip .

unzip -o AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01.zip -d .

node ./AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01/scripts/apply_ac_capital_ai_provider_live_bridge.mjs

node ./AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01/scripts/verify_ac_capital_ai_provider_live_bridge.mjs
```

The installer creates a timestamped backup under `.angelcare_backups/`. It does not execute SQL, build, stage, commit, push or deploy.

## Apply SQL

Use your normal `SUPABASE_DB_URL` session:

```bash
cd ~/Desktop/angelcare-platform

psql "$SUPABASE_DB_URL" \
  -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260728_ac_capital_os_ai_provider_live_bridge.sql
```

Then verify:

```bash
node ./AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01/scripts/verify_ac_capital_ai_provider_live_bridge_db.mjs
```

## TypeScript gate

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web
npx tsc -p tsconfig.json --noEmit --pretty false
```

## Runtime acceptance

1. Restart the Next.js process so the source patch is loaded.
2. Open `/ai-provider-control` → **Affectations modules** and confirm `AC CAPITAL OS` is present and supplied by `Gemini AC CAPITAL OS Production`.
3. Open `/ac-capital-os/ai-command` and confirm the agent, provider bridge, safety rules and confidence policies are populated.
4. Open **Run Governed Test**. Keep risk `Medium`, leave live execution enabled, and submit once.
5. Confirm the response includes provider, model, request ID, usage, confidence, facts, missing data, risks, recommendations and human actions.
6. Confirm AI Provider Control request/usage counters increment and AC Capital run history persists after refresh.

## Emergency stop

Set this server variable to disable new live AC Capital AI calls without removing the assignment:

```text
AC_CAPITAL_AI_ALLOW_LIVE_RUNS=false
```

No API key is stored in source or exposed to the browser.
