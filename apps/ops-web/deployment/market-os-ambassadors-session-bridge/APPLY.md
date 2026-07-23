# Apply Order

1. Back up the production database and repository.
2. Inject the code patch and run static verification only.
3. Apply `database/market-os-ambassadors/20260722_market_os_ambassador_ops_session_bridge.sql` in Supabase.
4. Review the active `app_users` identity and Ambassador scope.
5. When exactly one active CEO/owner/super_admin and one Ambassador scope exist, apply the guarded bootstrap SQL. Otherwise use `EXPLICIT_MAPPING.sql.example` with reviewed IDs.
6. Run `VERIFY_DATABASE.sql`.
7. Redeploy the existing application through the normal pipeline.
8. Log out and log in again so the browser has a fresh `angelcare_ops_session`.
9. Open Ambassador Settings and confirm the authenticated actor, scope and permissions load.

No SQL is executed by the overlay installer. No Next.js production build is run by static verification.
