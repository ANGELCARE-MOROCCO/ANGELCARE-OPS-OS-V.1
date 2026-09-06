# SANILA Master Demo Living School V1 — human-review report

Decision requested: review source only. Do not apply, seed, reset, build, deploy, or expose demo access as part of this review.

## Prepared deliverables

- Canonical actual-schema/identity data model.
- Fixed mid-year living-school scenario.
- One-row-per-route matrix for all 195 protected School Command Center routes.
- Project-native seed authority pinned to the existing tenant/school/config/Admin chain.
- Fixture-owned, transactional, fail-closed reset authority.
- Static source certification and prepared read-only database validation.
- Dependency-order and exact 17,714-row fixture forecast.

## Evidence collected without mutation

- Current repository schema snapshot and all later migrations were inspected.
- Current route inventory is exactly 195 School Command Center pages.
- Repository data access refers to 326 distinct `angelcare360_*` table names across School/Operator server code.
- A read-only REST lookup confirmed one exact active Master Demo configuration and the identity IDs recorded in the model.
- The live config reported `seed_health=healthy`, safety enforced, non-billable, and the legacy canonical core counts. It was seeded on 2026-09-04 and has never been reset.
- No SQL was executed and no REST write was made.

## Material improvements over the existing reset/seed

1. The scenario is genuinely mid-year rather than a September opening snapshot.
2. Reset ownership is explicit. The prior reset discovered every `angelcare360_*` table with `school_id` and deleted all school rows; the new reset deletes only registered deterministic fixture IDs.
3. Identity targeting is exact and live-confirmed, including `tenant_slug` rather than nonexistent `tenant_code`.
4. Family, evidence, timetable, submissions, comments, report cards, reminders, expenses, conversations, report requests, and controlled file/document projections support deep routes.
5. External-effect states are visibly blocked rather than falsely successful.

## Review blockers before any execution

- Confirm that creating `sanila_demo_fixture_registry` through the seed package is acceptable, or move that DDL into a reviewed forward migration.
- Review the legacy `sanila_verify_master_demo` version check. Living School V1 preserves its structural result but necessarily replaces the seed label afterward; a future migration should make the verifier accept an explicit version argument.
- Review every supplemental status value against the live database’s latest check constraints. The static schema snapshot supports them, but no SQL preflight was run by instruction.
- Confirm the 17,714 registry count from source before approving reset. Reset refuses any other count.
- Decide whether specialist operation-history queues should remain intentional zero-states or receive additional synthetic action history.
- Perform security/RLS review for the new registry and functions, including ownership and `search_path` behavior.
- Review performance of 17,714 row-by-row adaptive upserts before manual application.

## Required human gates

1. Diff review by schema owner.
2. Security/RLS review.
3. Product owner review of the 195-route matrix and zero-state choices.
4. DBA review of constraints, FK ordering, transaction size, and registry DDL placement.
5. Only after approval: apply to an isolated clone, run validation, inspect row deltas, run reset twice, prove idempotency, then separately decide whether production-project execution is authorized.

## Current disposition

The source package is complete for human review but deliberately uncertified at runtime. No execution authorization is implied.
