# ANGELCARE HR Employee 360 — Migration and Test Order

## 1. Install the source package

Run the package installer with the targeted TypeScript gate enabled. Do not run a local production build.

## 2. Run the read-only production preflight

Execute:

```text
apps/ops-web/deployment/hr-employee-360-sovereign-command/PRE_MIGRATION_SCHEMA_AUDIT.sql
```

The preflight must confirm that `public.hr_staff_profiles` is either absent or is a UUID-backed table. Stop if it is a view, materialized view, or uses a non-UUID `id`.

## 3. Apply the additive migration

Execute exactly:

```text
apps/ops-web/supabase/migrations/20260804_hr_employee_360_sovereign_command.sql
```

The migration is additive and idempotent. It does not drop or truncate production tables. Existing generic `hr_management_workspace` items are preserved as explicitly tagged legacy employee cases; they are not treated as native domain facts.

## 4. Verify the resulting schema

Execute:

```text
apps/ops-web/deployment/hr-employee-360-sovereign-command/POST_MIGRATION_VERIFICATION.sql
```

Confirm:

- canonical Employee 360 evidence tables exist;
- the private `hr-employee-documents` bucket exists and is not public;
- domain tables expose version/archive/employee identity fields;
- Employee 360 evidence tables have RLS enabled;
- version/timestamp triggers exist.

## 5. Functional smoke tests

Perform these tests locally or in the intended validation environment:

1. Open `/hr/employees`, select a real employee, and open **360**.
2. Confirm the modal performs a focused fresh load and the full-page button opens `/hr/employees/[id]` with the same data.
3. Edit identity/employment fields and verify the employee row refreshes without a full browser reload.
4. Open two sessions, edit the same employee, and verify the stale session receives a version conflict instead of overwriting data.
5. Execute a permitted lifecycle transition with a reason; verify the employee status and immutable timeline evidence.
6. Archive and restore an employee; confirm no domain records are physically deleted.
7. Create, update, validate, archive, and restore a native domain record.
8. Upload a PDF or image under 15 MB; verify a native `hr_documents` record, private storage object, SHA-256 hash, and audit event.
9. Download the document through the short-lived signed URL.
10. Verify compensation values are hidden from users without compensation permission.
11. Verify an employee from another tenant/organization cannot be read or mutated.
12. Verify the communications tab reads the existing HR Email OS send-job history when the HR email bridge migration is present.
13. Verify the print view contains only its explicit allowlisted employee fields.
14. Verify an attempted permanent DELETE is rejected and ordinary DELETE performs controlled archival only.

## 6. Final repository gate

After smoke testing:

- run the canonical clean TypeScript gate in 8 GB batches;
- exclude `.next`, backups, logs, temporary artifacts, and verification-only shims;
- do not run a local production build;
- stage, commit, and push only after the gate passes.
