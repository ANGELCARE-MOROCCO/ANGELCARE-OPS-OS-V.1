begin;
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='blocked',updated_at=now() where module_key='operations-reconciliation-universe';
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Safe rollback: runtime disabled; history preserved.',updated_at=now() where flag_key='marketplace.operations.reconciliation.enabled';
drop trigger if exists angelcare_marketplace_journey_to_fulfillment on public.angelcare_marketplace_journeys;
drop view if exists public.angelcare_marketplace_operations_command_v;
drop view if exists public.angelcare_marketplace_operations_financial_v;
-- Operational and financial history tables are deliberately retained.
commit;
