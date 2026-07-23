# MZ17 Security and Governance

## Human actors

Human Revenue OS APIs resolve identity through the application session cookie and `app_users`. Supabase Auth metadata is not accepted as a parallel identity plane.

## Machine actors

Machine dispatch and webhooks must carry an explicit tenant, actor/job identity, timestamp, idempotency key and a scoped signature. There is no default tenant.

## Tenant authority

Tenant identity is server-derived. A conflicting client-supplied tenant is a security error, not a fallback.

## Service-role usage

The service-role client is explicit and server-only. Every Revenue OS repository that uses it receives a server-derived tenant or executes a narrowly-scoped system job.

## Activation

MZ17 preserves `external_actions_enabled=false`. Source installation and SQL migration do not authorize production execution.
