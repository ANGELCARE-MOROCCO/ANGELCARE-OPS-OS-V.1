-- ANGELCARE_DCE_ADMIN_R2 · 2026-10-15. Separate additive correction; DO NOT execute as part of source installation.
-- Requires the actual installed owned R1 baseline. Changes no native objects or staff grants.
begin;
do $$ declare n text; f record; begin
 for f in select t.tgname,p.oid from pg_trigger t join pg_proc p on p.oid=t.tgfoid where t.tgrelid='public.ac_dce_releases'::regclass and t.tgname in('ac_dce_release_guard_trigger','ac_dce_link_release_trigger') loop if obj_description(f.oid,'pg_proc') is distinct from 'ANGELCARE_DCE_ADMIN_R2' then raise exception 'FOREIGN_TRIGGER: %',f.tgname;end if;end loop;
 foreach n in array array['ac_dce_records','ac_dce_versions','ac_dce_releases','ac_dce_events','ac_dce_commands','ac_dce_links'] loop
  if to_regclass('public.'||n) is null or obj_description(to_regclass('public.'||n),'pg_class') is distinct from 'ANGELCARE_DCE_ADMIN_R1' then raise exception 'OWNED_R1_BASELINE_REQUIRED: %',n;end if;
 end loop;
 for f in select oid,proname from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_write','ac_dce_release_action','ac_dce_import_line','ac_dce_import_links','ac_dce_create_import') loop
  if obj_description(f.oid,'pg_proc') is distinct from 'ANGELCARE_DCE_ADMIN_R1' then raise exception 'FOREIGN_FUNCTION: %',f.proname;end if;
 end loop;
 if to_regprocedure('public.ac_dce_reschedule(text,text,text,uuid,text,uuid,timestamptz)') is not null and obj_description(to_regprocedure('public.ac_dce_reschedule(text,text,text,uuid,text,uuid,timestamptz)'),'pg_proc') is distinct from 'ANGELCARE_DCE_ADMIN_R2' then raise exception 'FOREIGN_RESCHEDULE_FUNCTION';end if;
 if to_regprocedure('public.ac_dce_analytics(text,text,timestamptz,timestamptz,text,jsonb,int)') is not null and obj_description(to_regprocedure('public.ac_dce_analytics(text,text,timestamptz,timestamptz,text,jsonb,int)'),'pg_proc') is distinct from 'ANGELCARE_DCE_ADMIN_R2' then raise exception 'FOREIGN_ANALYTICS_FUNCTION';end if;
 if to_regprocedure('public.ac_dce_prepare_import(text,text,text,uuid,text,text,text,text,text,jsonb)') is not null and obj_description(to_regprocedure('public.ac_dce_prepare_import(text,text,text,uuid,text,text,text,text,text,jsonb)'),'pg_proc') is distinct from 'ANGELCARE_DCE_ADMIN_R2' then raise exception 'FOREIGN_PREPARE_FUNCTION';end if;
 if to_regprocedure('public.ac_dce_release_guard()') is not null and obj_description(to_regprocedure('public.ac_dce_release_guard()'),'pg_proc') is distinct from 'ANGELCARE_DCE_ADMIN_R2' then raise exception 'FOREIGN_RELEASE_GUARD';end if;
 if to_regprocedure('public.ac_dce_link_release()') is not null and obj_description(to_regprocedure('public.ac_dce_link_release()'),'pg_proc') is distinct from 'ANGELCARE_DCE_ADMIN_R2' then raise exception 'FOREIGN_LINK_GUARD';end if;
if to_regprocedure('public.ac_dce_dashboard_counts(text,text)') is not null and obj_description(to_regprocedure('public.ac_dce_dashboard_counts(text,text)'),'pg_proc') is distinct from 'ANGELCARE_DCE_ADMIN_R2' then raise exception 'FOREIGN_DASHBOARD_FUNCTION';end if;
end $$;
create or replace function public.ac_dce_write(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_action text,p_id uuid,p_revision int,p_record jsonb,p_refs jsonb default '{}') returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records; old ac_dce_records; reply jsonb; receipt ac_dce_commands; s text:=coalesce(p_tenant,'~')||'|'||coalesce(p_territory,'~'); k text; v jsonb;
begin
 if nullif(p_actor,'') is null then raise exception 'ACTOR_REQUIRED';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));
 select * into receipt from ac_dce_commands where actor_id=p_actor and request_id=p_request;
 if found then if receipt.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return receipt.response;end if;
 if p_id is not null then select * into old from ac_dce_records where id=p_id and scope_key=s for update;if not found then raise exception 'NOT_FOUND';end if;if old.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;end if;
 if p_action='save' then
  if p_id is null then insert into ac_dce_records(kind,key,title,family,topic,audience,data,lifecycle,created_by,updated_by,tenant_id,territory_id) values(p_record->>'kind',p_record->>'key',p_record->>'title',p_record->>'family',p_record->>'topic',p_record->>'audience',p_record->'data',case when p_record->>'kind'='case' then 'open' when p_record->>'kind'='contribution' then 'pending' else 'draft' end,p_actor,p_actor,p_tenant,p_territory) returning * into r;
  else
   if old.kind<>p_record->>'kind' or old.key<>p_record->>'key' then raise exception 'IDENTITY_IMMUTABLE';end if;
   update ac_dce_records set title=p_record->>'title',family=p_record->>'family',topic=p_record->>'topic',audience=p_record->>'audience',data=p_record->'data',lifecycle=case when old.lifecycle in('review','approved') then 'draft' else old.lifecycle end,revision=revision+1,updated_by=p_actor,updated_at=now() where id=p_id returning * into r;
  end if;
  delete from ac_dce_links where record_id=r.id;
  for k,v in select * from jsonb_each(p_refs) loop if k not in('record','media','offer') then raise exception 'REFERENCE_TYPE';end if;insert into ac_dce_links select r.id,k,x::uuid from jsonb_array_elements_text(v) x on conflict do nothing;end loop;
 insert into ac_dce_links(record_id,target_type,target_id)
 select r.id,case bucket when 'records' then 'record' when 'offers' then 'offer' else 'media' end,key::uuid
 from ac_dce_releases z cross join (values('media'),('records'),('offers')) as kinds(bucket)
 cross join lateral jsonb_object_keys(coalesce(z.manifest->'bindings'->bucket,'{}')) as key
 where z.record_id=r.id and z.state in('published','scheduled','withdrawn') on conflict do nothing;
 elsif p_action in('review','approve','archive','open','assigned','waiting_customer','resolved','closed','hidden','rejected','accept') then
  if p_id is null then raise exception 'NOT_FOUND';end if;
  if p_action='approve' and old.lifecycle<>'review' then raise exception 'REVIEW_REQUIRED';end if;
  if p_action in('open','assigned','waiting_customer','resolved','closed') and old.kind<>'case' then raise exception 'CASE_REQUIRED';end if;
  if p_action in('hidden','rejected','accept') and old.kind<>'contribution' then raise exception 'CONTRIBUTION_REQUIRED';end if;
  if p_action='archive' and (old.published_release_id is not null or exists(select 1 from ac_dce_links where target_type='record' and target_id=old.id)) then raise exception 'DEPENDENCY_BLOCKED';end if;
  update ac_dce_records set data=case when nullif(p_record->>'reason','') is not null then data||jsonb_build_object('decisions',coalesce(data->'decisions','[]')||jsonb_build_array(jsonb_build_object('action',p_action,'reason',p_record->>'reason','actorId',p_actor,'createdAt',now()))) else data end,lifecycle=case when p_action='approve' then 'approved' when p_action='archive' then 'archived' when p_action='accept' then 'approved' else p_action end,revision=revision+1,updated_at=now(),updated_by=p_actor where id=p_id returning * into r;
 elsif p_action='delete' then
  if p_id is null or old.lifecycle not in('archived','closed','rejected') or exists(select 1 from ac_dce_releases where record_id=p_id) or exists(select 1 from ac_dce_links where target_type='record' and target_id=p_id) then raise exception 'DELETE_BLOCKED';end if;
  delete from ac_dce_records where id=p_id;r:=old;
 else raise exception 'UNKNOWN_ACTION';end if;
 if p_action<>'delete' then insert into ac_dce_versions(record_id,revision,snapshot,actor_id) values(r.id,r.revision,to_jsonb(r),p_actor);end if;
 insert into ac_dce_events(channel,action,record_id,actor_id,request_id,data,tenant_id,territory_id) values('admin',p_action,r.id,p_actor,p_request,jsonb_build_object('revision',r.revision,'kind',r.kind),p_tenant,p_territory);
 reply:=jsonb_build_object('record',to_jsonb(r),'action',p_action,'receipt',p_request);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;

create or replace function public.ac_dce_release_action(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_action text,p_manifest jsonb default null,p_error text default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare z ac_dce_releases; r ac_dce_records; c ac_dce_commands; reply jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select * into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 select * into z from ac_dce_releases where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into r from ac_dce_records where id=z.record_id for update;
 if p_action='due' then
  if z.state<>'scheduled' or z.scheduled_at>now() then raise exception 'NOT_DUE';end if;if r.revision<>z.revision or r.lifecycle<>'approved' or p_manifest is null then raise exception 'REVISION_CONFLICT';end if;
  update ac_dce_releases set state='published',published_at=now() where id=z.id returning * into z;update ac_dce_records set published_release_id=z.id where id=r.id;
 elsif p_action='cancel' then if z.state<>'scheduled' then raise exception 'NOT_SCHEDULED';end if;update ac_dce_releases set state='cancelled' where id=z.id returning * into z;
 elsif p_action='fail' then if z.state<>'scheduled' then raise exception 'NOT_SCHEDULED';end if;update ac_dce_releases set state='failed',error=left(p_error,500) where id=z.id returning * into z;
 elsif p_action in('withdraw','restore') then
  if p_action='withdraw' and (z.state<>'published' or r.published_release_id<>z.id) then raise exception 'NOT_CURRENT_RELEASE';end if;
  if p_action='restore' and (z.state not in('withdrawn','published') or p_manifest is null) then raise exception 'RESTORE_BLOCKED';end if;
  update ac_dce_releases set state=case when p_action='withdraw' then 'withdrawn' else 'published' end,published_at=case when p_action='restore' then now() else published_at end where id=z.id returning * into z;
  update ac_dce_records set published_release_id=case when p_action='restore' then z.id else null end,revision=revision+1,updated_by=p_actor,updated_at=now() where id=r.id returning * into r;insert into ac_dce_versions(record_id,revision,snapshot,actor_id) values(r.id,r.revision,to_jsonb(r),p_actor);
 else raise exception 'UNKNOWN_ACTION';end if;
 insert into ac_dce_events(channel,action,record_id,actor_id,request_id,data,tenant_id,territory_id) values('admin',p_action,r.id,p_actor,p_request,jsonb_build_object('releaseId',z.id,'revision',z.revision),p_tenant,p_territory);
 reply:=jsonb_build_object('release',to_jsonb(z),'receipt',p_request);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;

create or replace function public.ac_dce_reschedule(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_schedule timestamptz) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare z ac_dce_releases;r ac_dce_records;c ac_dce_commands;reply jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));
 select * into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;
 if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 if p_schedule is null or p_schedule<=now() then raise exception 'FUTURE_DATE_REQUIRED';end if;
 select * into z from ac_dce_releases where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if not found then raise exception 'NOT_FOUND';end if;if z.state<>'scheduled' then raise exception 'NOT_SCHEDULED';end if;
 select * into r from ac_dce_records where id=z.record_id for update;
 if r.revision<>z.revision or r.lifecycle<>'approved' then raise exception 'REVISION_CONFLICT';end if;
 update ac_dce_releases set scheduled_at=p_schedule where id=z.id returning * into z;
 insert into ac_dce_events(channel,action,record_id,actor_id,request_id,data,tenant_id,territory_id) values('admin','reschedule',r.id,p_actor,p_request,jsonb_build_object('releaseId',z.id,'scheduledAt',z.scheduled_at),p_tenant,p_territory);
 reply:=jsonb_build_object('release',to_jsonb(z),'receipt',p_request);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;
comment on function public.ac_dce_reschedule(text,text,text,uuid,text,uuid,timestamptz) is 'ANGELCARE_DCE_ADMIN_R2';
revoke all on function public.ac_dce_reschedule(text,text,text,uuid,text,uuid,timestamptz) from public;
do $$ begin
 if exists(select 1 from pg_roles where rolname='anon') then revoke all on function public.ac_dce_reschedule(text,text,text,uuid,text,uuid,timestamptz) from anon;end if;
 if exists(select 1 from pg_roles where rolname='authenticated') then revoke all on function public.ac_dce_reschedule(text,text,text,uuid,text,uuid,timestamptz) from authenticated;end if;
 if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.ac_dce_reschedule(text,text,text,uuid,text,uuid,timestamptz) to service_role;end if;
end $$;

create or replace function public.ac_dce_import_line(p_actor text,p_tenant text,p_territory text,p_id uuid,p_action text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare l ac_dce_job_lines; j ac_dce_jobs; r ac_dce_records; reply jsonb; p jsonb;
begin
 select * into l from ac_dce_job_lines where id=p_id for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into j from ac_dce_jobs where id=l.job_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;
 if p_action='apply' then
  if l.state='applied' then return to_jsonb(l);end if;if l.state<>'ready' then raise exception 'LINE_NOT_READY';end if;p:=l.prepared;
  if nullif(p->>'id','') is not null then select * into r from ac_dce_records where id=(p->>'id')::uuid and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;if r.revision<>(p->>'revision')::int then raise exception 'REVISION_CONFLICT';end if;end if;
  reply:=ac_dce_write(p_actor,p_tenant,p_territory,l.id,md5(p::text),'save',nullif(p->>'id','')::uuid,coalesce((p->>'revision')::int,0),p->'record',coalesce(p->'refs','{}'));
  update ac_dce_job_lines set state='applied',before_snapshot=case when r.id is not null then to_jsonb(r) end,after_snapshot=reply->'record',error=null,updated_at=now() where id=l.id returning * into l;
 elsif p_action='rollback' then
  if l.state='rolled_back' then return to_jsonb(l);end if;if l.state<>'applied' then raise exception 'LINE_NOT_APPLIED';end if;
  select * into r from ac_dce_records where id=(l.after_snapshot->>'id')::uuid for update;
  if not found or r.revision<>(l.after_snapshot->>'revision')::int or r.data is distinct from l.after_snapshot->'data' or r.published_release_id is distinct from nullif(l.after_snapshot->>'published_release_id','')::uuid then raise exception 'LATER_EDIT_BLOCKED';end if;
  if l.before_snapshot is null then if exists(select 1 from ac_dce_links where target_type='record' and target_id=r.id) then raise exception 'DEPENDENCY_BLOCKED';end if;delete from ac_dce_records where id=r.id;
  else p:=l.before_snapshot;update ac_dce_records set data=p->'data',title=p->>'title',family=p->>'family',topic=p->>'topic',audience=p->>'audience',lifecycle=case when p->>'lifecycle' in('review','approved') then 'draft' else p->>'lifecycle' end,revision=revision+1,updated_by=p_actor,updated_at=now() where id=r.id returning * into r;insert into ac_dce_versions(record_id,revision,snapshot,actor_id) values(r.id,r.revision,to_jsonb(r),p_actor);delete from ac_dce_links where record_id=r.id;end if;
  update ac_dce_job_lines set state='rolled_back',updated_at=now() where id=l.id returning * into l;
 else raise exception 'UNKNOWN_ACTION';end if;
 update ac_dce_jobs set state=case when exists(select 1 from ac_dce_job_lines where job_id=j.id and state in('ready','invalid','failed','conflict')) then 'partial' when p_action='rollback' then 'rolled_back' else 'applied' end,updated_at=now() where id=j.id;
 insert into ac_dce_events(channel,action,actor_id,data,tenant_id,territory_id) values('admin','import_'||p_action,p_actor,jsonb_build_object('jobId',j.id,'lineId',l.id),p_tenant,p_territory);return to_jsonb(l);
end $$;
create or replace function public.ac_dce_import_links() returns trigger language plpgsql set search_path=public,pg_temp as $$ declare k text;v jsonb; begin
 if new.state='rolled_back' and new.before_snapshot is not null then for k,v in select * from jsonb_each(coalesce(new.prepared->'refsBefore','{}')) loop insert into ac_dce_links select (new.before_snapshot->>'id')::uuid,k,x::uuid from jsonb_array_elements_text(v) x on conflict do nothing;end loop;insert into ac_dce_links(record_id,target_type,target_id) select (new.before_snapshot->>'id')::uuid,case bucket when 'records' then 'record' when 'offers' then 'offer' else 'media' end,key::uuid from ac_dce_releases z cross join(values('media'),('records'),('offers')) kinds(bucket) cross join lateral jsonb_object_keys(coalesce(z.manifest->'bindings'->bucket,'{}')) as key where z.record_id=(new.before_snapshot->>'id')::uuid and z.state in('published','scheduled','withdrawn') on conflict do nothing;end if;return new;end $$;
create or replace function public.ac_dce_prepare_import(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_task text,p_family text,p_name text,p_source_hash text,p_lines jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c ac_dce_commands;j jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));
 select * into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;
 if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 j:=ac_dce_create_import(p_actor,p_tenant,p_territory,p_task,p_family,p_name,p_source_hash,p_lines);
 insert into ac_dce_commands values(p_request,p_actor,p_hash,j,now());return j;
end $$;
comment on function public.ac_dce_prepare_import(text,text,text,uuid,text,text,text,text,text,jsonb) is 'ANGELCARE_DCE_ADMIN_R2';
revoke all on function public.ac_dce_prepare_import(text,text,text,uuid,text,text,text,text,text,jsonb) from public;
do $$begin
 if exists(select 1 from pg_roles where rolname='anon') then revoke all on function public.ac_dce_prepare_import(text,text,text,uuid,text,text,text,text,text,jsonb) from anon;end if;
 if exists(select 1 from pg_roles where rolname='authenticated') then revoke all on function public.ac_dce_prepare_import(text,text,text,uuid,text,text,text,text,text,jsonb) from authenticated;end if;
 if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.ac_dce_prepare_import(text,text,text,uuid,text,text,text,text,text,jsonb) to service_role;end if;
end $$;

-- Only state/timestamps/error can change after creation. Legacy releases keep their original bytes.
create or replace function public.ac_dce_release_guard() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.record_id is distinct from old.record_id or new.revision is distinct from old.revision or new.snapshot is distinct from old.snapshot or new.manifest is distinct from old.manifest or new.validation is distinct from old.validation or new.tenant_id is distinct from old.tenant_id or new.territory_id is distinct from old.territory_id then raise exception 'RELEASE_DEFINITION_IMMUTABLE';end if;
 return new;
end $$;
comment on function public.ac_dce_release_guard() is 'ANGELCARE_DCE_ADMIN_R2';
drop trigger if exists ac_dce_release_guard_trigger on public.ac_dce_releases;
create trigger ac_dce_release_guard_trigger before update on public.ac_dce_releases for each row execute function public.ac_dce_release_guard();
create or replace function public.ac_dce_link_release() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare bucket text; k text; begin
 foreach bucket in array array['media','records','offers'] loop
  for k in select jsonb_object_keys(coalesce(new.manifest->'bindings'->bucket,'{}')) loop
   insert into ac_dce_links(record_id,target_type,target_id) values(new.record_id,case bucket when 'records' then 'record' when 'offers' then 'offer' else 'media' end,k::uuid) on conflict do nothing;
  end loop;
 end loop;
 return new;
end $$;
comment on function public.ac_dce_link_release() is 'ANGELCARE_DCE_ADMIN_R2';
drop trigger if exists ac_dce_link_release_trigger on public.ac_dce_releases;
create trigger ac_dce_link_release_trigger after insert on public.ac_dce_releases for each row execute function public.ac_dce_link_release();
-- Preserve references needed to inspect/restore existing releases.
insert into public.ac_dce_links(record_id,target_type,target_id)
 select z.record_id,case bucket when 'records' then 'record' when 'offers' then 'offer' else 'media' end,key::uuid
 from public.ac_dce_releases z cross join (values('media'),('records'),('offers')) kinds(bucket)
 cross join lateral jsonb_object_keys(coalesce(z.manifest->'bindings'->bucket,'{}')) as key
 where z.state in('published','scheduled','withdrawn') on conflict do nothing;
-- Existing RPC signatures and R1 ownership comments remain stable for baseline compatibility.
comment on function public.ac_dce_write(text,text,text,uuid,text,text,uuid,int,jsonb,jsonb) is 'ANGELCARE_DCE_ADMIN_R1';
comment on function public.ac_dce_release_action(text,text,text,uuid,text,uuid,text,jsonb,text) is 'ANGELCARE_DCE_ADMIN_R1';
revoke all on function public.ac_dce_release_guard() from public;
revoke all on function public.ac_dce_link_release() from public;
do $$ begin
 if exists(select 1 from pg_roles where rolname='anon') then revoke all on function public.ac_dce_release_guard(),public.ac_dce_link_release() from anon;end if;
 if exists(select 1 from pg_roles where rolname='authenticated') then revoke all on function public.ac_dce_release_guard(),public.ac_dce_link_release() from authenticated;end if;
 if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.ac_dce_release_guard(),public.ac_dce_link_release() to service_role;end if;
end $$;
create or replace function public.ac_dce_analytics(p_tenant text,p_territory text,p_since timestamptz,p_until timestamptz,p_dimension text,p_filters jsonb default '{}',p_page int default 1) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_dimension not in('action','record_id','audience','source','locale','device','region','family','topic','assetId') then raise exception 'UNKNOWN_DIMENSION';end if;
 if p_until<=p_since or p_until-p_since>interval '366 days' then raise exception 'INVALID_REPORT_WINDOW';end if;
 with e as(
  select ev.*,case p_dimension when 'action' then ev.action when 'record_id' then ev.record_id::text else coalesce(ev.data->>p_dimension,'unknown') end dimension
  from ac_dce_events ev where ev.channel='experience' and ev.tenant_id is not distinct from p_tenant and ev.territory_id is not distinct from p_territory and ev.created_at>=p_since and ev.created_at<p_until
  and not exists(select 1 from jsonb_each_text(p_filters) f where f.key in('audience','source','locale','device','region','family','topic','assetId') and f.value<>'' and coalesce(ev.data->>f.key,'unknown')<>f.value)
 ),b as(select dimension,count(*) n,count(*) filter(where action='complete') completions,count(*) filter(where action='action_failed') failures from e group by dimension),paged as(select * from b order by n desc,dimension limit 50 offset(greatest(1,p_page)-1)*50)
 select jsonb_build_object('totalEvents',(select count(*) from e),'totalBuckets',(select count(*) from b),'rows',coalesce((select jsonb_agg(jsonb_build_object('value',b.dimension,'label',case when p_dimension='record_id' then coalesce(r.title,b.dimension) else b.dimension end,'count',b.n,'completions',b.completions,'failures',b.failures) order by b.n desc,b.dimension) from paged b left join ac_dce_records r on r.id::text=b.dimension and r.tenant_id is not distinct from p_tenant and r.territory_id is not distinct from p_territory),'[]'),'byAction',coalesce((select jsonb_object_agg(action,n) from(select action,count(*) n from e group by action)a),'{}'),'source','ac_dce_events:experience','complete',true,'page',greatest(1,p_page),'pageSize',50,'since',p_since,'until',p_until,'timeZone','UTC','checkedAt',now()) into result;
 return result;
end $$;
comment on function public.ac_dce_analytics(text,text,timestamptz,timestamptz,text,jsonb,int) is 'ANGELCARE_DCE_ADMIN_R2';
revoke all on function public.ac_dce_analytics(text,text,timestamptz,timestamptz,text,jsonb,int) from public;
do $$begin
 if exists(select 1 from pg_roles where rolname='anon') then revoke all on function public.ac_dce_analytics(text,text,timestamptz,timestamptz,text,jsonb,int) from anon;end if;
 if exists(select 1 from pg_roles where rolname='authenticated') then revoke all on function public.ac_dce_analytics(text,text,timestamptz,timestamptz,text,jsonb,int) from authenticated;end if;
 if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.ac_dce_analytics(text,text,timestamptz,timestamptz,text,jsonb,int) to service_role;end if;
end $$;

create or replace function public.ac_dce_dashboard_counts(p_tenant text,p_territory text) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 with r as(select * from ac_dce_records where kind='experience' and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory), z as(select * from ac_dce_releases where tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory)
 select jsonb_build_object('pipeline',coalesce((select jsonb_object_agg(family,jsonb_build_object('draft',draft,'released',released,'scheduled',(select count(*) from z where state='scheduled' and snapshot->>'family'=counts.family))) from(select family,count(*) filter(where lifecycle='draft') draft,count(*) filter(where published_release_id is not null) released from r where family is not null group by family) counts),'{}'),'releaseStates',coalesce((select jsonb_object_agg(state,n) from(select state,count(*) n from z group by state) counts),'{}'),'upcoming',coalesce((select jsonb_agg(to_jsonb(next)) from(select id,record_id,revision,snapshot,state,scheduled_at,created_at from z where state='scheduled' order by scheduled_at,id limit 4) next),'[]'),'inventoryComplete',true)
$$;
comment on function public.ac_dce_dashboard_counts(text,text) is 'ANGELCARE_DCE_ADMIN_R2';
revoke all on function public.ac_dce_dashboard_counts(text,text) from public;
do $$begin
 if exists(select 1 from pg_roles where rolname='anon') then revoke all on function public.ac_dce_dashboard_counts(text,text) from anon;end if;
 if exists(select 1 from pg_roles where rolname='authenticated') then revoke all on function public.ac_dce_dashboard_counts(text,text) from authenticated;end if;
 if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.ac_dce_dashboard_counts(text,text) to service_role;end if;
end $$;
notify pgrst,'reload schema';
commit;
