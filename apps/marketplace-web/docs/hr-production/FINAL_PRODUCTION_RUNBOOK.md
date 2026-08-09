# HR Final Production Runbook

## Mandatory checks
1. Run Supabase migration from Phase 01.
2. Inject phases 01 → 06 in order.
3. Build locally: `npm run build`.
4. Run app locally.
5. Run smoke test:
   `node scripts/hr-production-smoke-test.mjs`
6. Check:
   - `/hr`
   - `/hr/employees`
   - `/hr/staff/[id]`
   - `/hr/recruitment`
   - `/hr/onboarding`
   - `/hr/sync-center`
   - `/api/hr/production-readiness`

## Definition of done
- Candidate conversion creates staff, contract, docs, onboarding, training, task, sync event, audit log.
- Staff 360 displays linked records from production tables.
- Sync center lists broken links and repairable issues.
- Navigation is role-based from a registry.
- Smoke test returns 200 for all production endpoints.
