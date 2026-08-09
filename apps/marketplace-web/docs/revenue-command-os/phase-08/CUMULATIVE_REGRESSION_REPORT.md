# MZ08 Cumulative Regression Report

## Passed in the focused cumulative MZ07→MZ08 package

- MZ04 static acceptance: 328 passed, 0 failed.
- MZ05 static acceptance: 171 passed, 0 failed.
- MZ05 command/adversarial corpus: 70,000 cases, 0 failed.
- MZ06 static acceptance: 5,143 passed, 0 failed.
- MZ06 Golden 300 corpus: 33,600 cases, 0 failed.
- MZ07 static acceptance: 9,855 passed, 0 failed.
- MZ07 command corpus: 117,500 cases, 0 failed.
- MZ08 static acceptance: 30,006 passed, 0 failed.
- MZ08 command corpus: 290,000 cases, 0 failed.
- Total cumulative command/evaluation cases executed: 511,100.
- Total static checks MZ04–MZ08: 45,503 passed, 0 failed.
- Targeted MZ08 TypeScript: PASS, 0 diagnostics.
- MZ08 UI/API syntax transpile: PASS, 5 files, 0 errors.
- MZ08 SQL structural/idempotency review: 10/10 passed.
- Installer simulation: PASS.
- Application rollback hash restoration: PASS, 339/339 baseline files restored exactly.

## Complete-monorepo boundary

The focused cumulative handoff does not include the unrelated shared file `apps/ops-web/lib/auth/permissions.ts`, which the original MZ01–MZ03 verification scripts inspect. Those three scripts were not weakened or falsely marked as passed here. The live surgical installer retains and runs the original MZ01–MZ08 verification chain against the user's complete monorepo and aborts if any phase fails.

No production build, database migration, Git stage, or Git commit was performed.
