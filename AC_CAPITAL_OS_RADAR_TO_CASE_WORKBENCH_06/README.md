# AC CAPITAL OS · Radar-to-Case Conversion Workbench 06

This package is cumulative over the installed AC CAPITAL OS Runtime Truth Repair and Free Provider Operations foundation.

It converts Capital Radar from a passive evidence list into the controlled operational gateway:

`Tavily evidence → OpenRouter analysis → validation → evidence cluster → canonical opportunity → qualification dossier → funding case → capital pipeline → coordinator missions → founder-controlled external action`

## Delivered runtime

- Clickable evidence cards and full evidence inspection drawers.
- Source validation, rejection, secondary-evidence and archive decisions.
- Bulk validation and controlled duplicate clustering.
- Canonical opportunity creation or source attachment.
- Candidate, watchlist, rejected, deadline and audit views.
- Explainable preliminary qualification criteria and proof gaps.
- One-click qualification, case, pipeline and human-mission handoffs.
- Canonical links back to the built-in Qualification, Case Factory, Pipeline and Coordinator workspaces.
- Conversion events, reviews, notes, deeper-research missions and complete traceability.
- Tavily/OpenRouter structured persistence with response healing and JSON recovery.
- External communication, application and submission remain locked.

## Installation boundary

The installer only copies files and makes a backup. It does not run TypeScript, build, SQL, Git, provider requests or deployment.

From the AngelCare repository root:

```bash
node ./AC_CAPITAL_OS_RADAR_TO_CASE_WORKBENCH_06/scripts/apply_ac_capital_radar_to_case_workbench_06.mjs
```

Apply the database migration separately:

```bash
psql "$SUPABASE_DB_URL" \
  -X \
  -v ON_ERROR_STOP=1 \
  -f ./supabase/migrations/20260729_ac_capital_os_radar_to_case_workbench_06.sql
```

Optional static verification, separately:

```bash
node ./AC_CAPITAL_OS_RADAR_TO_CASE_WORKBENCH_06/scripts/verify_ac_capital_radar_to_case_workbench_06.mjs
```

Restart the local development server separately, then open:

```text
http://localhost:3000/ac-capital-os/radar
```

## First controlled conversion

1. Open a source in Validation Queue.
2. Validate it or mark it as secondary evidence.
3. Create a canonical opportunity or attach it to an existing one.
4. Open the opportunity dossier.
5. Select `Materialize full chain`.
6. Inspect the connected Qualification, Funding Case, Pipeline and Coordinator records.

No external communication or submission is executed by this package.
