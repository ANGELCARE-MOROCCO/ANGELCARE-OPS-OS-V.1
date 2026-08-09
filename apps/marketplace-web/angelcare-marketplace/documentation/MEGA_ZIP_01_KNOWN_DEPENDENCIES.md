# Mega ZIP 01 — Known Dependencies and Honest Blockers

## Required before runtime acceptance

1. Apply the additive Supabase migration.
2. Confirm the target `app_users.id` remains UUID-compatible.
3. Verify existing OPS session cookies and `getCurrentUser()` in the target environment.
4. Assign marketplace roles where explicit assignments are required; the OPS-role adapter is only the compatibility baseline.
5. Run the targeted TypeScript gate with the repository’s installed dependencies.
6. Run authenticated allowed/denied API tests.
7. Render key routes on desktop, tablet and mobile.
8. Inspect long French content and Arabic RTL.
9. Create and transition a module; verify persistence and audit.
10. Change a feature flag and editable configuration; verify validation and audit.
11. Update readiness evidence and perform the real sign-off.
12. Record product, engineering, UX and operations acceptance.

## Contract boundaries

Mega ZIPs 02–20 are registered as future modules, not implemented features. No future route should be activated until its signed ZIP is delivered.
