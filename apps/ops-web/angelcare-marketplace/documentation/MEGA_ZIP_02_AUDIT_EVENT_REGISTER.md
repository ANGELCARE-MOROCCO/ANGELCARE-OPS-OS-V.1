# ANGELCARE BUILD 360 — Mega ZIP 02

**Contract:** Territory OS Core & Global Expansion Layer  
**Build root:** `apps/ops-web/angelcare-marketplace`  
**Cumulative baseline:** Mega ZIP 01  
**Execution boundary:** No build, Git action, deployment or database migration is performed by the delivery package.

## Sensitive audit events

`territory.created`, `territory.updated`, `territory.cloned`, lifecycle transitions, setting changes, override submitted/approved/rejected/rolled_back, launch-check changes/failures, readiness validation, launch sign-off, health-event creation, export and scope denial.

Audit records use the Mega ZIP 01 envelope: request, actor, role, action, object, territory scope, before/after where appropriate, reason, result, severity and timestamp. Credentials and unnecessary family/child data are excluded.
