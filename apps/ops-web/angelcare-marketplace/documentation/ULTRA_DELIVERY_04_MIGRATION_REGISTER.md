# Migration Register

1. `20260801130000_...mz16_academy.sql`
2. `20260801140000_...mz17_provider_workforce.sql`
3. `20260801150000_...mz18_operations_execution.sql`

Apply one at a time in order. All are additive, enable RLS, revoke direct anon/authenticated access and grant service-role operation. Safe rollback preserves records while disabling modules and suspending active execution.
