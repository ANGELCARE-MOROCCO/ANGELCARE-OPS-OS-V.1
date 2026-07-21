# Mega ZIP 7 Migration Order

1. Back up the application source and database.
2. Confirm Mega ZIP 6 migration is already applied.
3. Inject the Mega ZIP 7 surgical source patch.
4. Run contract, extension TypeScript, production-final and security verification.
5. Apply `apps/ops-web/supabase/migrations/20260720_browser_extension_production_final.sql`.
6. Confirm all 14 new tables exist and have RLS enabled.
7. Confirm release channels: development, internal, pilot, stable and rollback.
8. Deploy/restart the OPS Gateway.
9. Build/reload extension `0.7.0`.
10. Open `/browser-os-production` and verify the cockpit hydrates.
11. Assign one internal device and one pilot device.
12. Execute live acceptance and rollback rehearsal before stable promotion.
