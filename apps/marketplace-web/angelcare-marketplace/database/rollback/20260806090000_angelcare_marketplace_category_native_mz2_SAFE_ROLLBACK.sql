begin;
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',updated_at=now() where flag_key='marketplace.category_native.mz2';
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='unknown',updated_at=now() where module_key='category-native-adaptive-customer-experience-mz2';
update public.angelcare_marketplace_experience_sessions set status='cancelled',updated_at=now() where status in('configuring','configuration_invalid','configuration_valid','availability_pending','ready_for_review');
insert into public.angelcare_marketplace_audit_events(request_id,actor_role,action,object_type,object_id,before_value,after_value,reason,result,severity,source)
values('category-native-mz2.safe-rollback.'||extract(epoch from now())::bigint,'system','safe_rollback','marketplace_module','category-native-adaptive-customer-experience-mz2',
jsonb_build_object('enabled',true),jsonb_build_object('enabled',false,'data_preserved',true),
'Category-Native MZ2 disabled while every session, snapshot, handover and canonical transaction remains preserved.','success','warning','angelcare-marketplace');
commit;
