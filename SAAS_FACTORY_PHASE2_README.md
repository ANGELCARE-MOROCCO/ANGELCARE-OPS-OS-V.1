# AngelCare SaaS Factory Command — Phase 2 Mega Patch

This patch contains only the concerned files to add/replace for the SaaS Factory Command Phase 2 module.

## Dev routes

Main route:

```txt
http://localhost:3000/saas-factory-command
```

Important Phase 2 test routes:

```txt
http://localhost:3000/saas-factory-command/options
http://localhost:3000/saas-factory-command/modules
http://localhost:3000/saas-factory-command/feature-flags
http://localhost:3000/saas-factory-command/incidents
http://localhost:3000/saas-factory-command/apis
http://localhost:3000/saas-factory-command/actions
http://localhost:3000/saas-factory-command/audit
```

## API tests

```txt
http://localhost:3000/api/saas-factory/overview
http://localhost:3000/api/saas-factory/options?group=cities
http://localhost:3000/api/saas-factory/modules
http://localhost:3000/api/saas-factory/feature-flags
http://localhost:3000/api/saas-factory/incidents
```

## Required Supabase migration

Apply:

```txt
database/20260528_saas_factory_command_control_phase2.sql
```

Then open the SaaS Factory page and click **Seed factory catalog** once.

## Verification

Run from app root:

```bash
node scripts/verify-saas-factory-phase2.mjs
npm run build
npx tsc --noEmit --pretty false
```

## Phase 2 scope

Included:

- 18 protected SaaS Factory routes
- Dark enterprise command UI
- Live Options Registry create/publish flow
- Module Registry status controls
- Feature Flag controls
- Incident Command create flow
- API Command Center data
- Action Matrix registry data
- Supabase-ready schema and seed data
- Audit event foundation
- Permission navigation entries

Not yet included in this patch:

- App-wide replacement of every existing hardcoded dropdown
- Deep enforcement of module visibility across every sidebar/page
- Full automated route scanner and button scanner
- Full realtime browser subscription layer

Those belong to Phase 3.
