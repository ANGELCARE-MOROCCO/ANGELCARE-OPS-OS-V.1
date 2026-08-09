begin;
update public.angelcare_marketplace_modules
set status='disabled',enabled=false,health_status='unknown',updated_at=now()
where module_key='production-activation-acceptance';
-- Activation evidence is intentionally preserved. No commercial, customer or transactional data is deleted.
commit;
