# SEO POWER SCALE ENGINE R4 — guarded backend change

## Safety and rollout
- This release is **backend-only**. Public pages, component styles, shared headers, footers, SEO POWER UI, publication routes and existing authorization are unchanged.
- Legacy R1/R2 functions are left intact. An additive Supabase migration creates new **R4-named** functions and tables.
- R4 activation requires **both** the deployment environment `SEO_POWER_ENGINE_R4_ENABLED=1` and `public.ac_seo_power_r4_control.enabled=true`.
- The migration **does not enable R4**. A source build and migration alone leave production on the legacy engine.
- All existing SEO job records, change receipts and historic attempts remain in place.

## Capacity model
- Config defaults: 16 global running jobs, 8 per project and origin, 4 workers/tick, 1 job per worker, 30s bounded request timeout, 240s lease, 6 retries, 100,000 active queue slots per project, 250k inventory target.
- These are ceilings/targets, **not promises of throughput**. The current HTTP worker route lasts only 55s; capacity depends on its dispatch cadence and on project web servers.
- Legacy workers must be drained before enabling R4 on a scaled service. Database claims protect duplicate rows, but the running R1 worker has different admission limits.
- The SQL admission function queues crawl prerequisites rather than failing links with missing facts. IndexNow jobs for disabled or unverified pages are dropped before admission, preserving existing IndexNow semantics.
- R4 success uses the existing R2 observation, verification and historical-recovery semantics.

## Exact activation gates
1. Verify the dedicated feature-branch TypeScript and source-contract workflow is green.
2. Deploy the same commit's application image with `SEO_POWER_ENGINE_R4_ENABLED` unset (legacy).
3. Apply `supabase/migrations/20261114012000_seo_power_scale_engine_r4.sql` once through the normal controlled migration process.
4. Run non-production integration/scale testing for claim, dependency, retry and crash recovery. Use representative web origins.
5. Drain legacy worker requests and check old leases. Only then opt-in the database and deployment flag together.
6. Monitor queue depth, origin latency, failure classifications, fairness and recoveries before scaling workers further.

## Rollback
Set `SEO_POWER_ENGINE_R4_ENABLED=0` in the application and restart workers, then disable the R4 database flag. Do not delete R4 tables or rewrite completed receipts. Preserve any R4 leases until they are finished or expire, and do not run old and new workers on the same job simultaneously. The exact rollback order must be rehearsed against a staging database before production activation.

## Not yet in scope
- Browser acceptance/throughput at real production scale is not asserted from source or typecheck results.
- Running more worker services and configuring server resource limits is an infrastructure action, not a UI change.
- The Google Tag Manager warning is independent of SEO job worker capacity and is not modified by this release.
