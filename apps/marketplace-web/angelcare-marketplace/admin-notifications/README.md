# Global Admin Notification Center · AC-NOTIFY-PROMAX-R1

Built against GitHub `439ae71a959433706b13b4233e4c1b48af6d5d97`, branch `upgrade/next-angelcare-upgrade`. Preserves the published Marketplace imagery and JOBKIX navigation changes. The existing bell hosts the dropdown. History/settings/source health: `/angelcare-marketplace/admin/notifications`.

This release delivers the application source and activation assets. Applying source alone does not activate database capture, start a worker or deploy the application. Production installation/coverage, representative production performance, and real-browser acceptance remain activation gates. The local verification report distinguishes fixtures from production evidence.

## Source and identity coverage

166 explicit native source entries, 28 event families, AngelCare/KidFlix/JOBKIX. Configuration is in `sources.json`; provenance is in the release evidence. Native DCE ownership is checked against its KidFlix homepage scope; AngelCare imagery is explicitly excluded from KidFlix classification. New KidFlix R2 import sessions, delivery packages and interactive public health are included.

Capture happens in the same PostgreSQL transaction as the native insert/update/delete. Semantic projection watches status/state, immutable event/action codes, revision/version, deadlines, scope, permissions and selected numeric/boolean public facts. Timestamp-only updates are ignored. Bodies, names, addresses, emails, tokens, document contents and arbitrary data JSON never enter the feed. No customer mail or native business command is executed by this feature.

Scope is rechecked from the current native record on every read/count/focus. Actual database foreign keys resolve parent scope; KidFlix package/import `scope_key` is explicitly decoded using its native contract. Tenant/territory assignments remain paired. Unknown organization/school recipient authority fails closed for ordinary Marketplace operators; this release does not invent a cross-application grant. Global native master admins retain their authority, subject to selected tenant/territory. Sources with missing tables or primary keys stay visibly blocked. A register entry is not a claim that its optional native migration is installed.

## Database activation: 6 migrations, in order

Use the existing Supabase SQL operator workflow. The source installer never connects to a database.

1. `database/001_store.sql` — isolated tables, RLS and default-deny grants.
2. `database/002_capture.sql` — safe projection, native scope resolution, transactional hooks.
3. `database/003_delivery.sql` — durable projection, authorized read/count/focus, personal state and audited operations.
4. `database/004_register.sql` — explicit source register; preserves saved severity/expiry policy revisions.
5. `database/005_operations.sql` — expiry/overdue/lease monitors, grouped activity, diagnostics, bounded backfill and retention.
6. `database/006_activate_and_grants.sql` — install hooks for present source tables and service-only RPC grants.

There are **8 SQL files total**: the 6 activation migrations above plus `operations/VERIFY.sql` (read only) and `operations/DISABLE_CAPTURE.sql` (operational rollback). Run neither operational script as an additional activation migration. Revoke checks in VERIFY must report `false` for both browser roles. Do not manufacture missing business tables to turn source health green; install the relevant native module or investigate its actual schema.

## Runtime configuration and worker

One new server-only environment variable:

```text
MARKETPLACE_NOTIFICATIONS_WORKER_SECRET=<at least 32 random characters>
```

Generate a fresh value with `openssl rand -hex 32`. Use the same value in the app and its worker process. Never put it in a `NEXT_PUBLIC_` variable. It secures the internal worker endpoint and signs identity/scope/filter-bound list cursors. Existing Supabase server credentials continue to be used by the app.

The worker must run on the existing server/image, with the same environment:

```sh
node scripts/angelcare-marketplace/notification-worker-r1.mjs --once
node scripts/angelcare-marketplace/notification-worker-r1.mjs
```

Run the second command as a supervised companion process in the existing deployment. Its default application origin is `http://127.0.0.1:3000`; override using `MARKETPLACE_NOTIFICATIONS_WORKER_ORIGIN` when the actual internal port differs. Remote origins require HTTPS. Do not send the dedicated credential to another service. No new container, hosted platform, outbound message provider or client push service is required.

The loop waits 15 seconds between bounded passes. A pass monitors up to 24 sources × 100 native records, projects up to 1,000 pending events, checks up to 40 active DCE editions, and applies bounded retention. At most the first encountered interactive resource is probed through the existing bounded public runtime health adapter during each edition batch. Its other checks use native identities/manifests. This is operational readiness evidence, not a replacement for full browser playback tests. Missing DCE readiness dependencies are reported as degraded, not silently skipped as healthy.

The client refetches about every 10 seconds while open and 30 seconds while closed/visible, pauses when hidden/offline, and applies failure backoff/jitter. This release uses the explicit polling fallback; it does not claim sub-five-second SSE delivery. Worker heartbeat older than 90 seconds, projection backlog older than 60 seconds, failed/quarantined projection or blocked sources produce degraded coverage. Production throughput and end-to-end latency must be measured after activation.

## Admin behavior

Read/unread, archive, pin, snooze and source quieting are persistent per native operator. Critical unresolved issues remain actionable after reading and cannot be hidden by snooze. Bulk read has a server-issued reviewed snapshot and marks only recorded versions, preserving new arrivals. Counts do not come from the 30-card page. Signed cursors cannot cross actors, scopes or filters. Other tabs receive invalidation only, then reauthorize their reads.

The native-workspace focus companion opens the precise concerned record and recent safe timeline above the original native workflow. Canonical journey/customer details and DCE record routes retain their native typed IDs. The companion exposes no alternate approval, financial or publication command. Deleted or revoked objects produce an unavailable context rather than a generic homepage redirect.

Global master admins can edit the source's minimum severity and expiry-warning window, with policy version, actor, reason and idempotent receipt. Native critical severity cannot be demoted by this floor. Source operations can preview/apply a 100-row backfill and retry at most 100 failed **notification projections**. They never replay a payment, publication, email or other business transaction. Source operations require a global admin context without selected tenant/territory and a written reason. Personal preferences do not modify capture policy.

High-volume DCE activity is counted into hourly resource summaries with no subject identifier copied. Conversation messages group by native thread; import lines group by native job. Source-level grouping is fixed to audited keys. Routine inventory snapshots group by selection/variant/warehouse. The feed shows underlying event counts; focus shows the most recent 40 safe facts.

Automatic projection retries back off and stop after 8 failures, remaining visible for reviewed retry. No cursor-based maximum-ID watermark can strand a late committed pending event.

## Existing data, retention and rollback

New committed events are captured after hook activation. Existing dossiers are not silently reintroduced as new notifications. For controlled initial catch-up, use source operations or `ac_nc_backfill(source, after, 100, false)` to preview; `true` applies one bounded page. Continue using the returned cursor. Backfill event identities deduplicate repeated pages.

The worker currently uses a 90-day product retention setting. Unresolved/pinned/unread threads retain their last fact; old projected history is deleted in batches of at most 5,000, old fully-read/resolved threads in batches of 500. Command receipts retain 30 days and reviewed read snapshots 10 minutes plus cleanup grace. Adjust the explicit worker setting to the organization's approved policy; these defaults are product choices, not legal retention advice.

To pause: stop worker supervision, then use DISABLE_CAPTURE if capture must stop. For application rollback, use the source installer's guarded journal. Rollback retains database evidence/state and never drops native business tables. Later edits are protected from overwrite.

## Acceptance before calling the feature live

Apply source, execute 001–006, set the server-only secret, deploy through the existing authorized GitHub/Coolify release process, supervise the worker, then execute VERIFY. Inspect every blocked/degraded source. Test actual operator grants and native scoped objects in each installed family. Check real-browser desktop/mobile focus and keyboard interaction, counts and deep links; confirm native transactions/customer notifications are unchanged. Measure authorized list/count p95 against the agreed representative load target (500 ms) and record query plans on the deployed PostgreSQL instance. These are pending production gates, not local-test claims.

## Reproduce isolated PostgreSQL fixture verification

From `apps/marketplace-web` (no production database is contacted):

```sh
npm --prefix scripts/angelcare-marketplace/notification-tests ci --ignore-scripts
node scripts/angelcare-marketplace/notification-tests/verify-postgres.mjs
node scripts/angelcare-marketplace/verify-admin-notifications-r1.mjs
```

The dedicated test directory pins PostgreSQL WASM independently from the application dependency lock. Native source schemas are read from the current repository; every table and fixture is created in an isolated in-memory database. These commands do not build or deploy the application.
