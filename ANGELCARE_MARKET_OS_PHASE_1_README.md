# AngelCare Market-OS — Phase 1: Core production spine

    Adds the missing `/api/market-os/core` route, core Supabase migration, audit log, KPI table, agents table, notification table, and upgrades the main Market-OS store from business localStorage to server sync with offline cache only as fallback.

Smoke test: open `/api/market-os/core` after running migration. It should return `{ ok: true, live: true }`.

    ## Non-downgrade guarantee
    This phase adds production backend, routes, guards, migrations, or sync contracts around the existing UI. It does not intentionally remove premium UI sections, pages, visual hierarchy, navigation, or existing components.

    ## Install / apply
    1. Copy this zip over your current app root.
    2. Run the SQL migration files added in `supabase/migrations` in order.
    3. Run `npm install` only if your package changed.
    4. Run `npm run build`.
    5. Smoke test the routes listed in this README.
