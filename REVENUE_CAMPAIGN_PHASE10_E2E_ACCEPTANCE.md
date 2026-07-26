# Revenue Campaign Phase 10 — Authenticated E2E Acceptance

Use controlled internal test recipients only.

1. Create a campaign with objective, audience, owner, budget, frequency and attribution policy.
2. Create a reusable segment.
3. Freeze an audience using explicit member JSON. Confirm per-member eligibility, suppression and frequency results.
4. Create a sequence and draft email, WhatsApp, call and wait/manual steps.
5. Create and approve the required templates.
6. Approve the sequence and verify that the approved version/steps cannot be edited.
7. Record provider and sender readiness from real configuration evidence.
8. Request and approve campaign launch.
9. Evaluate readiness; every mandatory gate must pass.
10. Launch. Confirm eligible audience members are enrolled idempotently and initial step executions are scheduled.
11. Dispatch one controlled step. Confirm one canonical communication thread/event and one dispatch attempt.
12. Replay the same idempotency key. Confirm no duplicate provider dispatch.
13. Record a real provider event. Confirm provider accepted/delivered/replied states remain distinct.
14. Record a positive reply. Confirm remaining sequence actions pause and an SDR task is created.
15. Record an opt-out on another test recipient. Confirm future steps are cancelled and suppression blocks re-enrollment.
16. Create a canonical meeting and opportunity from the recipient workbench.
17. Continue through proposal, contract, payment and revenue realization using the existing v6-v7 systems.
18. Create campaign attribution with evidence. Confirm allocation cannot exceed 100% across campaign and partner sources.
19. Record estimated and confirmed campaign costs separately.
20. Close a performance period and confirm the scorecard is immutable.
21. Reverse a test realization only in a controlled environment and confirm campaign attribution is reversed.
22. Verify audit history, RLS, direct authenticated-write denial and rollback readiness.
23. Run `npm run revenue-command-center:phase10:release`; deployment is authorized only after build proof is created.
