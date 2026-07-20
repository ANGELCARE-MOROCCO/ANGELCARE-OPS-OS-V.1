# Mega ZIP 5 Migration Order

1. Create a database backup and preserve the currently deployed `0.4.5` application/extension package.
2. Confirm all Mega ZIP 1–4.5 migrations are already applied.
3. Apply:
   `apps/ops-web/supabase/migrations/20260720_browser_extension_b2b_partner_lifecycle.sql`
4. Confirm the transaction commits and the pilot release channel reports `0.5.0`.
5. Deploy the patched OPS web application so the Gateway, Partner 360 route and `/users/[id]` assignment UI are available.
6. Build the private extension using the production SaaS origin and the existing stable public extension identity:
   `ANGELCARE_SAAS_ORIGIN=https://<your-origin> npm --prefix apps/revenue-browser-extension run build`
7. Run:
   - `npm run browser-extension:contracts:verify`
   - `npm run typecheck:extension`
   - `npm --prefix apps/revenue-browser-extension run verify`
   - all Mega ZIP verification commands listed in `MEGA5_VERIFICATION_EVIDENCE.txt`
8. Assign the required Mega ZIP 5 modules/capabilities to a pilot user from `/users/[id]`.
9. Reload the unpacked/private extension and complete the live acceptance checklist.
10. Expand assignment only after pilot acceptance evidence is signed.

Do not run Mega ZIP 6 migrations or enable its capabilities as part of this deployment.
