# Mega ZIP 01 — Permission Matrix

## Roles

| Role | Foundation/workspace | Backoffice | Modules | Flags/config | Audit/security | Readiness/sign-off |
|---|---|---|---|---|---|---|
| `marketplace_executive` | Full | Full | Full | Full | Full | Full |
| `marketplace_admin` | Full | Full | Full | Full | Full | Full |
| `marketplace_security` | Yes | Yes | View | View | View/manage/export | View/review |
| `marketplace_manager` | Yes | Yes | View/update | View | No security management | View/update |
| `marketplace_parent` | Yes | No | No | No | No | No |
| `marketplace_tenant` | Yes | No | No | No | No | No |
| `marketplace_provider` | Yes | No | No | No | No | No |
| `marketplace_supplier` | Yes | No | No | No | No | No |
| `marketplace_viewer` | Foundation only | No | No | No | No | No |

## Scope types

`global`, `territory`, `tenant`, `self`, `assigned`, `read_only`.

Navigation hiding is not treated as authorization. Protected API handlers re-resolve the server context and permission. Missing marketplace assignments use a restrictive documented adapter from existing OPS roles; unknown roles fall back to `marketplace_viewer`.
