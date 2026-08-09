# Market OS Ambassadors Production-Hardening — Apply Runbook

## Invariants

- The approved Ambassador TSX UI/UX is frozen. This patch contains no TSX file.
- The database migration is additive: existing operational tables and compatibility fields remain in place.
- Runtime persistence is Supabase-only. Missing environment, auth, actor scope, permission, or persistence returns an explicit failure.
- Do not run a Next.js production build as part of this patch verification.

## Required environment

- `NEXT_PUBLIC_SUPABASE_URL` (or server alias `SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (or server alias `SUPABASE_SERVICE_KEY`)

The service-role key must remain server-only.

## Apply order

1. Create a database backup or Supabase point-in-time recovery checkpoint.
2. Copy the patch files at repository root, preserving paths.
3. Apply `database/market-os-ambassadors/20260721_market_os_ambassadors_production_hardening.sql` in a controlled maintenance window.
4. Explicitly backfill `tenant_id` and `organization_id` for legacy rows. The migration intentionally does not guess scope; rows without scope are fail-closed and will not appear through hardened APIs.
5. Insert at least one active membership in `market_os_ambassador_actor_roles` for every authorized user/scope. Use `SCOPE_AND_ROLE_BOOTSTRAP.sql.example` as a reviewed template.
6. Confirm the required role permissions. Canonical role permission defaults are seeded by the migration, but user-to-role membership is never auto-granted.
7. Run only:
   - `tsc -p deployment/market-os-ambassadors-production-hardening/tsconfig.verify.json --pretty false`
   - `node deployment/market-os-ambassadors-production-hardening/verify-production-hardening.mjs`
8. Restart/redeploy the existing Next.js service through the normal production pipeline. No build command was run during patch creation.
9. Smoke test with an authenticated, scoped user:
   - GET unified snapshot;
   - duplicate candidate rejection;
   - repeat candidate conversion with the same idempotency key;
   - multi-ambassador mission assignment;
   - territory decision history;
   - proof rejection/approval;
   - blocked reward without approved proof/validated conversion;
   - payment requiring finance permission and payment reference;
   - immutable audit update/delete rejection.

## Scope headers

A user with exactly one active Ambassador scope needs no explicit scope header. A user with multiple active scopes must send both:

- `x-angelcare-tenant-id`
- `x-angelcare-organization-id`

An absent or ambiguous scope is rejected; the server never selects one silently.
