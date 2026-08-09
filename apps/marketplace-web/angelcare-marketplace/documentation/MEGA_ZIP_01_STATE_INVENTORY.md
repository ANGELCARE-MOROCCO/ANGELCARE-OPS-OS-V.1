# Mega ZIP 01 — State Inventory

## Request/UI states

| State | Required behavior |
|---|---|
| `idle` | Stable initial action state. |
| `loading` | Skeleton/progress without inventing final data. |
| `refreshing` | Existing data remains understandable. |
| `empty` | Explains what is absent and the valid next action. |
| `partial` | Shows available data and disclosed limitations. |
| `success` | Confirms result, ownership and next action. |
| `validation_error` | Field-specific, business-readable feedback. |
| `permission_denied` | No protected payload; explains authority boundary. |
| `blocked` | Names the blocker and corrective path. |
| `unavailable` | Explains feature/contract activation boundary. |
| `offline` / `retrying` | Gives controlled retry behavior. |
| `failed` | No stack trace or raw server wording. |
| `expired` | Prevents active behavior and directs renewal/recovery. |
| `archived` | Read-only historical behavior unless restore is authorized. |

## Module lifecycle

`registered`, `not_installed`, `disabled`, `enabled`, `blocked`, `degraded`, `deprecated`, `archived`.

Transitions are declared in code and invalid jumps are rejected server-side. Enabling validates required dependencies.

## Readiness lifecycle

`not_started`, `in_progress`, `ready`, `blocked`, `not_applicable`.

A release sign-off is `accepted` only when every required check is ready; otherwise it is `conditionally_accepted`.
