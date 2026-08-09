# API contract

- `GET eligible-strategies`
- `POST preview`, `validate`, `compile`
- `GET runs/:id`, `delta`
- `POST recompile`, `partial-recompile`, `resolve-conflict`, `reassign`, `rollback`, `prepare-for-propagation`

All writes enforce authentication, tenant, permissions, exact strategy version, approval decision, idempotency and audit. All responses report `externalActions: 0`.
