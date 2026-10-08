# Runtime gates

The static audit establishes source coverage, not product completion. Before release, run the authenticated app and record:

- every canonical workspace loads without an unexplained 404;
- loading, empty, populated, filtered-empty, error and permission-denied states;
- every mutation uses the existing server authority and handles success, failure, stale data and unsaved input;
- high-risk actions use governed modal/drawer surfaces, never browser confirmation;
- imports, exports, publication, refund, approval, recovery and bulk operations show real job/result state;
- related-object links resolve and preserve list context;
- screenshots are captured and compared for all 11 approved batches.

Current state: `RUNTIME_VERIFICATION_GATE` with three accepted environment gates: browser Chromium `SIGTRAP`, localhost isolation between command contexts, and global TypeScript/optimized-build terminal timeout.

Evidence:

- A pre-consolidation production build completed compilation, TypeScript, page generation and route optimization.
- The post-consolidation build reached optimized compilation but produced no terminal exit status before the environment window closed.
- Scoped `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` was run for 180 seconds and watchdog-terminated with `TSC_EXIT_CODE=142`; this is neither PASS nor FAIL.
- `npm run dev` reported ready on port 3000 inside its session, but localhost was unreachable from the verification command context (`curl` status 000). Playwright Chromium also exited with `SIGTRAP` before navigation.
- Authenticated browser screenshots and mutation smoke remain open; no visual acceptance claim is made.

The former permission defect on `/api/angelcare-marketplace/admin/transaction-flight-deck/snapshot` was repaired with route-level `marketplace.operations.view` enforcement and is no longer a release or runtime gate.

## Final blocker-closure runtime/configuration gates — 2026-08-29

- Targeted Next development compilation succeeded for the new PayPal, Media Storage, Live Proof Sources and Localization routes on port 3001. Sensitive CRM/media APIs returned `401 AUTHENTICATION_REQUIRED` without an Admin session.
- Authenticated CRM task and communication mutation canaries remain pending because this command context did not have an authorized Admin session. Static permission, API, repository, table and lifecycle chains pass.
- PayPal adapter connectivity is proven: required values are present in `apps/ops-web/.env.local` and a credential-only OAuth probe against the source-selected live endpoint returned HTTP 200. No value/token was printed or retained and no payment/refund was attempted. The values are absent from `apps/marketplace-web/.env.local` and its active process, so enabling PayPal in the Marketplace runtime remains a deliberate deployment-environment configuration gate; credentials were not copied across application boundaries.
- Marketplace Windows media gateway application UAT requires `MARKETPLACE_MEDIA_GATEWAY_PUBLIC_URL`, `MARKETPLACE_MEDIA_SIGNING_SECRET` and `MARKETPLACE_MEDIA_GATEWAY_ADMIN_TOKEN` in the application runtime, plus `MARKETPLACE_MEDIA_ALLOWED_ORIGIN` on the Windows gateway. The isolated gateway engine canary passed signed upload, metadata/hash readback, byte-identical and ranged delivery, adaptive desktop/tablet/mobile/square derivative creation/readback, delete and zero-file cleanup.
- Localization records are operational in Admin, but generic `angelcare_marketplace_translations` publication is not read by current public repositories. Public entity-specific localized fields remain the source-backed public authority. This linkage is `PARTIALLY_RESOLVED_WITH_EXACT_PROVEN_GAP` rather than a runtime success claim.
