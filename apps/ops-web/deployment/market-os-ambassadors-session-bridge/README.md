# ANGELCARE Market OS Ambassadors — OpsOS Session Actor Bridge

This additive bridge allows the hardened Ambassador API boundary to recognize either:

1. a validated Supabase Auth access token; or
2. a validated `angelcare_ops_session` backed by `app_sessions` and an active `app_users` record.

Neither identity source grants Ambassador authority by itself. The user must also have one explicit active row in `market_os_ambassador_actor_roles` for the selected tenant and organization, and that row must resolve to an enabled Ambassador permission set.

## Security behavior

- Explicit invalid Bearer credentials fail and are never ignored.
- A stale Supabase cookie may fall back to a valid OpsOS session cookie.
- Missing, expired, revoked or inactive OpsOS sessions fail with 401.
- Missing actor mapping fails with 403.
- Multiple active scopes fail with 409 until explicit scope headers are supplied.
- No OpsOS role name is automatically converted into an Ambassador role.
- Immutable Ambassador audit metadata records `supabase_auth` or `ops_session`.
