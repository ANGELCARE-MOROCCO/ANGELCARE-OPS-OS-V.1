# AngelCare SaaS Factory Command — Phase 3 Mega Execution Layer

This patch is intentionally additive and safe.

It does **not** replace the restored Phase 1 UI pages/components.  
It adds the execution layer underneath them.

## Inject these files

Copy the full ZIP contents into your app root.

Important groups:

- `lib/saas-factory/phase3-runtime.ts`
- `lib/saas-factory/client.ts`
- `hooks/useSaasFactoryLiveOptions.ts`
- `app/api/saas-factory/execute/route.ts`
- `app/api/saas-factory/command/route.ts`
- `app/api/saas-factory/discovery/**`
- `app/api/saas-factory/publish/route.ts`
- `app/api/saas-factory/feature-flags/evaluate/route.ts`
- `database/20260528_saas_factory_command_control_phase3_execution.sql`
- `scripts/verify-saas-factory-phase3-execution-layer.cjs`

## Apply database migration

Run this SQL in Supabase:

```txt
database/20260528_saas_factory_command_control_phase3_execution.sql
```

## Verify

```bash
node scripts/verify-saas-factory-phase3-execution-layer.cjs
npm run build
npx tsc --noEmit --pretty false
npm run dev
```

## Test URLs

```txt
http://localhost:3000/api/saas-factory/execute
http://localhost:3000/api/saas-factory/command?mode=status
http://localhost:3000/api/saas-factory/discovery/routes
http://localhost:3000/api/saas-factory/discovery/apis
```

## Test command from terminal

```bash
curl -X POST http://localhost:3000/api/saas-factory/execute \
  -H "Content-Type: application/json" \
  -d '{"command":"option.upsert","group_key":"cities","label":"Casablanca","modules":["revenue_command_center","market_os","academy","hr","service_os"]}'
```

Then check:

```txt
http://localhost:3000/api/saas-factory/options?group=cities
```

## What Phase 3 adds

- Unified execution command API
- Live option upsert command
- Module control command
- Feature flag upsert command
- Incident creation command
- Action registry command
- API registry command
- Publish audit command
- Route discovery endpoint
- API discovery endpoint
- Feature flag evaluation endpoint
- Live options hook for existing modules
- Safe Supabase REST bridge with dry-run fallback
- Phase 3 migration for API registry, command runs, and queue jobs

## What this does not do yet

It does not automatically rewrite every existing module dropdown.  
That is Phase 4: replacing hardcoded city/department/status lists across Revenue, Market OS, HR, Academy, Service OS, Contracts, and Missions with `useSaasFactoryLiveOptions()`.
