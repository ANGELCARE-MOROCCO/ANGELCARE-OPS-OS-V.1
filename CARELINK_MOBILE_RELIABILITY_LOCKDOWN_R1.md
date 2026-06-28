# CARELINK MOBILE RELIABILITY LOCKDOWN — R1

Scope: repair the three close-cycle gaps found by R0.

## Closed gaps

1. Messages close-cycle
   - Adds `localMessages` / `setLocalMessages`.
   - Sent messages become visible immediately in the mobile messages page.
   - Location send also appears in the synchronized feed.

2. Readiness review request
   - Adds `/api/carelink/readiness/review-request`.
   - Mobile can request OPS readiness/document review.
   - Request writes review state where possible and creates an OPS-visible notification.

3. Profile documents
   - Adds `/api/carelink/profile/documents`.
   - Mobile can load profile documents and submit a document record for OPS review.
   - Submission creates an OPS-visible notification.

## Not changed

- No OPS redesign.
- No mobile visual redesign.
- No SQL migration.
- No mission/payment/SOS workflow change.
