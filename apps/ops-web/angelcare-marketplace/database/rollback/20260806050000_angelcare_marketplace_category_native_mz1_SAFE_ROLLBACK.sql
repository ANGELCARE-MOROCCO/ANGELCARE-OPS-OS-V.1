begin;

-- Data-preserving rollback: disable MZ1 interfaces while retaining all schema, import, catalog and audit history.
update public.angelcare_marketplace_modules set status='disabled',enabled=false,health_status='unknown',updated_at=now() where module_key='category-native-commerce-control-plane-mz1';
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',updated_at=now() where flag_key='marketplace.category_native.mz1';
update public.angelcare_marketplace_experience_schemas set status='paused',updated_at=now() where status='active';
update public.angelcare_marketplace_homepage_block_definitions set status='paused',updated_at=now() where status='active';
update public.angelcare_marketplace_category_native_import_jobs set status='failed',error_summary=error_summary||jsonb_build_object('rollback_reason','MZ1 safe rollback invoked','rollback_at',now()) where status in('uploaded','validating','validated','importing');

commit;

select 'category_native_mz1_safe_rollback_applied_records_preserved' as result;
