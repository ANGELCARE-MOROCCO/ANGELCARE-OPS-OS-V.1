# Phase 8 Release Gate Status

## Offline artifact environment

- Static cumulative acceptance: passed.
- Phase 8 verifier: 542 checks passed.
- Isolated TypeScript gate: passed.
- CSS Module purity scan: passed.
- Exact Next.js production build: **not executed successfully here** because dependency installation did not complete and the container Node version is below one dependency’s minimum.

## Mandatory user-side gate

From `apps/ops-web`, using Node 22.17+ or Node 24:

```bash
npm ci
npm run revenue-command-center:phase8:release
```

Do not commit, push or deploy until the script prints `RELEASE GATE PASSED` and creates:

```text
artifacts/revenue-command-center-phase8-build-proof.json
```

This gate runs all cumulative Revenue verifiers, focused Phase 8 TypeScript, a CSS Module selector-purity scan and the exact Next.js webpack production build.
