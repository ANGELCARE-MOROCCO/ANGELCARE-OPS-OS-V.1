# SEO POWER Command Center 360 R5
## Release scope and protection
- 13 horizontal operator workspaces in the existing SEO POWER admin body.
- The original SEO POWER Workspace remains available under **Advanced Tools**; Growth and Google Intelligence retain their native authority and routes.
- Existing public Marketplace, JOBKIX, KidFlix and SANILA storefronts, shared header/footer, and user-facing services are unchanged.
- All database changes in `20261114034000_seo_power_command360_r5.sql` are additive. No existing publications, jobs, failure records or audit receipts are erased.
- The public/admin API permissions remain global-role and capability checked. R5 commands require `marketplace.web_presence.manage`; activation and capacity require publish-level authorization.
- SQL installation alone does not turn on R5: `ac_seo_power_r5_control.enabled` defaults false.
- R5 engine callbacks require `SEO_POWER_COMMAND360_R5_ENABLED=1` and a genuinely enabled R4 worker.
## Deployment
1. Validate R5 isolated source/test/TypeScript workflow.
2. Build and push the exact Marketplace GHCR image; deploy it to Coolify without enabling R5 yet.
3. Apply the additive R5 SQL migration to the existing Supabase database as owner.
4. Verify `SEO_POWER_ENGINE_R4_ENABLED=1` **and** R4 database enabled on the deployed service; no assumption based solely on SQL installation.
5. Configure `SEO_POWER_COMMAND360_R5_ENABLED=1` in Coolify and restart the exact image.
6. Verify the R5 dashboard read model, then activate R5 through privileged governance action. Initial launch with one small campaign. Check read-back and worker log evidence.
7. Validate pause/resume, scheduled campaigns, retry/cancel, HTTP and DB failures, job leases, legacy workflow preservation, and browser refresh survival.
8. Increase capacity gradually with origin pressure safeguards. Treat GSC/GA4 and Core Web Vitals as independent evidence.
## Safety caveats
- A paused campaign prevents **new** R4 claims for its assigned jobs. Already claimed work completes; a shared job may block until the paused campaign resumes. This is disclosed by the interface.
- Campaign completion percentage measures recorded terminal states, including failed/skipped jobs; it is not equivalent to 100% success.
- New R5 campaigns use a fixed set of registered pages. Auto-discovered pages from later work are not added to the existing campaign's progress denominator.
- True push-based Server Sent Events are not introduced in this phase; the admin polls the authoritative persisted data every 8 seconds while visible. This is **live monitoring by polling**, not sub-second streaming.
- Worker registry is a per-process recently-observed ledger; its latest timestamp is **not** a continuous liveness heartbeat. Long-running jobs still rely on R4 job leases.
- The R4 run route remains synchronous for each worker tick. This release does not convert it into a separately deployed long-running worker service.
- Historical SEO audit pages and publication safety stay governed by existing permissions.
## Rollback
Disable R5 in the database governance interface, unset `SEO_POWER_COMMAND360_R5_ENABLED`, and deploy the previous frontend image if needed. Preserve R5 campaign/job/event tables and audit evidence. The R5 SQL overrides the R4 claim function to respect paused campaigns, so a complete database-level rollback requires a separately rehearsed restoration of the R4 claim function. Never automatically drop tables or clear historical jobs.

## Incident & recovery upgrade
- Grouped recovery is bounded to 100 source failures per request and is idempotent. The UI chooses 50 by default and scopes recovery to its displayed world.
- Individual retries use R4 admission with typed eligibility. Links missing crawl facts queue the crawl prerequisite; prohibited or source-review failures cannot be blindly retried.
- New recovery receipts preserve the original failed job and prevent duplicate replays. Historical failures are only reconciled on subsequent successful work.
- Scheduler mutations use request keys with database uniqueness, while activation and capacity updates use atomic database transactions with audit events.
