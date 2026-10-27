# AngelCare SEO POWER R1

Implementation baseline: `bccbc9f34ab72df5be6941a69c5c02b90200447f`, branch `upgrade/next-angelcare-upgrade`, 27 October 2026. The later head `162e9efc58e9039e6c078e4463970293a32de9a0` changes only five unrelated authentication/coordinator files; these are retained in the development branch and untouched by the installer.

SEO POWER adds a native administrator workspace at `/angelcare-marketplace/admin/seo-power`. It uses the existing application, existing Marketplace Supabase service client, native staff authentication and global Web Presence view/manage/publish/rollback permissions. Existing public content, logos, publishing systems and private account rules remain authoritative.

## Operator workspace

Ten horizontal sections: Pilotage, Exploration, Corrections, Publication, Maillage & liens, Données structurées, Diffusion, Automatisation, Qualité CI, Journal. Global and per-universe views, paginated URL inventory, scoped search, CSV URL registration and export, native-front initialization, page-inspection drawers, revision editing, editorial previews, approval, explicit publication review, post-publication verification, rollback with a recorded reason, queue processing/cancellation and evidence export are connected to server handlers and SQL transactions.

The initial database contains three configuration rows and no resource, product, job, article, keyword-ranking or traffic samples. Screenshots and verification fixtures use an isolated local database; that inventory is excluded from the installer.

## Real execution

Crawlee's Cheerio pipeline inspects server HTML, HTTP status, metadata, canonicals, H1s, language, hreflang, images, JSON-LD and same-universe public links. Robots rules are respected. HTTPS transport checks every DNS answer, pins the selected public address, validates TLS, restricts redirects and caps time, response size and discovery volume. Linkinator consumes actual bounded HTTP statuses through a temporary request-local adapter; there is no additional deployed service.

Durable SQL tasks have leases, three-attempt recovery, active-task deduplication, cancellation and protection against late results. A new publication cancels superseded verification work. Daily per-universe budgets and a global maximum of three active jobs constrain load. Each HTTP execution handles at most two tasks. The scheduler calls the existing application endpoint using a Vault-held token; public callers cannot run jobs.

Metadata changes are drafts until approved and explicitly published. Native-source fingerprints, revision checks, domain restrictions and current public-page checks protect business content. Subsequent native metadata changes withdraw a conflicting SEO override. Existing noindex decisions remain in force. Automatic repair is disabled initially; an authorized publisher can enable the narrow rule for missing canonical URLs on verified public pages. Other changes require review.

Original editorial landing pages can be authored at `/{universe}/{locale}/discover/{slug}`; AngelCare's universe prefix is `/angelcare-marketplace`. They render inside their native shells. No generated doorway pages or seeded business inventory are published.

## Publication coverage

Direct native metadata adapters cover AngelCare's localized main public catch-all, all 12 explicit atomic storefront routes and catalog item route, KidFlix home/explorer/all 16 category fronts/resource details, JOBKIX's public catch-all, and the three editorial landing-page routes. Native product and job entities remain maintained by their own business services. Existing language alternates and indexing decisions are retained. Invalid/expired/private native resources keep their existing withdrawal or noindex behavior.

The crawler can diagnose additional registered public URLs. Publication of an override requires an observed native SEO adapter marker; unadapted explicit routes require their native Studio/source correction. It does not silently claim that every hardcoded route or every HTML/performance defect can be rewritten through the workspace. Native H1/template/media/source-code repairs still follow the existing code release workflow.

A metadata patch can add typed WebPage/CollectionPage JSON-LD and recently verified same-universe contextual links where the native body hook is present. The Families and Home Services storefronts also receive body hooks. Other explicit AngelCare storefronts retain their native content/schema authorities while exposing metadata and canonical corrections. schema-dts validates TypeScript shapes; JSON parsing does not certify eligibility for every search-engine rich result.

## Discovery and delivery

`/seo-power-sitemap.xml` lists per-world sitemap endpoints. Sitemap entries come from enabled projects' registered HTTP-200 indexable observations, with row-cap-safe pagination and private-path exclusion. Editorial RSS exposes verified published landing content. `/seo-power-indexnow-key.txt` serves the database ownership key only on a configured project host. IndexNow is opt-in; acceptance records reception, not indexation. Existing robots sitemaps and JOBKIX sitemap logic are retained.

The existing Marketplace GHCR One-Off workflow audits the same candidate image with isolated Lighthouse CI tooling before image push. It retains full artifacts and summary scores. Missing title, document language or viewport fails the check; SEO/performance thresholds initially warn. The CI audit is distinct from deployed-site observations and runs without production database credentials. A GitHub OIDC intake validates signature, issuer, audience, repository, branch, workflow identity, event, SHA and expiry before saving candidate evidence. On the first deployment, or a workflow_dispatch building a SHA different from its signed workflow SHA, intake can be unavailable/refused while artifacts remain available. Raw Lighthouse reports can be imported as clearly labeled manual public or candidate reports.

## Apply and release

1. Run the guarded installer from the repository's current compatible checkout. It checks exact original file hashes, payload hashes and native dependency guards, saves original bytes, verifies every write and prints a rollback command. Local unrelated pending work is untouched. It refuses incompatible shared-file edits rather than replacing them.
2. **Required:** run the complete `apps/marketplace-web/angelcare-marketplace/seo-power/INSTALL_SEO_POWER_R1.sql` in the existing Marketplace Supabase SQL Editor as database owner. The migration is additive and repeatable. Do not drop existing tables.
3. Existing Supabase URL/service-role configuration is reused. Scheduling additionally requires `pg_cron`, `pg_net` and `supabase_vault` to be available in that same database. Enabling pg_cron on a self-hosted installation can require its existing database configuration/restart procedure. The migration does not alter server preload settings or create another service.
4. Release through the current push → Marketplace GHCR One-Off → Coolify image workflow. Node 22.13 or later is required by the selected Crawlee release; the existing application targets Node 22. The new npm lockfile is included. No database or production credential is placed in CI.
5. Open SEO POWER, verify the three origins, initialize/import actual public URLs, explore a small selection and review the observations. Enable project schedules and then the Supabase scheduler only after the new execution endpoint is deployed. IndexNow and autonomous canonical repair remain off until explicitly enabled.
6. Confirm a real published revision reaches its public URL and has a successful verification receipt. Confirm a scheduled task starts, completes and records its result. These installation-specific acceptance checks cannot be certified from the isolated fixture.

Source rollback restores original files and removes added files only if no later edits would be overwritten. Before source rollback on a running installation, disable the scheduler through SEO POWER or run `select public.ac_seo_power_scheduler(null,null,null,false);` as database owner. SEO tables/history are retained for recovery; the installer does not delete database data. A source rollback does not undo already deployed database changes or restore old runtime images automatically.

## Verification and limits

Completed local checks: 48 database checks; 51 crawler/model/Linkinator checks; 51 API/publication checks; 33 source/lockfile/route invariants; 30 responsive browser layouts. The browser exercised editing, preview, approval, publication and successful queued verification through the actual handlers and SQL with fixture authentication and a PGlite transport. The repository includes an isolated reproducible regression harness under scripts/seo-power-tests. Pagination beyond 40 entries, search and empty-universe states were observed. Targeted TypeScript diagnostics on changed files are zero; the partial recovered checkout has dependency diagnostics outside this patch, so a complete repository build has not been represented as passed.

Live Supabase REST/RBAC data, installed pg_cron/pg_net/Vault execution, deployed HTTPS transport and actual GitHub Actions candidate audits remain installation/build verification. No production SQL, commit to the release branch, image build, Coolify deployment, crawler run, indexing submission or organic-growth claim was performed here. Organic traffic and rankings are not fabricated or promised by technical task success.

Primary integration references: https://crawlee.dev/js/api/cheerio-crawler/class/CheerioCrawler ; https://supabase.com/docs/guides/functions/schedule-functions ; https://github.com/google/schema-dts ; https://github.com/JustinBeckwith/linkinator ; https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md ; https://www.indexnow.org/documentation .
