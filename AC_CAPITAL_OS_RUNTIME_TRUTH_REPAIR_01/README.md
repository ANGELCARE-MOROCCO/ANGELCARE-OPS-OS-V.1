# AC CAPITAL OS — Runtime Truth Repair 01

This package corrects the four installed runtime defects together:

1. Shared overlays are body-portaled and offset below the AngelCare operations overhead.
2. MZ16 operational zones receive deterministic unique DOM IDs and defensive React keys.
3. Capital Radar performs a governed Gemini call with the Google Search tool, validates grounding metadata, persists sources and review-only opportunities, records rejected/duplicate candidates, and stores provider request, token and estimated-cost evidence.
4. Executive reports are composed by governed Gemini from controlled AC CAPITAL OS records, rejected when the returned body is not substantive, persisted with complete sections and provider trace, given a non-null output reference, and kept behind human approval.

## Install

Place this folder at the AngelCare repository root, then run from that repository root:

```bash
node ./AC_CAPITAL_OS_RUNTIME_TRUTH_REPAIR_01/scripts/apply_ac_capital_os_runtime_truth_repair_01.mjs
node ./AC_CAPITAL_OS_RUNTIME_TRUTH_REPAIR_01/scripts/verify_ac_capital_os_runtime_truth_repair_01.mjs
```

The installer creates a timestamped backup in `.angelcare_backups/`.

## Required database activation

The installer copies but does not execute:

```text
supabase/migrations/20260728_ac_capital_os_runtime_truth_repair_01.sql
```

Apply that migration through your normal Supabase migration process before pressing the live Radar or report buttons. It activates a conservative grounded-request allowance, authorizes `grounded_research` and `structured_content`, registers routes/policies, and adds the runtime evidence columns/tables.

Optional database verification when `psql` and `SUPABASE_DB_URL` are available:

```bash
node ./AC_CAPITAL_OS_RUNTIME_TRUTH_REPAIR_01/scripts/verify_ac_capital_os_runtime_truth_repair_01_db.mjs
```

## Environment gates

These must remain explicitly enabled in the deployed runtime:

```text
AC_CAPITAL_AI_ALLOW_LIVE_RUNS=true
AC_CAPITAL_AI_ALLOW_RESEARCH=true
```

The report composer needs `AC_CAPITAL_AI_ALLOW_LIVE_RUNS=true`; the Radar additionally requires `AC_CAPITAL_AI_ALLOW_RESEARCH=true`.

## Deliberate safety boundary

This repair does not enable autonomous qualification, outreach, submission, financial commitment or external release. New Radar records enter `source-review` / `needs-human-confirmation`. Generated reports enter `AI Draft — Human Review`.

## Verification truth

The included static verifier checks source contracts and TypeScript/TSX syntax. It does not claim that a live Gemini request or database migration was executed. Live acceptance requires applying the SQL and testing inside the configured AngelCare deployment.
