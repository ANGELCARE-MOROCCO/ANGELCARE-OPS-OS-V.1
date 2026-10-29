# SEO POWER — Native Growth R3

Baseline: `4f2f489945398d1472432d7c9ae1cbc96dd8b6ae`, branch `upgrade/next-angelcare-upgrade`.

This package includes the Operations R2 source and adds an inventory-backed growth execution layer. It can be applied to the reviewed R1 source or the previously delivered R2 source; it supersedes R2. Do not apply the older R2 installer over R3.

## Concrete actions

- Synchronize published KidFlix catalogue editions, AngelCare public catalogue offers and JOBKIX eligible public vacancies through their existing native services. No draft records or invented listings are used. JOBKIX growth collections use the vacancy’s original authored language; AngelCare EN/AR require authored localized name and description fields rather than a French fallback. The language scan total can therefore exceed the eligible stored sources. Exclusions are recorded in the last-batch evidence. Inventory is partitioned by world and page language; counters represent item/language entries, not unique products or people.
- Resume inventory pages and language cycles persistently. A source is marked absent only after its language cycle completes. Native pagination can shift while content is being published; scans provide eventual synchronization, not a database-wide frozen snapshot.
- Group actual category/topic inventory into candidate collections. Samples are at most twelve sources, with a full native group count. Minimum sources, minimum source words, description completeness and overlapping selections are checked. No search volumes or external demand are fabricated: catalogue-derived opportunities are hypotheses.
- One admin action can synchronize and prepare the selected world's language cycles. Browser processing is bounded to 100 inventory batches and 200 total batches; a stopped or capped run retains cursors. The existing scheduled worker continues independently when configured.
- Preview the source-backed collection and publish through native register → propose → approve → publish → verification contracts. No invented commercial claims, reviews, salaries or availability are generated. Published selection data is separate from new candidate data.
- Resolve the current native availability when serving managed collections. Changed KidFlix editions are temporarily omitted until synchronized and explicitly or automatically republished. Withdrawn/closed sources are not kept alive by an old SEO snapshot. Insufficient collections receive noindex; sitemap eligibility also requires sufficient active sources and a completed recent language scan.
- Published collection pages contain source descriptions, contextual links, a comparison table and ItemList structured data, alongside the existing page structured-data adapter. They use the existing discover routes and world shells.
- Prepare safe missing-title, missing-description and missing-canonical corrections from observed native facts. Contextual link suggestions use shared title terms, same-world and same-language pages with verified HTTP/indexability. Existing page bodies remain under native Studio ownership.
- Optional automatic metadata publication only fills missing fields, requires fresh observations and respects native source/revision checks. It does not invent new page bodies or override existing descriptions. Repeated publication of the same pending correction is deferred until verification.
- Enable automatic collection publication and automatic metadata correction independently, with explicit publication rights, quality checks and shared daily publication-reservation limits. Defaults are OFF. Growth leases prevent overlapping scheduled passes; daily budget failures defer automatic publication until the next UTC day. Raising the policy limit clears this deferral. Failed publication attempts may consume a reservation; the limit is explicitly reservations, not guaranteed successful pages.
- Suspending updates keeps an existing publication active. The explicit restoration action uses native rollback permission and revision protection, then parks the managed selection. Native history is retained. The action can restore an earlier revision rather than always removing the URL.

## Monitoring and measurement

The primary workspace retains Operations R2 status, queues, worker receipts, recovery and full tools, and adds Growth with Opportunities, Results, Control & cadence, and Live activity. Reads refresh every 15 seconds while visible. Source scan cursors, language coverage, last completed scans, policy, limits, leases, scheduler dependency, candidate blockers and public verification are distinct.

Signed first-party browser events are aggregated by day/page/event/channel. Collection is OFF until enabled and requires the existing `MARKETPLACE_DCE_ANALYTICS_SECRET` (at least 32 characters). No new secret or infrastructure service is required. No raw IP, query string, referrer URL, account identity, cookie identifier or fingerprint is stored. A keyed one-minute network/path/event/channel bucket limits duplicate observations. This means counts are observations, not certified unique visitors or exact human counts. Known crawler user agents are skipped. DNT/GPC are respected. Referrer-derived search attribution is declared browser evidence, not search-engine reporting.

Browser measurement covers public pages that render the native `SeoEnhancements` component, including managed collections. It is NOT a claim of universal instrumentation on every legacy/custom route. A successfully prepared Documents download HTTP response is measured server-side when enabled; this does not prove that the browser finished receiving the file. Other download families are not counted as confirmed downloads by this hook.

Native aggregate JOBKIX application and Marketplace inquiry totals are read from the existing authorities where their tables/columns exist. They are explicitly all-source totals. Organic attribution of those outcomes remains UNKNOWN, rather than dividing unrelated totals by SEO visits. Traffic, indexing, rankings, revenue and conversion improvements are not inferred from successful technical work.

## Apply and release

1. Download the self-contained `apply-angelcare-seo-growth-r3.py` to Downloads. Run it against the repository root. It verifies the embedded archive, exact source variants and native dependencies, then backs up and applies only its listed files.
2. BEFORE deployment, run the complete `angelcare-marketplace/seo-power/INSTALL_SEO_GROWTH_R3_COMPLETE.sql` in the existing Marketplace Supabase SQL Editor. It atomically includes Operations R2 + Growth R3; existing R1 is required. The installer copies the complete SQL to the macOS clipboard. Run the whole file, not selected fragments.
3. The SQL refuses to overwrite an unreviewed installed R1/R2 finish function. If it reports `SEO_POWER_FINISH_VERSION_REVIEW_REQUIRED`, stop and inspect the actual installed function; do not bypass the guard.
4. Push/build/deploy using the existing Marketplace GHCR One-Off and Coolify procedure. The installer does not execute SQL, install packages, commit, push, build or deploy.
5. In SEO POWER → Growth, select a world, run Synchronize and prepare, inspect candidates, preview and publish a suitable selection. Check native Corrections/Executions for public verification.
6. In Control & cadence, optionally enable measurement and the desired automatic rules. Authorization of Growth alone does not start the main scheduler: confirm pg_cron/pg_net/Vault, endpoint and completed authenticated executions in the existing Automation/Executions sections. The migration does not activate cron or rotate credentials.
7. Confirm real observations and supported native outcomes after deployment. The supplied verification uses isolated database and browser fixtures, not your live Supabase or production sessions.

No local full application build, live production SQL or deployment was performed during preparation. Headers, footers, brand assets, recruitment decisions, private routes and existing review/security authorities are preserved.

## Rollback

Use the exact command printed by the installer. Later source edits are protected. The additive database objects and operational evidence are retained. R2's finish function accepts older worker errors without the new recovery field using the older bounded-retry default. Restoration of source is separate from reverting SEO publications; use the native publication rollback controls for those.
