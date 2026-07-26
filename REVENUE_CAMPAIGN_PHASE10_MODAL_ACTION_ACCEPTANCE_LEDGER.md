# Revenue Campaign Phase 10 — Governed Experience Ledger

**Governed commands:** 40

| # | Command |
|---:|---|
| 1 | `create-campaign` |
| 2 | `edit-campaign` |
| 3 | `transition-campaign` |
| 4 | `create-segment` |
| 5 | `freeze-audience` |
| 6 | `evaluate-eligibility` |
| 7 | `suppress-recipient` |
| 8 | `remove-suppression` |
| 9 | `create-sequence` |
| 10 | `add-sequence-step` |
| 11 | `approve-sequence` |
| 12 | `create-template` |
| 13 | `approve-template` |
| 14 | `record-provider-readiness` |
| 15 | `record-sender-readiness` |
| 16 | `evaluate-readiness` |
| 17 | `request-approval` |
| 18 | `decide-approval` |
| 19 | `launch-campaign` |
| 20 | `pause-campaign` |
| 21 | `resume-campaign` |
| 22 | `emergency-stop` |
| 23 | `enroll-recipient` |
| 24 | `remove-recipient` |
| 25 | `dispatch-step` |
| 26 | `record-provider-event` |
| 27 | `record-reply` |
| 28 | `record-call-outcome` |
| 29 | `create-meeting-conversion` |
| 30 | `create-opportunity-conversion` |
| 31 | `create-attribution` |
| 32 | `raise-attribution-conflict` |
| 33 | `resolve-attribution-conflict` |
| 34 | `record-cost` |
| 35 | `create-performance-period` |
| 36 | `close-performance-period` |
| 37 | `create-experiment` |
| 38 | `create-recovery-plan` |
| 39 | `complete-recovery-checkpoint` |
| 40 | `record-evidence` |

Every command is represented by a dedicated modal or full-page command surface, validates required fields, maps to a protected endpoint and produces persistent server-side effects or a truthful failure. Complex strategy, sequence, live execution, attribution and SDR work remain full-page experiences.
