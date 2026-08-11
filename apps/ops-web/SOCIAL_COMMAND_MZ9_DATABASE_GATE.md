# Social Command MZ9 Database Gate

Run manually in Supabase SQL Editor only after source installer success.

1. `SQL/01_PRECHECK.sql`
2. `SQL/02_MIGRATION.sql`
3. `SQL/03_VERIFY.sql`

Do not run `SQL/99_ROLLBACK_DESTRUCTIVE.sql` unless intentionally removing only MZ9 saved-view/operator-preference data.

Expected verify posture:

- saved views table present
- operator preferences table present
- indexes present
- RLS enabled
- anon/authenticated direct table access revoked

The MZ9 SQL is additive and does not modify Meta credentials, publishing rows, media files, Copy Vault records, relationship history, webhook evidence, or existing MZ8 DAM tables.
