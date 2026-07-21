# Rollback Instructions

## Preferred production rollback

The safest rollback is application-first and schema-preserving:

1. Stop Ambassador write traffic.
2. Restore the pre-patch application commit, or apply the included reverse patch:
   `git apply patches/market-os-ambassadors-production-hardening.reverse.patch`
3. Keep the additive database columns/tables in place. They do not require the hardened runtime and retaining them avoids losing assignment history, idempotency records, audit entries, or payouts.
4. Validate the previous runtime before reopening traffic.

## Database policy rollback

Only when the prior runtime depends on direct authenticated table access, review and execute `rollback.sql`. It is guarded and will not run unless the session variable below is set:

```sql
set app.ambassador_hardening_allow_security_regression = 'true';
```

This deliberately restores the bundle's former permissive `authenticated_all` policies and is therefore a security regression. It does not drop additive columns or data-bearing normalized tables.

## Destructive cleanup

No destructive cleanup is automated. Dropping actor roles, idempotency, normalized mission assignments, territory history, proof/payout data, or added columns can destroy production evidence and should require a separately reviewed migration after export and retention approval.
