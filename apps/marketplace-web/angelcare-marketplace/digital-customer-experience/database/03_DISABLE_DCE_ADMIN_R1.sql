-- Emergency distribution pause only. Preserves all DCE drafts, receipts and native Marketplace data.
-- This does not roll back source. Use the guarded code rollback command separately.
begin;
update public.ac_dce_records set data=data||'{"monetizationEnabled":false,"publicRuntimeReady":false}'::jsonb,
 revision=revision+1,updated_at=now(),updated_by='sql:distribution-pause' where kind='setting';
insert into public.ac_dce_versions(record_id,revision,snapshot,actor_id)
select id,revision,to_jsonb(r),'sql:distribution-pause' from public.ac_dce_records r where kind='setting' on conflict(record_id,revision) do nothing;
update public.ac_dce_releases set state='cancelled',error='Explicit SQL distribution pause' where state='scheduled';
update public.ac_dce_releases set state='withdrawn' where state='published';
update public.ac_dce_records set published_release_id=null where published_release_id is not null;
insert into public.ac_dce_events(channel,action,actor_id,data) values('admin','distribution_pause','sql:distribution-pause','{"source":"03_DISABLE_DCE_ADMIN_R1.sql","nativeMarketplaceChanged":false}'::jsonb);
commit;
