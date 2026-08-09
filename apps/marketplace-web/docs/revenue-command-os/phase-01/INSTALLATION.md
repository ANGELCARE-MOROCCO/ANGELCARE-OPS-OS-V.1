# Installation

## 1. Extract the cumulative application

Use the full application delivered in the Ultra Mega ZIP. Keep the existing application structure and environment secrets.

## 2. Apply the Supabase migration

Apply:

```text
apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase1_foundation.sql
```

The migration is idempotent and creates only `revenue_os_*` objects. It does not modify legacy Revenue Command Center tables.

## 3. Add environment values

Copy the values from `revenue-os.env.example` into the server-side environment.

The safe Phase 1 posture is:

```text
REVENUE_OS_ENABLED=true
REVENUE_OS_ENVIRONMENT=development
REVENUE_OS_EXECUTION_MODE=shadow
REVENUE_OS_ALLOW_EXTERNAL_ACTIONS=false
REVENUE_OS_AUDIT_RETENTION_DAYS=2555
```

## 4. Grant application permissions

Existing users with `revenue.view` can enter the module through the compatibility rule. New role policies should adopt `revenue_os.view` and narrower Revenue OS permissions.

## 5. Verify

From `apps/ops-web`:

```bash
npm run revenue-os:phase1:verify
npm run revenue-os:phase1:typecheck
```

No production build is required for the static acceptance pass.

## 6. Open

```text
/revenue-command-os
```
