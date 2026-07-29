# Revenue Command Center — Phase 12 API Inventory

Generated: 2026-07-27T19:37:19.381Z

API routes discovered: **243**

| # | API | Methods | Static status | File |
|---:|---|---|---|---|
| 1 | `/api/revenue-command-center/accounts` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/accounts/route.ts` |
| 2 | `/api/revenue-command-center/actions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/actions/route.ts` |
| 3 | `/api/revenue-command-center/activity` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/activity/route.ts` |
| 4 | `/api/revenue-command-center/analytics` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/analytics/route.ts` |
| 5 | `/api/revenue-command-center/appointments/command` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/appointments/command/route.ts` |
| 6 | `/api/revenue-command-center/appointments` | GET, POST, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/appointments/route.ts` |
| 7 | `/api/revenue-command-center/automation/run` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/automation/run/route.ts` |
| 8 | `/api/revenue-command-center/b2c-enterprise/activation/authorize` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/activation/authorize/route.ts` |
| 9 | `/api/revenue-command-center/b2c-enterprise/activation/evaluate` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/activation/evaluate/route.ts` |
| 10 | `/api/revenue-command-center/b2c-enterprise/beneficiaries` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/beneficiaries/route.ts` |
| 11 | `/api/revenue-command-center/b2c-enterprise/care-start` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/care-start/route.ts` |
| 12 | `/api/revenue-command-center/b2c-enterprise/cases/[id]` | GET, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/cases/[id]/route.ts` |
| 13 | `/api/revenue-command-center/b2c-enterprise/cases` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/cases/route.ts` |
| 14 | `/api/revenue-command-center/b2c-enterprise/closure` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/closure/route.ts` |
| 15 | `/api/revenue-command-center/b2c-enterprise/complaints` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/complaints/route.ts` |
| 16 | `/api/revenue-command-center/b2c-enterprise/consultations` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/consultations/route.ts` |
| 17 | `/api/revenue-command-center/b2c-enterprise/emergency-contacts` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/emergency-contacts/route.ts` |
| 18 | `/api/revenue-command-center/b2c-enterprise/evidence` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/evidence/route.ts` |
| 19 | `/api/revenue-command-center/b2c-enterprise/guardians` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/guardians/route.ts` |
| 20 | `/api/revenue-command-center/b2c-enterprise/handoff` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/handoff/route.ts` |
| 21 | `/api/revenue-command-center/b2c-enterprise/instructions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/instructions/route.ts` |
| 22 | `/api/revenue-command-center/b2c-enterprise/matching/candidates` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/matching/candidates/route.ts` |
| 23 | `/api/revenue-command-center/b2c-enterprise/matching/cycles` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/matching/cycles/route.ts` |
| 24 | `/api/revenue-command-center/b2c-enterprise/matching/decision` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/matching/decision/route.ts` |
| 25 | `/api/revenue-command-center/b2c-enterprise/needs-assessments` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/needs-assessments/route.ts` |
| 26 | `/api/revenue-command-center/b2c-enterprise/onboarding/items` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/onboarding/items/route.ts` |
| 27 | `/api/revenue-command-center/b2c-enterprise/onboarding/plans` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/onboarding/plans/route.ts` |
| 28 | `/api/revenue-command-center/b2c-enterprise/portfolio` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/portfolio/route.ts` |
| 29 | `/api/revenue-command-center/b2c-enterprise/recommendations` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/recommendations/route.ts` |
| 30 | `/api/revenue-command-center/b2c-enterprise/recovery/checkpoints` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/recovery/checkpoints/route.ts` |
| 31 | `/api/revenue-command-center/b2c-enterprise/recovery/plans` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/recovery/plans/route.ts` |
| 32 | `/api/revenue-command-center/b2c-enterprise/renewal` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/renewal/route.ts` |
| 33 | `/api/revenue-command-center/b2c-enterprise/requirements` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/requirements/route.ts` |
| 34 | `/api/revenue-command-center/b2c-enterprise/retention/plans` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/retention/plans/route.ts` |
| 35 | `/api/revenue-command-center/b2c-enterprise/retention/risks` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/retention/risks/route.ts` |
| 36 | `/api/revenue-command-center/b2c-enterprise/satisfaction` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/satisfaction/route.ts` |
| 37 | `/api/revenue-command-center/b2c-enterprise/transition` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c-enterprise/transition/route.ts` |
| 38 | `/api/revenue-command-center/b2c` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/b2c/route.ts` |
| 39 | `/api/revenue-command-center/campaign-enterprise/approvals` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/approvals/route.ts` |
| 40 | `/api/revenue-command-center/campaign-enterprise/attribution` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/attribution/route.ts` |
| 41 | `/api/revenue-command-center/campaign-enterprise/audience` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/audience/route.ts` |
| 42 | `/api/revenue-command-center/campaign-enterprise/calls` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/calls/route.ts` |
| 43 | `/api/revenue-command-center/campaign-enterprise/campaigns` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/campaigns/route.ts` |
| 44 | `/api/revenue-command-center/campaign-enterprise/conflicts` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/conflicts/route.ts` |
| 45 | `/api/revenue-command-center/campaign-enterprise/conversions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/conversions/route.ts` |
| 46 | `/api/revenue-command-center/campaign-enterprise/costs` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/costs/route.ts` |
| 47 | `/api/revenue-command-center/campaign-enterprise/dispatch` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/dispatch/route.ts` |
| 48 | `/api/revenue-command-center/campaign-enterprise/eligibility` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/eligibility/route.ts` |
| 49 | `/api/revenue-command-center/campaign-enterprise/enrollments` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/enrollments/route.ts` |
| 50 | `/api/revenue-command-center/campaign-enterprise/evidence` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/evidence/route.ts` |
| 51 | `/api/revenue-command-center/campaign-enterprise/experiments` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/experiments/route.ts` |
| 52 | `/api/revenue-command-center/campaign-enterprise/launch` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/launch/route.ts` |
| 53 | `/api/revenue-command-center/campaign-enterprise/lifecycle` | PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/lifecycle/route.ts` |
| 54 | `/api/revenue-command-center/campaign-enterprise/performance` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/performance/route.ts` |
| 55 | `/api/revenue-command-center/campaign-enterprise/portfolio` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/portfolio/route.ts` |
| 56 | `/api/revenue-command-center/campaign-enterprise/provider-events` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/provider-events/route.ts` |
| 57 | `/api/revenue-command-center/campaign-enterprise/readiness` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/readiness/route.ts` |
| 58 | `/api/revenue-command-center/campaign-enterprise/recovery` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/recovery/route.ts` |
| 59 | `/api/revenue-command-center/campaign-enterprise/replies` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/replies/route.ts` |
| 60 | `/api/revenue-command-center/campaign-enterprise/segments` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/segments/route.ts` |
| 61 | `/api/revenue-command-center/campaign-enterprise/sequences` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/sequences/route.ts` |
| 62 | `/api/revenue-command-center/campaign-enterprise/suppressions` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/suppressions/route.ts` |
| 63 | `/api/revenue-command-center/campaign-enterprise/templates` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaign-enterprise/templates/route.ts` |
| 64 | `/api/revenue-command-center/campaigns` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/campaigns/route.ts` |
| 65 | `/api/revenue-command-center/central-core` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/central-core/route.ts` |
| 66 | `/api/revenue-command-center/contacts` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contacts/route.ts` |
| 67 | `/api/revenue-command-center/contract/activation/authorize` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/activation/authorize/route.ts` |
| 68 | `/api/revenue-command-center/contract/activation/evaluate` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/activation/evaluate/route.ts` |
| 69 | `/api/revenue-command-center/contract/collection-actions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/collection-actions/route.ts` |
| 70 | `/api/revenue-command-center/contract/commands` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/commands/route.ts` |
| 71 | `/api/revenue-command-center/contract/conditions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/conditions/route.ts` |
| 72 | `/api/revenue-command-center/contract/contracts/[id]` | GET, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/contracts/[id]/route.ts` |
| 73 | `/api/revenue-command-center/contract/contracts/[id]/transition` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/contracts/[id]/transition/route.ts` |
| 74 | `/api/revenue-command-center/contract/contracts` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/contracts/route.ts` |
| 75 | `/api/revenue-command-center/contract/effectiveness` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/effectiveness/route.ts` |
| 76 | `/api/revenue-command-center/contract/finance-handoffs` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/finance-handoffs/route.ts` |
| 77 | `/api/revenue-command-center/contract/milestones` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/milestones/route.ts` |
| 78 | `/api/revenue-command-center/contract/obligations` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/obligations/route.ts` |
| 79 | `/api/revenue-command-center/contract/operational-handoffs` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/operational-handoffs/route.ts` |
| 80 | `/api/revenue-command-center/contract/payment-confirmations` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/payment-confirmations/route.ts` |
| 81 | `/api/revenue-command-center/contract/payment-promises` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/payment-promises/route.ts` |
| 82 | `/api/revenue-command-center/contract/payment-schedules` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/payment-schedules/route.ts` |
| 83 | `/api/revenue-command-center/contract/payment-terms` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/payment-terms/route.ts` |
| 84 | `/api/revenue-command-center/contract/portfolio` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/portfolio/route.ts` |
| 85 | `/api/revenue-command-center/contract/realization` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/realization/route.ts` |
| 86 | `/api/revenue-command-center/contract/reviews` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/reviews/route.ts` |
| 87 | `/api/revenue-command-center/contract/risks` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/risks/route.ts` |
| 88 | `/api/revenue-command-center/contract/signatories` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/signatories/route.ts` |
| 89 | `/api/revenue-command-center/contract/signatures` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/signatures/route.ts` |
| 90 | `/api/revenue-command-center/contract/versions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/contract/versions/route.ts` |
| 91 | `/api/revenue-command-center/decision-maps` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/decision-maps/route.ts` |
| 92 | `/api/revenue-command-center/documents` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/documents/route.ts` |
| 93 | `/api/revenue-command-center/engagement/appointments/[id]` | GET, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/appointments/[id]/route.ts` |
| 94 | `/api/revenue-command-center/engagement/appointments/[id]/transition` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/appointments/[id]/transition/route.ts` |
| 95 | `/api/revenue-command-center/engagement/appointments` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/appointments/route.ts` |
| 96 | `/api/revenue-command-center/engagement/attendance` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/attendance/route.ts` |
| 97 | `/api/revenue-command-center/engagement/commitments` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/commitments/route.ts` |
| 98 | `/api/revenue-command-center/engagement/communications/delivery` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/communications/delivery/route.ts` |
| 99 | `/api/revenue-command-center/engagement/communications/events` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/communications/events/route.ts` |
| 100 | `/api/revenue-command-center/engagement/communications/threads` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/communications/threads/route.ts` |
| 101 | `/api/revenue-command-center/engagement/confirmations` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/confirmations/route.ts` |
| 102 | `/api/revenue-command-center/engagement/decisions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/decisions/route.ts` |
| 103 | `/api/revenue-command-center/engagement/follow-ups` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/follow-ups/route.ts` |
| 104 | `/api/revenue-command-center/engagement/no-shows` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/no-shows/route.ts` |
| 105 | `/api/revenue-command-center/engagement/notes` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/notes/route.ts` |
| 106 | `/api/revenue-command-center/engagement/objections` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/objections/route.ts` |
| 107 | `/api/revenue-command-center/engagement/outcomes` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/outcomes/route.ts` |
| 108 | `/api/revenue-command-center/engagement/participants` | POST, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/participants/route.ts` |
| 109 | `/api/revenue-command-center/engagement/portfolio` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/portfolio/route.ts` |
| 110 | `/api/revenue-command-center/engagement/preparation` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/preparation/route.ts` |
| 111 | `/api/revenue-command-center/engagement/recovery` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/engagement/recovery/route.ts` |
| 112 | `/api/revenue-command-center/enterprise` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/enterprise/route.ts` |
| 113 | `/api/revenue-command-center/escalations/run` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/escalations/run/route.ts` |
| 114 | `/api/revenue-command-center/execution/approvals` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/approvals/route.ts` |
| 115 | `/api/revenue-command-center/execution/assignments` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/assignments/route.ts` |
| 116 | `/api/revenue-command-center/execution/blockers` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/blockers/route.ts` |
| 117 | `/api/revenue-command-center/execution/bulk` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/bulk/route.ts` |
| 118 | `/api/revenue-command-center/execution/checklists` | POST, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/checklists/route.ts` |
| 119 | `/api/revenue-command-center/execution/comments` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/comments/route.ts` |
| 120 | `/api/revenue-command-center/execution/daily-desk` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/daily-desk/route.ts` |
| 121 | `/api/revenue-command-center/execution/dependencies` | POST, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/dependencies/route.ts` |
| 122 | `/api/revenue-command-center/execution/escalations` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/escalations/route.ts` |
| 123 | `/api/revenue-command-center/execution/evidence` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/evidence/route.ts` |
| 124 | `/api/revenue-command-center/execution/portfolio` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/portfolio/route.ts` |
| 125 | `/api/revenue-command-center/execution/tasks/[id]` | GET, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/tasks/[id]/route.ts` |
| 126 | `/api/revenue-command-center/execution/tasks/[id]/transition` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/tasks/[id]/transition/route.ts` |
| 127 | `/api/revenue-command-center/execution/tasks` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/tasks/route.ts` |
| 128 | `/api/revenue-command-center/execution/workload` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/execution/workload/route.ts` |
| 129 | `/api/revenue-command-center/executive-enterprise/audit` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/audit/route.ts` |
| 130 | `/api/revenue-command-center/executive-enterprise/briefings` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/briefings/route.ts` |
| 131 | `/api/revenue-command-center/executive-enterprise/collections` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/collections/route.ts` |
| 132 | `/api/revenue-command-center/executive-enterprise/commands` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/commands/route.ts` |
| 133 | `/api/revenue-command-center/executive-enterprise/data-quality` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/data-quality/route.ts` |
| 134 | `/api/revenue-command-center/executive-enterprise/forecast` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/forecast/route.ts` |
| 135 | `/api/revenue-command-center/executive-enterprise/interventions` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/interventions/route.ts` |
| 136 | `/api/revenue-command-center/executive-enterprise/portfolio` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/portfolio/route.ts` |
| 137 | `/api/revenue-command-center/executive-enterprise/scenarios` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/scenarios/route.ts` |
| 138 | `/api/revenue-command-center/executive-enterprise/signals` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/executive-enterprise/signals/route.ts` |
| 139 | `/api/revenue-command-center/follow-ups` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/follow-ups/route.ts` |
| 140 | `/api/revenue-command-center/max/action` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/max/action/route.ts` |
| 141 | `/api/revenue-command-center/max/pulse` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/max/pulse/route.ts` |
| 142 | `/api/revenue-command-center/max/records` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/max/records/route.ts` |
| 143 | `/api/revenue-command-center/notifications` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/notifications/route.ts` |
| 144 | `/api/revenue-command-center/opportunities` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/opportunities/route.ts` |
| 145 | `/api/revenue-command-center/opportunities/transition` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/opportunities/transition/route.ts` |
| 146 | `/api/revenue-command-center/ops` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/ops/route.ts` |
| 147 | `/api/revenue-command-center/partnership-programs` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership-programs/route.ts` |
| 148 | `/api/revenue-command-center/partnership/activation/evaluate` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/activation/evaluate/route.ts` |
| 149 | `/api/revenue-command-center/partnership/benefits` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/benefits/route.ts` |
| 150 | `/api/revenue-command-center/partnership/closure` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/closure/route.ts` |
| 151 | `/api/revenue-command-center/partnership/expansion` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/expansion/route.ts` |
| 152 | `/api/revenue-command-center/partnership/milestones` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/milestones/route.ts` |
| 153 | `/api/revenue-command-center/partnership/obligations` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/obligations/route.ts` |
| 154 | `/api/revenue-command-center/partnership/partnerships/[id]` | GET, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/partnerships/[id]/route.ts` |
| 155 | `/api/revenue-command-center/partnership/partnerships` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/partnerships/route.ts` |
| 156 | `/api/revenue-command-center/partnership/performance/close` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/performance/close/route.ts` |
| 157 | `/api/revenue-command-center/partnership/performance/periods` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/performance/periods/route.ts` |
| 158 | `/api/revenue-command-center/partnership/portfolio` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/portfolio/route.ts` |
| 159 | `/api/revenue-command-center/partnership/programs` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/programs/route.ts` |
| 160 | `/api/revenue-command-center/partnership/qualification` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/qualification/route.ts` |
| 161 | `/api/revenue-command-center/partnership/recovery` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/recovery/route.ts` |
| 162 | `/api/revenue-command-center/partnership/referrals/[id]` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/referrals/[id]/route.ts` |
| 163 | `/api/revenue-command-center/partnership/referrals/accept` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/referrals/accept/route.ts` |
| 164 | `/api/revenue-command-center/partnership/referrals/attribution` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/referrals/attribution/route.ts` |
| 165 | `/api/revenue-command-center/partnership/referrals/conflicts` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/referrals/conflicts/route.ts` |
| 166 | `/api/revenue-command-center/partnership/referrals` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/referrals/route.ts` |
| 167 | `/api/revenue-command-center/partnership/renewal` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/renewal/route.ts` |
| 168 | `/api/revenue-command-center/partnership/reviews` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/reviews/route.ts` |
| 169 | `/api/revenue-command-center/partnership/risks` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/risks/route.ts` |
| 170 | `/api/revenue-command-center/partnership/stakeholders` | POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/stakeholders/route.ts` |
| 171 | `/api/revenue-command-center/partnership/transition` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnership/transition/route.ts` |
| 172 | `/api/revenue-command-center/partnerships/enterprise` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnerships/enterprise/route.ts` |
| 173 | `/api/revenue-command-center/partnerships` | GET, POST, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnerships/route.ts` |
| 174 | `/api/revenue-command-center/partnerships/v13` | GET, POST, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/partnerships/v13/route.ts` |
| 175 | `/api/revenue-command-center/proposal/approvals` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/approvals/route.ts` |
| 176 | `/api/revenue-command-center/proposal/commands` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/commands/route.ts` |
| 177 | `/api/revenue-command-center/proposal/concessions/[id]` | PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/concessions/[id]/route.ts` |
| 178 | `/api/revenue-command-center/proposal/concessions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/concessions/route.ts` |
| 179 | `/api/revenue-command-center/proposal/counteroffers` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/counteroffers/route.ts` |
| 180 | `/api/revenue-command-center/proposal/decisions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/decisions/route.ts` |
| 181 | `/api/revenue-command-center/proposal/delivery-events` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/delivery-events/route.ts` |
| 182 | `/api/revenue-command-center/proposal/discounts` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/discounts/route.ts` |
| 183 | `/api/revenue-command-center/proposal/documents` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/documents/route.ts` |
| 184 | `/api/revenue-command-center/proposal/lines/[id]` | PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/lines/[id]/route.ts` |
| 185 | `/api/revenue-command-center/proposal/lines` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/lines/route.ts` |
| 186 | `/api/revenue-command-center/proposal/margin-exceptions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/margin-exceptions/route.ts` |
| 187 | `/api/revenue-command-center/proposal/negotiations/[id]` | GET, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/negotiations/[id]/route.ts` |
| 188 | `/api/revenue-command-center/proposal/negotiations` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/negotiations/route.ts` |
| 189 | `/api/revenue-command-center/proposal/objections/[id]` | PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/objections/[id]/route.ts` |
| 190 | `/api/revenue-command-center/proposal/objections` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/objections/route.ts` |
| 191 | `/api/revenue-command-center/proposal/outcome` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/outcome/route.ts` |
| 192 | `/api/revenue-command-center/proposal/portfolio` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/portfolio/route.ts` |
| 193 | `/api/revenue-command-center/proposal/pricing/preview` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/pricing/preview/route.ts` |
| 194 | `/api/revenue-command-center/proposal/pricing` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/pricing/route.ts` |
| 195 | `/api/revenue-command-center/proposal/proposals/[id]` | GET, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/proposals/[id]/route.ts` |
| 196 | `/api/revenue-command-center/proposal/proposals/[id]/transition` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/proposals/[id]/transition/route.ts` |
| 197 | `/api/revenue-command-center/proposal/proposals` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/proposals/route.ts` |
| 198 | `/api/revenue-command-center/proposal/responses` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/responses/route.ts` |
| 199 | `/api/revenue-command-center/proposal/sections/[id]` | PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/sections/[id]/route.ts` |
| 200 | `/api/revenue-command-center/proposal/sections` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/sections/route.ts` |
| 201 | `/api/revenue-command-center/proposal/transmissions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/transmissions/route.ts` |
| 202 | `/api/revenue-command-center/proposal/versions/compare` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/versions/compare/route.ts` |
| 203 | `/api/revenue-command-center/proposal/versions` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/proposal/versions/route.ts` |
| 204 | `/api/revenue-command-center/prospects/[id]/decision-map` | POST, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/[id]/decision-map/route.ts` |
| 205 | `/api/revenue-command-center/prospects/[id]/qualification` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/[id]/qualification/route.ts` |
| 206 | `/api/revenue-command-center/prospects/[id]/risks` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/[id]/risks/route.ts` |
| 207 | `/api/revenue-command-center/prospects/[id]` | GET, PATCH | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/[id]/route.ts` |
| 208 | `/api/revenue-command-center/prospects/ensure` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/ensure/route.ts` |
| 209 | `/api/revenue-command-center/prospects/enterprise/create` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/enterprise/create/route.ts` |
| 210 | `/api/revenue-command-center/prospects/enterprise` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/enterprise/route.ts` |
| 211 | `/api/revenue-command-center/prospects/options` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/options/route.ts` |
| 212 | `/api/revenue-command-center/prospects/production-sync` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/production-sync/route.ts` |
| 213 | `/api/revenue-command-center/prospects` | GET, POST, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/prospects/route.ts` |
| 214 | `/api/revenue-command-center/recovery/import` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/recovery/import/route.ts` |
| 215 | `/api/revenue-command-center/recovery/raw` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/recovery/raw/route.ts` |
| 216 | `/api/revenue-command-center/recovery/status` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/recovery/status/route.ts` |
| 217 | `/api/revenue-command-center/sidebar` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/sidebar/route.ts` |
| 218 | `/api/revenue-command-center/tasks/command` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/tasks/command/route.ts` |
| 219 | `/api/revenue-command-center/tasks` | GET, POST, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/tasks/route.ts` |
| 220 | `/api/revenue-command-center/v10/action` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v10/action/route.ts` |
| 221 | `/api/revenue-command-center/v10/bulk` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v10/bulk/route.ts` |
| 222 | `/api/revenue-command-center/v10/pulse` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v10/pulse/route.ts` |
| 223 | `/api/revenue-command-center/v10/records` | GET, POST, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v10/records/route.ts` |
| 224 | `/api/revenue-command-center/v10/seed` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v10/seed/route.ts` |
| 225 | `/api/revenue-command-center/v11/action` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v11/action/route.ts` |
| 226 | `/api/revenue-command-center/v11/bulk` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v11/bulk/route.ts` |
| 227 | `/api/revenue-command-center/v11/pulse` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v11/pulse/route.ts` |
| 228 | `/api/revenue-command-center/v11/records` | GET, POST, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v11/records/route.ts` |
| 229 | `/api/revenue-command-center/v11/seed` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v11/seed/route.ts` |
| 230 | `/api/revenue-command-center/v12/approvals` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v12/approvals/route.ts` |
| 231 | `/api/revenue-command-center/v12/bulk` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v12/bulk/route.ts` |
| 232 | `/api/revenue-command-center/v12/chains` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v12/chains/route.ts` |
| 233 | `/api/revenue-command-center/v12/pulse` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v12/pulse/route.ts` |
| 234 | `/api/revenue-command-center/v12/records` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v12/records/route.ts` |
| 235 | `/api/revenue-command-center/v12/seed` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v12/seed/route.ts` |
| 236 | `/api/revenue-command-center/v12/sla` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v12/sla/route.ts` |
| 237 | `/api/revenue-command-center/v12/timeline` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v12/timeline/route.ts` |
| 238 | `/api/revenue-command-center/v9/action` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v9/action/route.ts` |
| 239 | `/api/revenue-command-center/v9/bulk` | POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v9/bulk/route.ts` |
| 240 | `/api/revenue-command-center/v9/dashboards` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v9/dashboards/route.ts` |
| 241 | `/api/revenue-command-center/v9/pulse` | GET | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v9/pulse/route.ts` |
| 242 | `/api/revenue-command-center/v9/records` | GET, POST, PATCH, DELETE | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v9/records/route.ts` |
| 243 | `/api/revenue-command-center/v9/workflows` | GET, POST | STATIC_ACCEPTED_RUNTIME_REQUIRED | `app/api/revenue-command-center/v9/workflows/route.ts` |
