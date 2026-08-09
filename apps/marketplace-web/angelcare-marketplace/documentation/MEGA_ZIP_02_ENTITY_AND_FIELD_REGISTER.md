# ANGELCARE BUILD 360 — Mega ZIP 02

**Contract:** Territory OS Core & Global Expansion Layer  
**Build root:** `apps/ops-web/angelcare-marketplace`  
**Cumulative baseline:** Mega ZIP 01  
**Execution boundary:** No build, Git action, deployment or database migration is performed by the delivery package.

## Persistent entities

- `angelcare_marketplace_territories`
- `angelcare_marketplace_territory_templates`
- `angelcare_marketplace_territory_template_items`
- `angelcare_marketplace_territory_settings`
- `angelcare_marketplace_territory_city_zones`
- `angelcare_marketplace_territory_support_contacts`
- `angelcare_marketplace_territory_assignments`
- `angelcare_marketplace_territory_overrides`
- `angelcare_marketplace_territory_override_reviews`
- `angelcare_marketplace_territory_launch_checks`
- `angelcare_marketplace_territory_launch_approvals`
- `angelcare_marketplace_territory_health_events`
- `angelcare_marketplace_territory_clone_operations`

Strategic records include ID, status, owner/scope, timestamps, version and relations. Territories additionally carry country, locale set, timezone, currency label, source territory/template, readiness, health and launch timestamps.
