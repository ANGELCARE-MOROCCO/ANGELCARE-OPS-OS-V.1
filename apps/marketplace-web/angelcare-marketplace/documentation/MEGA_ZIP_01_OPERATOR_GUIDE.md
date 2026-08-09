# Mega ZIP 01 — Operator Guide

## Open the control plane

Navigate to `/angelcare-marketplace/admin`. The cockpit shows only foundation health, module registry state, audit evidence and readiness—never invented marketplace revenue.

## Register or transition a module

1. Open **Registre des modules**.
2. Search or filter the durable registry.
3. Open a module detail to inspect route, scope, owner, dependency and permissions.
4. Use **Transition** only with the appropriate permission.
5. Provide a reason and impact.
6. The server validates the lifecycle and dependencies.
7. Confirm the new state and its audit event.

A future Mega ZIP marked `not_installed` must not be activated to simulate delivery.

## Operate feature flags

Create flags disabled by default. Activation/deactivation requires a reason and is audited. Flags do not replace missing product logic.

## Operate configuration

Only non-sensitive, explicitly editable values can be changed. Server-managed and sensitive values are redacted.

## Review audit

Filter by action, object, role, result or severity. Export requires `marketplace.audit.export` and produces its own audit record.

## Manage readiness

Each check requires status, owner, evidence, blocker and next action. A sign-off remains conditional when any required check is not ready.
