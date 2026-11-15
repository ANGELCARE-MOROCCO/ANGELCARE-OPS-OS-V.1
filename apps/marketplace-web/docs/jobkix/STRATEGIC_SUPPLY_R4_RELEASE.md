# JOBKIX Strategic Supply R4 — controlled production activation

Base: upgrade/next-angelcare-upgrade. No production deployment in this implementation commit.

## Prerequisites
1. Record the running Marketplace image SHA and confirm migrations 030, 031 and 032 in the production schema.
2. Preserve a database backup and the currently running image digest.
3. Review additive migration 033, function privileges and RLS.
4. Execute migration 033 on a compatible staging database; run the unit, API and transaction tests.
5. Deploy only after a successful full build for the exact reviewed SHA. No mass merge into marketplace-production.

## State contract
- Ready or needs_review to approved is editorial review, not publication eligibility.
- Approved to published requires full-content rights, approved official application host, source country evidence, rich content, current source and quality >=80.
- Each decision, audit entry and idempotency receipt must commit in one database transaction.
- The SQL assessment and public native gate must agree.
- Editorial duties and requirements must be sourced from the exact original job URL, never fabricated.
- All external public readers use the SQL visibility gate.

## Acceptance gates not yet verified
- Database: concurrent retries, forced audit failure, stale version, permissions and all eligibility flags.
- Browser: 75-point blocked preflight, eligible publish, public detail/search and withdrawal.
- Application: TypeScript, full production build, deployed SHA and authenticated read-back.
- Recovery: revert the application image if needed; preserve additive audit records for a reviewed cleanup.

The migration must be applied before the new R4 API commands can work. Focused tests alone are not production certification.
