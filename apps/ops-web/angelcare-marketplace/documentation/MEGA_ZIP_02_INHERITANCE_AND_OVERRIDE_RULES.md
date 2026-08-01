# ANGELCARE BUILD 360 — Mega ZIP 02

**Contract:** Territory OS Core & Global Expansion Layer  
**Build root:** `apps/ops-web/angelcare-marketplace`  
**Cumulative baseline:** Mega ZIP 01  
**Execution boundary:** No build, Git action, deployment or database migration is performed by the delivery package.

## Inheritance modes

`inherited_reference`, `inherited_snapshot`, `local_default`, `local_override`, `locked_global`.

A clone records its source territory and inheritance version. Settings carry source type, source ID/version, lock state and local-override eligibility. Global locked settings cannot be updated or overridden. Eligible changes enter a durable override lifecycle: `draft/submitted → review → effective or rejected → rolled_back/archived`.

Rollback restores the source value, retains the override record and writes audit evidence. Clone operations are idempotent and record inherited domains and allowed override categories.
