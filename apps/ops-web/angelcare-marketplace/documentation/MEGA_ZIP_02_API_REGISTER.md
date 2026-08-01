# ANGELCARE BUILD 360 — Mega ZIP 02

**Contract:** Territory OS Core & Global Expansion Layer  
**Build root:** `apps/ops-web/angelcare-marketplace`  
**Cumulative baseline:** Mega ZIP 01  
**Execution boundary:** No build, Git action, deployment or database migration is performed by the delivery package.

## API families

- `GET/POST /api/angelcare-marketplace/territories`
- `GET/PATCH /territories/[territoryCode]`
- `POST /territories/clone`
- `POST /territories/[territoryCode]/transition`
- Settings list/update endpoints.
- Overrides list/create/detail/review/rollback endpoints.
- Readiness list/update/validate/sign-off endpoints.
- Health list/create endpoints.
- Preview and CSV export endpoints.

Every handler uses the Mega ZIP 01 response envelope, request reference, authentication adapter, permission guard, business-readable errors and service-side repository. Thin route files contain no domain logic.
