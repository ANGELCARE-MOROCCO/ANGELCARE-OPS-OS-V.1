# AC CAPITAL OS — Ultra AI-Operated Department Final 09

This is the cumulative institutional completion package built against the uploaded post-Workbench-08 AC CAPITAL OS authoritative source.

## Mission

Final 09 turns the existing AC CAPITAL OS workspaces into one governed capital lifecycle:

`public research → evidence → opportunity → qualification → proof → funding case → pipeline → approval → coordinator execution → submission proof → outcome → learning`

It preserves human authority for every external communication, application, bank action, investor action, publication, legal commitment, and financial commitment.

## Included operating layers

- Canonical lifecycle fields, optimistic record versions, archive/restore/merge, notes, assignments, saved views, notifications, command results and audit snapshots.
- Durable event queue, leases, stale-lock recovery, retries, dead-letter records, agent schedules and an hourly runtime endpoint.
- Real Tavily and OpenRouter agent execution for public research, funder intelligence, qualification underwriting, case architecture, proof intelligence, pipeline intelligence, coordinator mission planning, executive reporting and outcome learning.
- A strict external-provider privacy boundary that sanitizes confidential context and prevents raw Data Room files, credentials, banking details, IDs and storage references from being sent to free external providers.
- One canonical workflow graph joining source, opportunity, qualification, case, pipeline, approval, coordinator mission, submission proof and learning.
- Version-bound approvals and stage-gate evaluation.
- Institutional Registry with search, editable records, optimistic conflict prevention, notes, assignment, merge, archive, restore and version history.
- Artifact Factory producing real PDF, DOCX, XLSX, CSV, JSON and ZIP outputs with hashes, versions, output references and approval-bound immutable snapshots.
- Executive Orchestrator with workflow, event, agent, schedule, approval, integrity, notification, dead-letter, doctrine and execution-evidence control.
- OpenRouter-only AC Capital AI Command runtime. The active AC Capital command route no longer calls Gemini or reports a fake dry-run success.
- Body-level AC Capital overlays preserved with the shared AngelCare overhead offset and GPU-safe rendering.

## New protected routes

- `/ac-capital-os/orchestrator`
- `/ac-capital-os/registry`
- `/ac-capital-os/artifacts`
- Existing `/ac-capital-os/reports` receives real artifact export controls.
- Existing `/ac-capital-os/ai-command` receives governed OpenRouter execution.

## Runtime endpoint

`/api/ac-capital-os/runtime/tick`

- `GET` accepts the platform cron authorization when `CRON_SECRET` is configured.
- Authenticated internal users may also run the tick.
- `POST` is authenticated.
- The runtime holds a database lease so concurrent workers do not process the same queue.
- Vercel cron is included at minute 5 of every hour.

## Installation boundary

The installer only copies files and creates timestamped backups. It does **not** run TypeScript, a build, SQL, Git, provider calls, a commit, push or deployment.

Apply the SQL migration separately, restart the app separately, then complete the live acceptance checklist.

## Truth boundary

The package has been statically and structurally verified against the supplied authoritative source. It has not been deployed to the user's database or exercised against live Tavily/OpenRouter credentials from the packaging environment. Production acceptance remains the post-install browser/database/provider scenario test in `reports/LIVE_ACCEPTANCE_CHECKLIST.md`.
