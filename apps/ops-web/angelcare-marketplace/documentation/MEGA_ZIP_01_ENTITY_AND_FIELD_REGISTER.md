# Mega ZIP 01 — Entity and Field Register

## `angelcare_marketplace_roles`

`role_key`, `name`, `description`, `system_role`, `active`, timestamps.

## `angelcare_marketplace_permissions`

`permission_key`, `name`, `category`, `sensitive`, `description`, timestamp.

## `angelcare_marketplace_role_permissions`

Role-to-permission durable mapping.

## `angelcare_marketplace_user_role_assignments`

`app_user_id`, `role_key`, `scope_type`, `territory_id`, `tenant_id`, `active`, assigner, reason, validity and timestamps.

## `angelcare_marketplace_modules`

Stable key, name, responsibility, route, type, audiences, navigation placement, status, enabled state, permission/dependency requirements, territory/tenant/locale capabilities, feature flag, health, owner, owning Mega ZIP, version and actor timestamps.

## `angelcare_marketplace_module_dependencies`

Explicit module relationship with required flag and reason.

## `angelcare_marketplace_feature_flags`

Stable key, name, description, enabled state, scope, rollout rule, validity, owner, reason, lifecycle status and version.

## `angelcare_marketplace_configurations`

Stable key, label, description, JSON value, value type, category, editability, sensitivity, territory/tenant/locale scope, version and updater.

## `angelcare_marketplace_audit_events`

Request reference, actor, role, action, object, scope, before/after values, reason, result, severity, source, safe network/device context and timestamp.

## `angelcare_marketplace_readiness_checks`

Stable check key, category, description, status, owner, evidence, blocker, notes, next action, verification identity/time, release requirement and order.

## `angelcare_marketplace_release_records`

Mega ZIP, release key, version, real acceptance status, signer, sign time, notes and evidence summary.
