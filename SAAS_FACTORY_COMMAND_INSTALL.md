# AngelCare SaaS Factory Command Install Notes

This patch adds the full SaaS Factory Command module at:

- `/saas-factory-command`
- `/saas-factory-command/observatory`
- `/saas-factory-command/modules`
- `/saas-factory-command/configuration`
- `/saas-factory-command/options`
- `/saas-factory-command/actions`
- `/saas-factory-command/apis`
- `/saas-factory-command/supabase`
- `/saas-factory-command/realtime`
- `/saas-factory-command/incidents`
- `/saas-factory-command/permissions`
- `/saas-factory-command/feature-flags`
- `/saas-factory-command/rules`
- `/saas-factory-command/data-sources`
- `/saas-factory-command/queues`
- `/saas-factory-command/tenants`
- `/saas-factory-command/deployment`
- `/saas-factory-command/audit`

## Added layers

- Enterprise UI matching the provided dark SaaS Factory screenshots.
- Shared SaaS Factory sidebar and command topbar.
- Real Next.js pages for all supplied modules.
- Real API endpoints under `/api/saas-factory/*`.
- Server-side project scanner for current app pages, API routes, components, and migrations.
- Supabase-ready SQL migration for modules, options, bindings, actions, APIs, flags, rules, queues, tenants, data sources, incidents, and audit events.
- Permission navigation entry in `lib/auth/permissions.ts`.

## Apply

Copy the files in this ZIP into the root of your app, preserving folders.

Then run:

```bash
npm run build
npx tsc --noEmit --pretty false
```

Then apply the migration in Supabase:

```sql
-- database/20260528_saas_factory_command_control.sql
```

## Important

The module is intentionally added as a new production control layer without rewriting existing HR, Email OS, Revenue, Academy, Market OS, Connect, or Service OS logic. Existing modules can then progressively switch hardcoded dropdowns to the SaaS Factory options registry.
