# API Contract MZ12

Read:
- `GET /api/revenue-command-os/strategy-studio/strategies`
- `GET /api/revenue-command-os/strategy-studio/strategies/:id`

Actions:
- approve, reject, amend, combine;
- request analysis, request evidence;
- change objective, constraint or approval class;
- archive, reopen, export memo;
- simulate capacity, constraints or outcomes.

All actions require authentication, tenant resolution, role/authority checks, immutable version targeting, idempotency and audit. Responses always declare `externalActions: 0`.
