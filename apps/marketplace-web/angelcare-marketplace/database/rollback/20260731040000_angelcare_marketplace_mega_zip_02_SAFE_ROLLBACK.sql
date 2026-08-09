-- SAFE NON-DESTRUCTIVE ROLLBACK — MEGA ZIP 02
-- Preserves all Territory OS records and audit history.
begin;
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Mega ZIP 02 safe rollback: runtime disabled, data preserved.',version=version+1 where flag_key='marketplace.territory-os.enabled';
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='blocked',version=version+1 where module_key='marketplace.territory-os';
update public.angelcare_marketplace_territories set status='paused',health_status='paused',paused_at=coalesce(paused_at,timezone('utc',now())),version=version+1 where status in ('soft_launch','live');
insert into public.angelcare_marketplace_audit_events(request_id,action,object_type,object_id,reason,result,severity,source)
values('safe-rollback-'||extract(epoch from now())::text,'territory_os.safe_rollback','marketplace_module','marketplace.territory-os','Runtime disabled and active territories paused; all records preserved.','success','critical','mega-zip-02-safe-rollback');
commit;
