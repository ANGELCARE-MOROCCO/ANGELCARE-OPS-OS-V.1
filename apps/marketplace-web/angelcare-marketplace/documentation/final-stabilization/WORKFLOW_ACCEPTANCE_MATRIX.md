# ANGELCARE Marketplace — Workflow Acceptance Matrix

| Workflow | Required canonical outcome | Required negative tests |
| --- | --- | --- |
| Product purchase | Canonical order/handover, real price and stock | expired price, unavailable stock, duplicate confirmation |
| Family booking | Family request/booking and journey | wrong family, unavailable territory, missing consent |
| Recurring service | governed schedule and operational handover | conflicting schedule, ineligible provider/capacity |
| Academy enrollment | canonical cohort enrollment/request | full cohort, missing prerequisite, duplicate learner |
| B2B quotation | CRM lead/opportunity/proposal handover | wrong organization, incomplete scope, expired quotation |
| Partner OS subscription | canonical tenant/onboarding request | tenant leakage, invalid plan/module combination |
| Quality assessment | canonical assessment request | unsupported scope, missing evidence readiness |
| Journey materialization | one journey per conversion outcome | duplicate journey, unauthorized customer access |
| Fulfillment | obligation, evidence and quality validation | completion without evidence, territory mismatch |
| Return/replacement | policy-governed case | ineligible case, completed financial closure |
| Dispute/recovery | evidence-led case and remedy | unauthorized evidence, fake refund approval |
| Reconciliation | Finance handover with line evidence | mismatched payable, unapproved adjustment |
| Launch decision | evidence-backed governed decision | missing gate, unresolved critical defect, single-person SoD breach |

Each positive and negative test must capture request reference, actor, expected result, actual result, evidence and defect reference when failed.
