# ANGELCARE BUILD 360 — Mega ZIP 02

**Contract:** Territory OS Core & Global Expansion Layer  
**Build root:** `apps/ops-web/angelcare-marketplace`  
**Cumulative baseline:** Mega ZIP 01  
**Execution boundary:** No build, Git action, deployment or database migration is performed by the delivery package.

## Migration order

1. Mega ZIP 01 foundation migration must already exist.
2. Apply `20260731040000_angelcare_marketplace_mega_zip_02_territory_os.sql`.
3. Verify remote migration history and generated types.
4. Run Mega ZIP 01 regression verifier.
5. Run Mega ZIP 02 verifier and targeted TypeScript gate.

The migration is additive. It creates Territory OS tables, functions, indexes, roles, permissions, module activation, feature flag, readiness record, template and truthful Territory 1 master. RLS is enabled and direct anon/auth table access is revoked.

Safe rollback: `angelcare-marketplace/database/rollback/20260731040000_angelcare_marketplace_mega_zip_02_SAFE_ROLLBACK.sql`. It disables runtime and pauses active territories while preserving all records and audit history.
