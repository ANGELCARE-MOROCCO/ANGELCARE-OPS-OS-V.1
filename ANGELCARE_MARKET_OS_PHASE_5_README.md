# AngelCare Market-OS — Phase 5: Final production hardening and operating blueprint

    Adds smoke tests, production documentation, route sync matrix, and the operational launch contract for making Market-OS truly live across computers and team members.

Run: `node scripts/market-os-production-smoke-test.mjs`.

    ## Non-downgrade guarantee
    This phase adds production backend, routes, guards, migrations, or sync contracts around the existing UI. It does not intentionally remove premium UI sections, pages, visual hierarchy, navigation, or existing components.

    ## Install / apply
    1. Copy this zip over your current app root.
    2. Run the SQL migration files added in `supabase/migrations` in order.
    3. Run `npm install` only if your package changed.
    4. Run `npm run build`.
    5. Smoke test the routes listed in this README.
