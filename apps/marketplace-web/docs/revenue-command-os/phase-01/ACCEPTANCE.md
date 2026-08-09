# Phase 1 Acceptance Gate

## Product containment

- [ ] `/revenue-command-os` loads behind authentication.
- [ ] `/revenue-command-center` remains unchanged and available.
- [ ] No legacy revenue table is renamed, removed or repurposed.

## UX

- [ ] Main cockpit is a strategy-to-execution control surface, not a money dashboard.
- [ ] Desktop and mobile navigation work.
- [ ] All twelve contracted workspaces open.
- [ ] `Cmd/Ctrl + K` opens global search.
- [ ] Objective composer opens, validates input and persists after migration.
- [ ] Loading, error and not-found states are visible and usable.

## Governance

- [ ] Mode is Shadow by default.
- [ ] External actions are disabled.
- [ ] Feature flags display their lock and risk class.
- [ ] New Revenue OS permissions are registered.
- [ ] Existing `revenue.view` users retain compatibility access.

## Database

- [ ] Migration completes without changing legacy tables.
- [ ] Ten Revenue OS tables are present.
- [ ] Seed workspaces, flags, statuses and objectives are present.
- [ ] Audit events cannot be updated or deleted.
- [ ] `anon` and `authenticated` have no direct table access.
- [ ] Service role can read and write through server APIs.

## Reliability

- [ ] Foundation bootstrap falls back cleanly before migration.
- [ ] API errors are structured and recoverable.
- [ ] Objective creation rejects insufficient input.
- [ ] Search returns workspace, objective, flag, audit and status matches.
- [ ] Static verification passes.
- [ ] TypeScript static check passes or any pre-existing unrelated errors are documented separately.
