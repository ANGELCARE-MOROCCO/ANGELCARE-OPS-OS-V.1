# MZ17 Live Acceptance Checklist

## Authentication and tenant isolation

- [ ] Logged-in APP session opens Signals, Commandes 3000, Compiler MZ13, Execution MZ14, Cockpit and Mega Production without `unauthenticated`.
- [ ] Logged-out calls return HTTP 401 with a trace ID.
- [ ] User without the required permission receives HTTP 403 with the exact permission key.
- [ ] A request body containing a different `tenantId` is rejected with `REVENUE_OS_TENANT_MISMATCH`.
- [ ] No user-scoped route reads tenant identity from request data.

## Permissions

- [ ] Privileged Revenue OS administrator receives the canonical permission bundle.
- [ ] Standard read-only operator can view approved read workspaces but cannot activate, execute, approve or administer.
- [ ] MZ13, MZ14 and MZ16 page guards match their API guards.

## Signals and diagnostics

- [ ] Signals returns a structured failure with trace ID when a source fails.
- [ ] Signals UI shows source warnings without exposing credentials.
- [ ] `/api/revenue-command-os/diagnostics` requires `revenue_os.audit.view`.

## Commands 3000

- [ ] Canonical count is 3,000 and command codes are unique.
- [ ] Persisted count, missing count and drift count are visible.
- [ ] Partial persisted rows never reduce the UI below 3,000 canonical commands.
- [ ] Repair tool dry-run passes before `--apply`.
- [ ] Post-apply validation snapshot is persisted.

## MZ14 / MZ16 runtime

- [ ] Empty domains display explicit zero-state messaging, not invented data.
- [ ] Source unavailable is visibly different from zero records.
- [ ] Emergency Stop creates a governed request and audit evidence.
- [ ] Production activation remains blocked unless data mode is live and permission checks pass.
- [ ] External actions remain disabled after migration.

## Release gate

- [ ] Targeted TypeScript check passes.
- [ ] MZ17 static verifier passes.
- [ ] SQL verification passes.
- [ ] Production smoke matrix passes for privileged, read-only, unauthorized and logged-out actors.
- [ ] Rollback procedure has been reviewed before activation.
