# AngelCare Market-OS — Phase 2: Campaign Lifecycle production backend

    Adds full campaign lifecycle database tables, API route, client bridge, audit logging, and redirects the duplicated nested campaign root routes back to the canonical `/market-os/campaign-lifecycle` path.

Smoke test: `/api/market-os/campaign-lifecycle`.

    ## Non-downgrade guarantee
    This phase adds production backend, routes, guards, migrations, or sync contracts around the existing UI. It does not intentionally remove premium UI sections, pages, visual hierarchy, navigation, or existing components.

    ## Install / apply
    1. Copy this zip over your current app root.
    2. Run the SQL migration files added in `supabase/migrations` in order.
    3. Run `npm install` only if your package changed.
    4. Run `npm run build`.
    5. Smoke test the routes listed in this README.
