# Mega ZIP 01 — Audit Event Register

## Required sensitive events

- `marketplace.module.registered`
- `marketplace.module.updated`
- `marketplace.module.enabled`
- `marketplace.module.disabled`
- `marketplace.module.blocked`
- `marketplace.module.degraded`
- `marketplace.module.deprecated`
- `marketplace.module.archived`
- `marketplace.feature_flag.created`
- `marketplace.feature_flag.updated`
- `marketplace.configuration.updated`
- `marketplace.readiness.updated`
- `marketplace.readiness.signed_off`
- `marketplace.audit.exported`
- `marketplace.access.denied`

## Evidence fields

Request ID, actor ID, actor role, action, object type/ID, territory, tenant, before/after values where safe, reason, result, severity, source, safe device/network context and timestamp.

Passwords, session tokens, service keys and unnecessary child/family data are forbidden in the audit payload.
