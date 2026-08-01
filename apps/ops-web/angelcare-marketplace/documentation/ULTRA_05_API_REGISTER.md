# ANGELCARE BUILD 360 — Ultra Delivery 5/5

**Final consolidated delivery:** Original Mega ZIP 19 + Original Mega ZIP 20  
**Build root:** `angelcare-platform/apps/ops-web/angelcare-marketplace`  
**French is the canonical source language.**  

## API domains

- `/api/angelcare-marketplace/trust/*`: summary, SOPs, evidence, assessments, complaints, CAPA, sensitive reviews and governed transitions.
- `/finance/*`: summary, price books/rules, revenue streams, margin exceptions, invoice readiness and reconciliation.
- `/analytics/*`: summary, definitions, snapshots, refresh and data quality.
- `/security/*`: summary, access reviews, isolation tests, security events, retention, backup and recovery tests.
- `/qa/*`: summary, suites, runs, results, defects and transitions.
- `/launch/*`: summary, gates, evidence, approvals, releases, runbooks, post-launch and transitions.

All mutations resolve canonical request context, require a canonical permission, return the standard API envelope and write audit evidence.
