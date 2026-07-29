# MZ15 Final Workflow Matrix

## End-to-end controlled lifecycle

1. **Signal** — create/import opportunity with source evidence.
2. **Source validation** — validate, flag weak, monitor, or reject.
3. **Qualification** — score fit and evidence; persist Pursue/Monitor/Reject/Needs Proof/Needs Founder Review.
4. **Funder intelligence** — link decision-makers, psychology, objections, narrative and relationship events.
5. **Strategy** — create scenarios and stress tests; simulation remains decision support.
6. **Case factory** — create case and separate narrative, financial, impact and risk sections.
7. **Evidence** — request missing proof, upload to private storage, classify and package.
8. **Approval** — create a founder approval request; persist approve/reject/revision.
9. **Coordinator execution** — create exact mission, prepare email, call, proof and completion steps.
10. **External action** — human executes manually; no automatic sensitive email or submission.
11. **Proof logging** — manual sent/submission status requires proof reference.
12. **Pipeline progression** — move stages, follow-up, due diligence, negotiation and outcome.
13. **Learning** — capture win/loss/objection/proof/process learning.
14. **Doctrine compounding** — convert approved learning into doctrine draft, then activate only through authority.

## State behavior contract

Every controlled mutation has validation, submitting, success, recoverable error, permission-denied, approval-required, and configuration-missing behavior through `useAction`, `ActionFeedback`, and API errors. No modal may close as a substitute for persistence.
