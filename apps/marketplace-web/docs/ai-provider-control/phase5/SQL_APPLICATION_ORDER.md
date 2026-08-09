# Manual SQL Application Order

Do not run SQL until the source package has applied and its local source gate has passed.

1. Run `DIAGNOSTIC.sql` in Supabase SQL Editor.
2. Confirm every Phase 4 prerequisite is `true`.
3. Run `supabase/migrations/20260726_1700_ai_provider_sovereignty_phase5_revenue_governance.sql` once.
4. Run `VERIFY.sql`.
5. Keep `ROLLBACK.sql` only for an explicitly approved destructive reversal after exporting Phase 5 data.

The migration is additive and idempotent, but production execution remains a human-approved database action.
