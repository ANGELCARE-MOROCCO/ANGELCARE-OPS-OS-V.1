-- Restores only this recovery's homepage settings. Does not withdraw resources.
begin;
do $$declare event public.ac_dce_events;home public.ac_dce_records;begin
  perform pg_advisory_xact_lock(hashtextextended('kidflix-public-recovery-my.angelcarehub.com',0));
  select * into event from public.ac_dce_events where channel='admin' and action='kidflix_public_recovery_r1' and data->>'host'='my.angelcarehub.com' order by created_at desc limit 1;
  if event.id is null then raise exception 'RECOVERY_RECEIPT_NOT_FOUND';end if;
  if exists(select 1 from public.ac_dce_events where action='kidflix_public_recovery_r1_rollback'and data->>'recoveryId'=event.id::text)then return;end if;
  select * into home from public.ac_dce_records where id=event.record_id for update;
  if home.data is distinct from event.data->'afterData' then raise exception 'LATER_HOMEPAGE_EDITS_PROTECTED';end if;
  insert into public.ac_dce_versions(record_id,revision,snapshot,actor_id)values(home.id,home.revision,to_jsonb(home),event.actor_id)on conflict(record_id,revision)do nothing;
  update public.ac_dce_records set data=event.data->'beforeData',lifecycle=case when event.data->>'created'='true' then 'archived'else lifecycle end,revision=revision+1,updated_at=now()where id=home.id;
  insert into public.ac_dce_events(channel,action,record_id,actor_id,tenant_id,territory_id,data)values('admin','kidflix_public_recovery_r1_rollback',home.id,event.actor_id,home.tenant_id,home.territory_id,jsonb_build_object('recoveryId',event.id));
end $$;
commit;
