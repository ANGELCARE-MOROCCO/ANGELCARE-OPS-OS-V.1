# Security and Authority Posture

- Revenue OS is protected by authentication and permission checks.
- The server API accepts `revenue_os.view` / scoped permissions with `revenue.view` compatibility for migration safety.
- Database tables use RLS and revoke direct access from `anon` and `authenticated`.
- Runtime access occurs through service-role-backed server APIs only.
- Audit events are append-only through a database trigger.
- Phase 1 cannot execute external communications or commercial commitments.
- `REVENUE_OS_ALLOW_EXTERNAL_ACTIONS` remains false.
- Future OpenAI agents must receive controlled tools, never database or provider credentials.
- Sensitive child, family, employee and commercial data must be minimized before future model calls.
