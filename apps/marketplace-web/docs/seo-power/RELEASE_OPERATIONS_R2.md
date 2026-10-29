# AngelCare SEO POWER Operations R2

Baseline: upgrade/next-angelcare-upgrade at 4f2f489945398d1472432d7c9ae1cbc96dd8b6ae.

## What changes

Seven primary sections: Pilotage, Priorités, Pages, Corrections, Exécutions, Automatisation, Historique. Existing publication, editorial landing pages, metadata, structured data, internal links, IndexNow, CI results, exports, policies and revision controls remain available through the contextual native tools and the expandable full toolbox.

Pilotage uses complete database counts, not the latest visible jobs. Each universe distinguishes enabled configuration, manual/planned operation, waiting, due, running, expired leases, unresolved failures, incomplete continuations, public verification mismatches, daily budget use, oldest waiting job, next due time, last observation and last attributable worker execution. Reading freshness is separate from page-observation freshness. Disabled, unobserved and blocked operation never appears as a confirmed working engine.

The workspace refreshes every 15 seconds while visible, preserves the last confirmed snapshot on HTTP/JSON failure and marks it stale. Queue filters have complete scoped pagination at 40 jobs per page. Text search is explicitly limited to the currently displayed queue page. Recent execution receipts show the last 30 passages; the existing native history retains its original receipt and CI windows. This release does not claim unlimited execution-history pagination.

A guided start selects one world and either initializes the native inventory for manual page selection, or initializes and queues the native fronts for discovery. Manual followed processing chains at most 20 bounded batches (two jobs each), stops on any reported problem, supports stop-after-current-batch, and retains pending tasks in PostgreSQL. The browser must remain open for this manual loop. Existing pg_cron automation continues independently when already correctly configured. No new worker, service, container or dependency is added.

Every run has a persistent execution start/finish receipt. Scheduler HTTP dispatch is shown separately from worker completion. A successful crawl followed by failed discovery, automatic canonical correction or continuation is recorded as an incomplete follow-up, rather than silently reported as a fully successful pipeline. Verification mismatch counts as an operational problem even when the inspection itself executed successfully. Observed robots denials include the URL, user agent, robots URL and a bounded directives excerpt; no private-route, robots or SSRF protection is bypassed.

Failure classes distinguish transport retry (maximum three attempts with existing delays), configuration, policy, stale-source/rescan, native source changes and unknown errors requiring inspection. Explicit operator retries use native permissions and idempotent transactional receipts. Earlier failures stop contributing to active attention counts after a later same-kind task succeeds; failed public verification is resolved only by a successful verification. Original evidence remains in the job history.

## Apply and release

1. Apply the guarded Python installer to the repository root. It only writes the manifest-listed SEO files and this document, with verified backups and rollback journal.
2. BEFORE deployment, run the complete `angelcare-marketplace/seo-power/INSTALL_SEO_POWER_OPERATIONS_R2.sql` in the existing Marketplace Supabase SQL Editor. The existing R1 migration must already be present. The installer copies this new SQL to the clipboard on macOS.
3. The SQL migration is repeatable and refuses to replace an unreviewed installed `ac_seo_power_finish` implementation. If it raises `SEO_POWER_FINISH_VERSION_REVIEW_REQUIRED`, the transaction changes nothing: retain the error and inspect the actual installed function before adapting the migration. Do not bypass this guard.
4. Use the existing Marketplace GHCR One-Off / exact source SHA / Coolify release procedure. No full local application build is required by the installer.
5. Open SEO POWER. A new R2 migration is explicitly identified when its operations RPC is missing. Confirm project origins and permissions. The migration does NOT enable cron, alter endpoints, rotate secrets, change budgets or modify publications.
6. Inspect Automation: cron/net/Vault, configured endpoint, dispatch time and response when retained by pg_net. Inspect Executions to confirm a completed authenticated scheduler run; dispatch alone is not proof.
7. For each world, start with a bounded manual run and a published public page. Check the observation, corrective proposal, authorized native publication, public verification result and receipt. Preserve private paths and legitimate robots rules.

## Important limits

This is an operational management and reliability overhaul of the existing native SEO engine. The only pre-existing automatic correction rule remains explicitly enabled missing-canonical repair on supported public native pages. Metadata, schema, body and link changes still require applicable adapters and publication authority; source-code changes still require deployment. Crawling and IndexNow do not establish ranking, indexing, traffic or revenue growth. Google Search Console and paid providers are not introduced. No live production data, credentials or services were accessed during fixture verification, and no live scheduler state is asserted by this package.

The dependency versions, routing, robots rules, public page bodies, brand artwork, DCE and JOBKIX workflows are outside this patch. The installer does not execute SQL, install packages, commit, push, build or deploy.

## Rollback

Use the exact rollback command printed by the installer. Later edits are protected. Additive database objects are retained; they are harmless to the previous source. The modified finish function accepts older worker errors without the new recovery field using the old bounded retry default. Do not drop tables containing operational evidence merely to roll back the UI.
