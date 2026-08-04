# HR Onboarding Production Completion — Controlled Activation

## 1. Install source package
Run the package `INSTALL.sh` with `RUN_TARGETED_TSC=1`.

## 2. Review the source delta
From the repository root:

```bash
cd ~/Desktop/angelcare-platform
git status --short
git diff --stat
```

## 3. Run database preflight
Execute `PRE_MIGRATION_SCHEMA_AUDIT.sql` in the intended Supabase project. Confirm that this is the correct production-compatible database and preserve the result for evidence.

## 4. Apply the additive migration
Execute:

```text
apps/ops-web/supabase/migrations/20260804_hr_onboarding_production_completion.sql
```

The migration is transactional, additive, idempotent, and does not drop or truncate onboarding business tables.

## 5. Run post-migration verification
Execute `POST_MIGRATION_VERIFICATION.sql`. Required results:

- all seven canonical tables resolve;
- the four canonical functions resolve;
- the standard checklist is published with 12 items;
- the private storage bucket exists;
- updated-at and immutable-activity triggers exist;
- no permissive authenticated onboarding policy remains.

## 6. Local functional smoke tests
Open `/hr/onboarding` and verify:

1. An empty database shows a real empty state and no fabricated employee.
2. Create a journey from an existing candidate or employee.
3. Confirm one journey, checklist assignment, persisted tasks, persisted document requirements, and activity evidence are created.
4. Refresh the browser and confirm the same records remain.
5. Edit the journey and verify version increments.
6. Complete, block, reopen, and archive a task.
7. Request, upload, download, validate, reject, waive, and archive a document.
8. Attempt phase advancement with incomplete required gates and confirm it is blocked.
9. Complete required gates and advance the phase.
10. Add a note, decision, risk, and escalation and confirm immutable timeline evidence.
11. Archive and restore a journey.
12. Open the same journey in two sessions; make one update and confirm the stale session receives HTTP 409 instead of overwriting.
13. Verify a user without HR Onboarding access is denied.
14. Verify a different tenant cannot read or mutate the journey.

## 7. Final TypeScript gate
Run the repository’s canonical contamination-safe TypeScript batches with 8 GB memory. Do not run a production build locally.

## 8. Stage, commit, and push only after acceptance
No database secret, generated output, backup, log, or local artifact should be staged.
