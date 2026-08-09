# Revenue Command OS — MZ17 Production Consistency Repair

MZ17 is a cumulative surgical repair over MZ01–MZ16. It does not add a new autonomous business doctrine. It reconciles the already-delivered system into one production-safe identity, tenant, permission, error, command-registry and runtime-health contract.

## Contract

- Human identity: `APP_SESSION_COOKIE -> app_sessions -> app_users`.
- Human tenant: server-derived from the authenticated user only.
- Machine identity: explicit signed job/webhook actor with tenant, scope, timestamp and idempotency.
- Supabase: explicit user and service clients; service-role usage remains server-only and tenant-bound.
- Permissions: one canonical Revenue OS catalogue synchronized with `app_users.permissions` for privileged Revenue OS roles.
- Errors: structured envelopes with trace IDs and preserved PostgREST diagnostics.
- Commands: immutable canonical 3,000-command baseline with persisted overlays; partial storage can never replace the baseline.
- Mega Production: source-health and degraded state are visible; storage failures never become false zero states.
- External actions: disabled by default; the migration preserves Shadow posture.

## Required production sequence

1. Apply the source repair package.
2. Run the targeted MZ17 TypeScript gate.
3. Apply `20260722_revenue_command_os_mz17_production_consistency_repair.sql` in a controlled transaction.
4. Run `VERIFY.sql`.
5. Run `tools/revenue-os/repair-command-library-3000.mjs` in dry-run mode.
6. Run the command repair with `--apply` only when the dry-run and production credentials are approved.
7. Re-run `VERIFY.sql` and the diagnostics endpoint.
8. Execute the role/session/tenant smoke matrix in `LIVE_ACCEPTANCE_CHECKLIST.md`.
9. Keep external autonomous actions disabled until every acceptance gate is signed.
