# SANILA Master Demo V2 — factory reset contract

Authority: `supabase/seeds/MASTER_DEMO_RESET_V2.sql`.

Preconditions: exact four identity IDs, active/non-billable/safety state, advisory lock and exactly 127,177 registered fixtures. Failure aborts closed.

Reset opens one transaction, acquires the shared advisory lock, validates identity and the exact registry, removes journal-owned Demo-created rows, and imports the same seed with its standalone transaction wrapper disabled. The journal remains intact until reseed and postconditions succeed. Only then does reset clear the journal, set `last_reset_at`, return status to `idle`, and commit. Any psql error exits under `ON_ERROR_STOP`; the open transaction is rolled back by PostgreSQL rather than leaving cleanup committed.

It never targets school, tenant, subscription, package, entitlements, Demo config, grants/sessions/events, auth users or roles.

The staff-attendance/leave, task, incident and safety fixture families use the same deterministic registry. Their interactive tables are in the explicit mutation-capture allowlist; created rows are removable and canonical edits/deletes are restorable.

The registry stores each fixture's database-normalized authored payload and its content hash. Volatile ingestion/audit timestamps and deterministic identity are excluded from business-state equality. Reset postconditions require every registered row to exist and every authored value to match. Future isolated-clone test: seed → validate → interact → reset → validate/content fingerprint A → interact → reset → validate/content fingerprint B → require A=B, empty journal, unchanged permanent authorities and unchanged non-Demo tenant hashes. This mission did not execute it.

RESET_CLEANUP_AND_RESEED_ONE_TRANSACTION=PASS_DESIGN
RESET_FAILURE_ROLLS_BACK_ALL=PASS_DESIGN
JOURNAL_NOT_CLEARED_BEFORE_RESEED_SUCCESS=PASS_DESIGN
RESET_STATUS_SUCCESS_ONLY_AFTER_RESEED=PASS_DESIGN
CANONICAL_CONTENT_FINGERPRINT=PASS_DESIGN
MISSING_REGISTERED_ROW_DETECTED=PASS_DESIGN
