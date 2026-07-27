# AC CAPITAL OS — Mega Ultra ZIP 13
## Full Production Wiring, Supabase Persistence, AI Provider Activation, Storage, Automation Gates, Reports & QA

This package installs the MZ13 production activation layer.

## What it delivers

- Live/fallback Supabase repository layer
- Upgraded AC Capital API routes
- Safe write pattern
- AI Provider Control bridge
- Dry-run AI runner
- Research adapter contract
- Data Room storage contract
- Report generation foundation
- Manual email/workflow gates
- Founder approval guard
- Audit helper
- Permission helper
- Production QA scripts
- Production Activation report
- MZ13 SQL migration

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MEGA_ULTRA_ZIP_13_FULL_PRODUCTION_WIRING.zip -d .

node ./AC_CAPITAL_OS_MZ13/scripts/apply_ac_capital_os_mz13.mjs

node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_mz13.mjs
```

## SQL

MZ13 does not run SQL automatically.

Apply manually:

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260727_ac_capital_os_mz13_production_wiring.sql
```

## QA

```bash
node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_db_tables.mjs
node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_api_contracts.mjs
node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_storage_contract.mjs
node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_ai_provider_bridge.mjs
node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_no_secret_leak.mjs
node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_production_readiness.mjs
```

## TypeScript

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web
npx tsc -p tsconfig.json --noEmit --pretty false
```

## Truth boundary

No automatic investor submission. No automatic sensitive email. No exposed API keys. No direct browser secrets. No uncontrolled AI calls. No fake production claim.
