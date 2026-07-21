# Browser OS Security Handbook

## Boundaries
Chrome never receives Supabase service-role keys or database passwords. Every mutation passes the Extension Gateway. Tokens are device-bound, short-lived and capability-version checked.

## Required tests
Invalid/expired token, refresh replay, revoked device, pairing replay, stale access, unassigned module/adapter, territory/account isolation, unauthorized approvals, direct mutation, cross-user/module access, payload tampering, idempotency replay and content-script boundary.

## Secrets
Private extension signing keys stay outside packages and Git. Logs redact authorization, access/refresh tokens, selected text, message bodies, page content and raw payloads.
