# Mega ZIP 01 — API Register

All responses use a predictable `data` or `error` envelope and a `requestId`.

| Method | Endpoint | Permission / behavior |
|---|---|---|
| GET | `/foundation/context` | Safe current identity/role/scope summary. |
| GET | `/foundation/health` | Non-secret foundation readiness. |
| GET/POST | `/foundation/modules` | View or create durable module definitions. |
| GET/PATCH | `/foundation/modules/[moduleKey]` | Detail or validated update. |
| POST | `/foundation/modules/[moduleKey]/transition` | Permission-specific lifecycle transition with dependency checks. |
| GET/POST | `/foundation/feature-flags` | View or create safe-disabled flags. |
| PATCH | `/foundation/feature-flags/[flagKey]` | Governed activation/deactivation with reason. |
| GET | `/foundation/configuration` | Sensitive values redacted. |
| PATCH | `/foundation/configuration/[key]` | Editable non-sensitive settings only. |
| GET | `/foundation/audit` | Filterable evidence list. |
| GET | `/foundation/audit/export` | Permissioned CSV proof export with audit event. |
| GET | `/foundation/readiness` | Evidence-backed readiness list. |
| PATCH | `/foundation/readiness/[checkKey]` | Controlled readiness transition. |
| POST | `/foundation/readiness/sign-off` | Accepted or conditionally accepted according to actual checks. |

Error families include validation, authentication, permission, scope, not found, conflict, invalid transition, dependency blocked, feature disabled, configuration and internal errors.
