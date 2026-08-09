# Mega ZIP 01 — Route Inventory

## Public and state routes

| Route | Access | Purpose |
|---|---|---|
| `/angelcare-marketplace` | Public | Premium constitutional entry; no fake catalogue or future-domain claims. |
| `/angelcare-marketplace/access-denied` | Public state | Business-readable denial with no protected data leakage. |
| `/angelcare-marketplace/unavailable` | Public state | Explicit feature/module unavailable state. |

## Authenticated workspace

| Route | Permission | Purpose |
|---|---|---|
| `/angelcare-marketplace/workspace` | `marketplace.workspace.access` | Role- and scope-aware workspace; only active durable modules appear. |
| `/angelcare-marketplace/account` | `marketplace.workspace.access` | Effective identity, roles, scopes and permissions. |

## Master Backoffice

| Route | Permission | Purpose |
|---|---|---|
| `/angelcare-marketplace/admin` | `marketplace.admin.access` | Foundation health, registry, audit and readiness cockpit. |
| `/angelcare-marketplace/admin/modules` | `marketplace.modules.view` | Searchable module registry and governed transitions. |
| `/angelcare-marketplace/admin/modules/[moduleKey]` | `marketplace.modules.view` | Module lifecycle, route, dependencies, audiences and scopes. |
| `/angelcare-marketplace/admin/feature-flags` | `marketplace.feature_flags.view` | Scoped activation controls. |
| `/angelcare-marketplace/admin/configuration` | `marketplace.configuration.view` | Safe business configuration and protected server values. |
| `/angelcare-marketplace/admin/security-audit` | `marketplace.audit.view` | Identity, security permissions and evidence log. |
| `/angelcare-marketplace/admin/readiness` | `marketplace.readiness.view` | Evidence, blocker, owner, next action and real sign-off state. |
| `/angelcare-marketplace/admin/foundation-ui` | `marketplace.foundation.view` | Design-system and state inventory; examples are labelled as such. |

## Route-level states

- `loading.tsx`
- `error.tsx`
- access denied
- unavailable/disabled
- migration-required state
- empty registry/list state
- success and validation feedback

All API routes are mounted under `/api/angelcare-marketplace/foundation`.
