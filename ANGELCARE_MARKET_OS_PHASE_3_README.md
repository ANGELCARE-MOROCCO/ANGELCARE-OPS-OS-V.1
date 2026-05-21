# AngelCare Market-OS — Phase 3: SEO and Content Command production state

    Adds SEO articles, keyword, topic cluster, internal link tables and a generic production-state API to replace localStorage runtime buckets for content taxonomy, modal runtime state, checklists, SEO article state and action logs.

Smoke test: `/api/market-os/production-state?table=market_os_content_runtime_state`.

    ## Non-downgrade guarantee
    This phase adds production backend, routes, guards, migrations, or sync contracts around the existing UI. It does not intentionally remove premium UI sections, pages, visual hierarchy, navigation, or existing components.

    ## Install / apply
    1. Copy this zip over your current app root.
    2. Run the SQL migration files added in `supabase/migrations` in order.
    3. Run `npm install` only if your package changed.
    4. Run `npm run build`.
    5. Smoke test the routes listed in this README.
