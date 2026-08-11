# Social Command MZ9 Acceptance Matrices

## Functional

- Command palette opens with `⌘K`, `Ctrl+K` and `/` when not typing.
- Command palette lists publications, campaigns, media assets and conversations when present.
- Saved Views can be created, applied and deleted by the owning operator.
- Execution Queue cards open full execution dossiers.
- Future queued jobs use `Execute now`, not ambiguous `Run`.
- Confirming jobs communicate Meta processing and do not invite duplicate resend.
- Published jobs communicate provider success and disable resend semantics.

## Reliability

- Provider success is persisted before secondary finalization.
- Published provider success does not fall back to retrying because of attempt/audit/reconciliation warning.
- Stale publishing locks are reconciled against provider result evidence before retry.
- Instagram image containers move through confirming while Meta processing is incomplete.
- Instagram carousel parent publication waits for child readiness.

## Product experience

- Header/command model supports fast operator navigation.
- Publish states are visually and semantically distinct.
- Execution errors explain what failed and what is safe next.
- Empty states do not look unfinished or fabricated.
- Drawers begin below the command header.

## Production gate

- Targeted TypeScript passes.
- SQL precheck/migration/verify pass.
- Marketplace remains untouched.
- No environment values are packaged or modified.
- Vercel build succeeds after commit/push.
- Live Facebook + Instagram publishing regression remains healthy.
