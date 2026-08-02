begin;
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Conversion Universe safe rollback: public entry disabled',updated_at=now() where flag_key='marketplace.conversion.enabled';
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='attention',updated_at=now() where module_key='conversion-universe';
update public.angelcare_marketplace_conversion_policies set status='paused',updated_at=now() where status='active';
update public.angelcare_marketplace_conversion_availability_holds set status='released',released_at=now(),updated_at=now() where status='held';
commit;
