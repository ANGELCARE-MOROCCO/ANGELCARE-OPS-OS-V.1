# SOCIAL COMMAND MZ8 — DATABASE GATE

Run manually in Supabase SQL Editor, in this exact order:

1. `20260811_social_command_mz8_product_closure_precheck.sql`
2. `20260811_social_command_mz8_product_closure_migration.sql`
3. `20260811_social_command_mz8_product_closure_verify.sql`

Expected:
- Precheck prints `MZ8 PRECHECK PASS`.
- Migration completes without error.
- Verify returns all required tables/columns with `ok = true`.
- Lifecycle verification booleans are all `true`.

Never run:
`20260811_social_command_mz8_product_closure_rollback_DESTRUCTIVE.sql`
except when intentionally dismantling MZ8 structures after a controlled rollback decision.

MZ8 SQL does not modify Meta, Windows Media Gateway secrets, environment variables, Vercel, or Marketplace.
