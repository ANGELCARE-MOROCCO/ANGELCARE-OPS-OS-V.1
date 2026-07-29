# AC CAPITAL OS — Institutional Completion & Certification 10 (IC10)

IC10 is a **surgical completion and evidence-based certification layer** for the currently installed post-Final-09 AC CAPITAL OS. It does not create a parallel capital product, does not replace Tavily/OpenRouter configuration, and does not declare the department certified merely because code exists.

## What IC10 adds

- A premium `/ac-capital-os/certification` command bridge covering 15 workspaces and eight mandatory live scenarios.
- Honest certification states: `CERTIFIED`, `PARTIALLY CERTIFIED`, `BLOCKED`, `FAILED`, `NOT TESTED`.
- Cross-workspace certification pulse inside the shared AC Capital shell.
- Atomic exact-version case approval requests, exact-version decisions and automatic supersession after material edits.
- Atomic, idempotent, exact-version-approved submission proof recording.
- Server-authoritative certification writes: browser roles receive read-only RLS access.
- Approved artifact immutability.
- Canonical lifecycle integrity audits and non-destructive reconciliation.
- Separate static, database, runtime, browser, artifact and static design-contract audit tools.

## Installation order

1. Extract the package into the repository root.
2. Run `node ./AC_CAPITAL_OS_INSTITUTIONAL_COMPLETION_AND_CERTIFICATION_10/scripts/apply-files-only.mjs`.
3. Apply both IC10 SQL files explicitly and separately.
4. Run the separate static verifier.
5. Restart the app.
6. Open `/ac-capital-os/certification` and conduct live certification.

The installer never runs SQL, TypeScript, a build, Git, provider calls, commit, push or deployment.

## Truth boundary

After installation and SQL verification, IC10 is **installed and structurally verified**. The platform becomes **100% CERTIFIED** only when every critical workspace gate and all eight live scenarios are persisted as `CERTIFIED`, with board sign-off successfully recorded.
