JOBKIX additive SQL authoring set — manual operator handoff

No production SQL has been executed. The 28 numbered files have executed in isolated PGlite using synthetic native Auth, media, trust and editorial fixtures. This establishes the tested command/RLS behavior, not compatibility with an uninspected hosted schema, storage policy or concurrent hosted sessions.

`SQL_ORDER.json` beside the installer lists the exact package paths, order, byte sizes and SHA-256 values. They are also present in the complete payload hash manifest. Read the files in order 001 through 028. Do not paste the entire set into a database merely because this package exists.

Before manually applying the set:

1. Use the intended isolated database first. Confirm existing Supabase Auth identities/roles and native Marketplace administration, workspace permissions, audit, editorial and media authorities match the references in the SQL. Synthetic test adapters are not production prerequisites and must never be installed into a hosted database.
2. Inspect `public.jobkix_schema_versions` if it already exists. Record applied versions and the exact previous SQL hashes. A version number alone does not prove that its bytes match this set. Stop on unexpected drift or a partially applied migration; do not edit the guard or drop data to get past it.
3. Obtain the ordinary database backup/recovery checkpoint through the operator's existing process. Source rollback cannot undo database changes or restore recruitment data.
4. Run only unapplied migrations in ascending order after reconciling prerequisites. The files use transactions and explicit predecessor checks; several create new objects and are not arbitrary rerun scripts. Keep the original files unchanged and record each result.
5. Verify the intended authenticated/anonymous/service-role boundaries, actual private bucket, upload/download authorization and isolated application/offer/replay/closure journeys. Do not use real private candidate files as test fixtures or seed fabricated public records.
6. Keep production activation pending while the candidate's core blockers remain. No live edition publication, production seed, storage policy mutation or migration execution is authorized by the source installer.

Required configuration names (no values are included): existing native Supabase/Auth configuration, `JOBKIX_PUBLIC_ORIGIN`, `JOBKIX_PRIVATE_DOCUMENT_BUCKET` (default `jobkix-private-documents`, must be private). Guest reporting additionally requires `JOBKIX_GUEST_CASE_SECRET` and `JOBKIX_TRUSTED_CLIENT_IP_HEADER`; the existing trusted proxy must overwrite that header and prevent direct-origin spoofing. Missing configuration fails closed.

Standby configuration: `JOBKIX_WORKER_SECRET`, existing `EMAIL_OS_BRIDGE_URL`, existing `EMAIL_OS_BRIDGE_TOKEN`, native Auth redirect/email settings and operator schedules. Do not activate delivery or periodic calls as part of this handoff. Preserve the existing sender/token/durable-delivery authority. A provider acknowledgement is not proof of inbox delivery; uncertain deliveries must not be blindly resent.

No new production database rollback SQL is claimed. The source rollback restores only packaged files and protects later edits. Retention/erasure fulfillment and holds remain unfinished; privacy review requests do not establish that data has been erased.
