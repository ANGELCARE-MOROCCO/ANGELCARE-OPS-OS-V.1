# API contract

`GET /api/revenue-command-os/command-kernel` returns the kernel bootstrap.

`POST` actions:
- `simulate`: generates and executes a Shadow/simulation plan with zero external effects;
- `validate`: returns kernel readiness and validation issues;
- `rollback`: intentionally refuses remote automatic rollback and points to controlled application/SQL rollback.
