# Mega ZIP 6 Rollback

## Database rollback

Apply only when intentionally reverting Mega ZIP 6:

`apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_b2b_ai_sales_director.sql`

The rollback removes the 17 Mega ZIP 6 persistence structures and returns the pilot release channel to `0.5.0`.

## Source rollback

Before injection, make a surgical backup of every file listed in `MEGA6_APPLIED_FILES.txt`. To roll back:

1. Restore files that existed before injection from the backup.
2. Remove files marked as newly created in the manifest.
3. Rebuild extension version `0.5.0`.
4. Redeploy the prior OPS backend.
5. Refresh Browser OS access versions and sessions.
6. Verify Mega ZIP 5 again.

Do not run the rollback migration merely because a browser session is stale. First refresh the capability bootstrap and rebuild/reload the extension.
