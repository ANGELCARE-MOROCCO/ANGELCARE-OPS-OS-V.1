# ANGELCARE BUILD 360 — Mega ZIP 02

**Contract:** Territory OS Core & Global Expansion Layer  
**Build root:** `apps/ops-web/angelcare-marketplace`  
**Cumulative baseline:** Mega ZIP 01  
**Execution boundary:** No build, Git action, deployment or database migration is performed by the delivery package.

## Backoffice routes

| Route | Purpose | Permission |
|---|---|---|
| `/angelcare-marketplace/admin/territories` | Executive Territory Command | `marketplace.territories.view` |
| `/territories/registry` | Searchable portfolio registry | `marketplace.territories.view` |
| `/territories/new` | Create territory wizard | `marketplace.territories.create` |
| `/territories/clone` | Clone territory wizard | `marketplace.territories.clone` |
| `/territories/[territoryCode]` | Territory 360 dossier | `marketplace.territories.view` |
| `/settings` | Effective settings and inheritance | `marketplace.territory_settings.view` |
| `/overrides` | Override request/review/rollback | `marketplace.territory_overrides.view` |
| `/readiness` | Launch-gate command board | `marketplace.territory_readiness.view` |
| `/health` | Territory health event timeline | `marketplace.territory_health.view` |
| `/preview` | Governed territory-context preview | `marketplace.territories.preview` |

All routes are mounted under the existing protected Marketplace admin shell.
