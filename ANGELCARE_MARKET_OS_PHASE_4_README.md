# AngelCare Market-OS — Phase 4: Ambassador operating system production layer

    Adds unified ambassador operations tables and API for profiles, missions, leads, proofs, payouts, training and compliance. This creates the server-side foundation needed to replace fragmented localStorage ambassador pages while preserving the existing premium ambassador UI.

Smoke test: `/api/market-os/ambassadors/operations`.

    ## Non-downgrade guarantee
    This phase adds production backend, routes, guards, migrations, or sync contracts around the existing UI. It does not intentionally remove premium UI sections, pages, visual hierarchy, navigation, or existing components.

    ## Install / apply
    1. Copy this zip over your current app root.
    2. Run the SQL migration files added in `supabase/migrations` in order.
    3. Run `npm install` only if your package changed.
    4. Run `npm run build`.
    5. Smoke test the routes listed in this README.
