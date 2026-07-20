# Mega ZIP 5 Rollback

Rollback is destructive for Mega ZIP 5 lifecycle data. Export or back up all `browser_extension_b2b_*` Partner Lifecycle tables first.

## Coordinated rollback order

1. Freeze new Partner Lifecycle commands and revoke Mega ZIP 5 capability assignments from pilot users.
2. Export all Mega ZIP 5 partner lifecycle data and audit references.
3. Deploy the preserved application and extension source from the accepted `0.4.5` release.
4. Apply:
   `apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_b2b_partner_lifecycle.sql`
5. Confirm the pilot release channel returns to `0.4.5`.
6. Reload/redeploy the `0.4.5` extension package.
7. Verify Mega ZIP 1–4.5 commands, access revocation and audit still pass.

Do not execute the SQL rollback while the `0.5.0` backend is serving Partner Lifecycle commands; that would leave runtime code pointing to removed tables.
