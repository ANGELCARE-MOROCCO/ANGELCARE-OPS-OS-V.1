# ANGELCARE BUILD 360 — Ultra Delivery 5/5

**Final consolidated delivery:** Original Mega ZIP 19 + Original Mega ZIP 20  
**Build root:** `angelcare-platform/apps/ops-web/angelcare-marketplace`  
**French is the canonical source language.**  

## Governed lifecycles

- SOP: draft → author/technical/compliance review → approval → publication/effectiveness → review/expiry/suspension/supersession/archive.
- QC360: requested → qualification/scheduling → execution/evidence/findings/report → correction/approval/publication/follow-up/closure.
- Complaint: received → acknowledgement/triage/assignment/investigation → response/resolution/appeal/reopen/closure.
- CAPA: finding → containment/root cause/action/evidence/effectiveness → effective/ineffective/reopen/closure.
- Price book: draft → finance/commercial review → approval/schedule/activation → supersession/suspension/expiry/archive.
- QA defect: report → triage/confirm/assign/fix/verify → close or reopen.
- Release: development → integration/system validation → release candidate/launch review → controlled release/monitoring/general release, with pause and rollback.

Invalid transitions are rejected in validation and sensitive transitions are also guarded by database functions.
