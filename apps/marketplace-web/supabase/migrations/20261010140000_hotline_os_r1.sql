-- AngelCare Hotline OS R1. Service-only authority; run in SQL editor as an owner.
-- Does not alter catalogue, orders, payments, family support or existing Connect records.
begin;
create table if not exists public.ac_hotline_settings (
 id boolean primary key default true check(id),draft jsonb not null default '{}',revision integer not null default 0,
 active_version_id uuid,worker_heartbeat timestamptz,updated_at timestamptz not null default now());
create table if not exists public.ac_hotline_versions (
 id uuid primary key default gen_random_uuid(),config jsonb not null,published_by uuid not null,created_at timestamptz not null default now());
create table if not exists public.ac_hotline_audio (
 id uuid primary key default gen_random_uuid(),label text not null,locale text not null check(locale in('ar','fr','en','all')),
 purpose text not null check(purpose in('greeting','menu','closed','error','music')),transcript text not null default '',
 status text not null default 'uploading' check(status in('uploading','ready','archived','failed')),sha256 text not null default '',
 duration_seconds numeric not null default 0,size_bytes bigint not null,mime_type text not null default 'audio/mpeg' check(mime_type='audio/mpeg'),
 storage_key text,created_by uuid not null,created_at timestamptz not null default now());
create table if not exists public.ac_hotline_agents (
 actor_id uuid primary key,display_name text not null,locales text[] not null default array['fr'],queues text[] not null default array['general'],
 constraint ac_hotline_agent_locales check(locales<@array['ar','fr','en']::text[] and cardinality(locales)>0),constraint ac_hotline_agent_queues check(queues<@array['family','commerce','academy','b2b','access','finance','quality','general']::text[] and cardinality(queues)>0),
 status text not null default 'offline' check(status in('ready','busy','away','offline')),enabled boolean not null default false,
 heartbeat_at timestamptz not null default now(),current_session_id uuid);
create table if not exists public.ac_hotline_cases (
 id uuid primary key default gen_random_uuid(),public_reference text not null unique,customer_id uuid,
 guest_hash text not null,display_name text not null default '',contact text not null default '',locale text not null check(locale in('ar','fr','en')),
 queue_key text not null,subject text not null,details text not null default '',
 status text not null default 'open' check(status in('open','assigned','in_progress','waiting_customer','waiting_operations','resolved','closed','reopened')),
 priority text not null default 'normal' check(priority in('normal','high')),classification text not null default '',assigned_to uuid,
 follow_up_at timestamptz,native_kind text not null default '',native_reference text not null default '',
 retention_hold boolean not null default false,version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.ac_hotline_sessions (
 id uuid primary key default gen_random_uuid(),public_reference text not null unique,case_id uuid not null references public.ac_hotline_cases(id),
 guest_hash text not null,locale text not null check(locale in('ar','fr','en')),queue_key text not null,
 channel text not null check(channel in('voice','chat')),state text not null check(state in('queued','offered','connecting','connected','ended','abandoned','failed','callback','message')),
 agent_id uuid,version_id uuid not null references public.ac_hotline_versions(id),room_name text not null unique,
 context jsonb not null default '{}',display_name text not null default '',contact text not null default '',
 heartbeat_at timestamptz not null default now(),agent_heartbeat_at timestamptz,offer_expires_at timestamptz,
 connected_at timestamptz,ended_at timestamptz,expires_at timestamptz not null,held boolean not null default false,
 created_at timestamptz not null default now());
create unique index if not exists ac_hotline_one_live_guest on public.ac_hotline_sessions(guest_hash) where state in('queued','offered','connecting','connected');
create index if not exists ac_hotline_dispatch on public.ac_hotline_sessions(state,created_at);
create index if not exists ac_hotline_customer_cases on public.ac_hotline_cases(customer_id,created_at desc);
create index if not exists ac_hotline_cases_work on public.ac_hotline_cases(status,follow_up_at,created_at);
create table if not exists public.ac_hotline_events (
 id uuid primary key default gen_random_uuid(),case_id uuid references public.ac_hotline_cases(id) on delete cascade,
 session_id uuid references public.ac_hotline_sessions(id) on delete cascade,actor_id uuid,kind text not null,
 body text not null default '',visible_to_customer boolean not null default false,created_at timestamptz not null default now());
create index if not exists ac_hotline_event_timeline on public.ac_hotline_events(case_id,created_at);
create table if not exists public.ac_hotline_rate_limits (key text primary key,window_start timestamptz not null,count integer not null);
create table if not exists public.ac_hotline_audit (id uuid primary key default gen_random_uuid(),actor_id uuid,action text not null,object_id uuid,metadata jsonb not null default '{}',created_at timestamptz not null default now());

create or replace function public.ac_hotline_rate(p_key text,p_limit integer,p_window integer) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer;
begin
 insert into ac_hotline_rate_limits(key,window_start,count) values(p_key,now(),1)
 on conflict(key) do update set count=case when ac_hotline_rate_limits.window_start<now()-make_interval(secs=>p_window) then 1 else ac_hotline_rate_limits.count+1 end,
 window_start=case when ac_hotline_rate_limits.window_start<now()-make_interval(secs=>p_window) then now() else ac_hotline_rate_limits.window_start end returning count into n;
 return n<=p_limit;
end $$;

create or replace function public.ac_hotline_config(p_config jsonb,p_actor uuid,p_expected integer,p_publish boolean) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s ac_hotline_settings;v uuid;
begin
 perform pg_advisory_xact_lock(817510);
 select * into s from ac_hotline_settings where id for update;
 if not found or s.revision<>p_expected then raise exception 'STALE_REVISION';end if;
 if p_publish then insert into ac_hotline_versions(config,published_by) values(p_config,p_actor) returning id into v;else v:=s.active_version_id;end if;
 update ac_hotline_settings set draft=p_config,revision=revision+1,active_version_id=v,updated_at=now() where id;
 insert into ac_hotline_audit(actor_id,action,object_id) values(p_actor,case when p_publish then 'config.published' else 'config.draft_saved' end,v);
 return jsonb_build_object('revision',s.revision+1,'active_version_id',v);
end $$;

create or replace function public.ac_hotline_receive(p_guest text,p_customer uuid,p_version uuid,p_data jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s ac_hotline_sessions;c ac_hotline_cases;cfg jsonb;q text;st text;ref text;is_open boolean;
begin
 perform pg_advisory_xact_lock(817510);
 select * into s from ac_hotline_sessions where guest_hash=p_guest and state in('queued','offered','connecting','connected') for update;
 if found then return to_jsonb(s)-'guest_hash';end if;
 select config into cfg from ac_hotline_versions where id=p_version;
 if not found or not exists(select 1 from ac_hotline_settings where id and active_version_id=p_version) or coalesce((cfg->>'enabled')::boolean,false)=false then raise exception 'HOTLINE_UNAVAILABLE';end if;
 q:=p_data->>'queue';if q not in('family','commerce','academy','b2b','access','finance','quality','general') then raise exception 'INVALID_QUEUE';end if;
 st:=p_data->>'state';if st not in('queued','callback','message') then raise exception 'INVALID_STATE';end if;
 if st='queued' then
 select exists(select 1 from jsonb_array_elements(cfg->'hours') h where extract(epoch from ((now() at time zone 'UTC')::time))/3600 >=(h->>'start')::numeric and extract(epoch from ((now() at time zone 'UTC')::time))/3600 <(h->>'end')::numeric) and not (cfg->'holidayDates' ? to_char(now() at time zone 'UTC','YYYY-MM-DD')) into is_open;
 if not is_open or not exists(select 1 from ac_hotline_settings where id and worker_heartbeat>now()-interval '25 seconds') or not exists(select 1 from ac_hotline_agents where enabled and status in('ready','busy') and heartbeat_at>now()-interval '45 seconds' and p_data->>'locale'=any(locales) and q=any(queues)) or (select count(*) from ac_hotline_sessions where state='queued')>=least((cfg->>'maxQueue')::integer,500) then raise exception 'QUEUE_UNAVAILABLE';end if;
 end if;
 ref:='HL-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 insert into ac_hotline_cases(public_reference,customer_id,guest_hash,display_name,contact,locale,queue_key,subject,details,follow_up_at,native_reference,native_kind)
 values(ref,p_customer,p_guest,left(p_data->>'name',120),left(p_data->>'contact',180),p_data->>'locale',q,left(p_data->>'subject',200),left(p_data->>'details',3000),nullif(p_data->>'followUp','')::timestamptz,left(coalesce(p_data->>'reference',''),120),'unverified_customer_reference') returning * into c;
 update ac_hotline_cases set classification=case when st='callback' then 'callback_requested' when st='message' then 'message_received' else '' end where id=c.id;
 insert into ac_hotline_sessions(public_reference,case_id,guest_hash,locale,queue_key,channel,state,version_id,room_name,context,display_name,contact,expires_at)
 values(ref,c.id,p_guest,p_data->>'locale',q,p_data->>'channel',st,p_version,'ac-hotline-'||gen_random_uuid()::text,coalesce(p_data->'context','{}'),c.display_name,c.contact,now()+make_interval(secs=>least((cfg->>'maxWaitSeconds')::integer,3600))) returning * into s;
 insert into ac_hotline_events(case_id,session_id,kind,body,visible_to_customer) values(c.id,s.id,'received',ref,true);
 return to_jsonb(s)-'guest_hash';
end $$;

create or replace function public.ac_hotline_dispatch() returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s ac_hotline_sessions;a ac_hotline_agents;cfg jsonb;assigned integer:=0;
begin
 perform pg_advisory_xact_lock(817510);
 update ac_hotline_settings set worker_heartbeat=now() where id;
 -- Timed offers return to reception. Availability and customer liveness are measured, never fabricated.
 for s in select * from ac_hotline_sessions where state in('queued','offered','connecting','connected') for update loop
  select config into cfg from ac_hotline_versions where id=s.version_id;
  if s.heartbeat_at<now()-make_interval(secs=>coalesce((cfg->>'reconnectSeconds')::integer,90)) or (s.state='queued' and s.expires_at<now()) or (s.state in('connecting','connected') and coalesce(s.agent_heartbeat_at,s.offer_expires_at,s.created_at)<now()-interval '60 seconds') then
   update ac_hotline_sessions set state=case when s.state='queued' then 'abandoned' else 'failed' end,ended_at=now(),held=false where id=s.id;
   update ac_hotline_agents set current_session_id=null,status='away' where current_session_id=s.id;
   insert into ac_hotline_events(case_id,session_id,kind,body,visible_to_customer) values(s.case_id,s.id,'connection_ended','Connection expired',true);
  elsif s.state='offered' and s.offer_expires_at<now() then
   update ac_hotline_agents set current_session_id=null,status='away' where current_session_id=s.id;
   update ac_hotline_sessions set state='queued',agent_id=null,offer_expires_at=null where id=s.id;
  end if;
 end loop;
 update ac_hotline_agents set status='offline' where heartbeat_at<now()-interval '45 seconds' and current_session_id is null;
 for s in select * from ac_hotline_sessions where state='queued' and heartbeat_at>now()-interval '35 seconds' order by created_at for update skip locked loop
  select * into a from ac_hotline_agents where enabled and status='ready' and current_session_id is null and heartbeat_at>now()-interval '35 seconds' and s.locale=any(locales) and s.queue_key=any(queues) order by heartbeat_at,actor_id limit 1 for update skip locked;
  if found then
   select config into cfg from ac_hotline_versions where id=s.version_id;
   update ac_hotline_agents set status='busy',current_session_id=s.id where actor_id=a.actor_id;
   update ac_hotline_sessions set state='offered',agent_id=a.actor_id,offer_expires_at=now()+make_interval(secs=>coalesce((cfg->>'offerSeconds')::integer,25)),agent_heartbeat_at=now() where id=s.id;
   update ac_hotline_cases set assigned_to=a.actor_id,status='assigned',version=version+1,updated_at=now() where id=s.case_id;
   insert into ac_hotline_events(case_id,session_id,actor_id,kind) values(s.case_id,s.id,a.actor_id,'offered');assigned:=assigned+1;
  end if;
 end loop;
 delete from ac_hotline_rate_limits where window_start<now()-interval '2 days';
 return jsonb_build_object('assigned',assigned,'at',now());
end $$;

create or replace function public.ac_hotline_session(p_id uuid,p_actor uuid,p_guest text,p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s ac_hotline_sessions;target text;
begin
 perform pg_advisory_xact_lock(817510);
 select * into s from ac_hotline_sessions where id=p_id for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if p_guest is not null and s.guest_hash<>p_guest then raise exception 'NOT_FOUND';end if;
 if p_guest is null and (p_actor is null or s.agent_id is distinct from p_actor) then raise exception 'NOT_ASSIGNED';end if;
 if p_action='heartbeat' then
  if p_guest is not null then update ac_hotline_sessions set heartbeat_at=now() where id=p_id;else update ac_hotline_sessions set agent_heartbeat_at=now() where id=p_id;end if;
 elsif p_action='accept' then
  if p_guest is not null or s.state<>'offered' or s.offer_expires_at<now() then raise exception 'STALE_OFFER';end if;
  update ac_hotline_sessions set state='connecting',agent_heartbeat_at=now() where id=p_id;
  update ac_hotline_cases set status='in_progress',version=version+1 where id=s.case_id;
 elsif p_action='connected' then
  if s.state not in('connecting','connected') then raise exception 'INVALID_STATE';end if;
  update ac_hotline_sessions set state='connected',connected_at=coalesce(connected_at,now()) where id=p_id;
 elsif p_action in('end','decline','callback') then
  if s.state not in('queued','offered','connecting','connected') then raise exception 'INVALID_STATE';end if;
  if p_action='decline' and (p_guest is not null or s.state<>'offered') then raise exception 'INVALID_STATE';end if;
  update ac_hotline_sessions set state=case when p_action='callback' then 'callback' when p_action='decline' then 'queued' when s.state in('queued','offered') then 'abandoned' else 'ended' end,ended_at=case when p_action='decline' then null else now() end,agent_id=case when p_action='decline' then null else agent_id end,held=false where id=p_id;
  update ac_hotline_agents set current_session_id=null,status=case when p_action='decline' then 'away' else 'busy' end where current_session_id=p_id;
  if p_action='callback' then update ac_hotline_sessions set contact=left(p_payload->>'contact',180) where id=p_id;update ac_hotline_cases set follow_up_at=nullif(p_payload->>'followUp','')::timestamptz,contact=left(p_payload->>'contact',180),classification='callback_requested',version=version+1 where id=s.case_id;end if;
 elsif p_action='hold' then
  if p_guest is not null or s.state<>'connected' then raise exception 'INVALID_STATE';end if;
  update ac_hotline_sessions set held=coalesce((p_payload->>'held')::boolean,false) where id=p_id;
 elsif p_action='transfer' then
  target:=p_payload->>'queue';if p_guest is not null or s.state not in('connecting','connected') or target not in('family','commerce','academy','b2b','access','finance','quality','general') then raise exception 'INVALID_TRANSFER';end if;
  update ac_hotline_sessions set state='queued',agent_id=null,queue_key=target,held=false,room_name='ac-hotline-'||gen_random_uuid()::text,connected_at=null,agent_heartbeat_at=null,offer_expires_at=null,expires_at=now()+make_interval(secs=>coalesce((select (config->>'maxWaitSeconds')::integer from ac_hotline_versions where id=s.version_id),900)) where id=p_id;
  update ac_hotline_agents set current_session_id=null,status='busy' where current_session_id=p_id;
  update ac_hotline_cases set queue_key=target,status='open',assigned_to=null,version=version+1 where id=s.case_id;
 elsif p_action='message' then
  if length(trim(coalesce(p_payload->>'body','')))=0 or s.state not in('queued','offered','connecting','connected','callback','message') then raise exception 'INVALID_MESSAGE';end if;
 else raise exception 'UNKNOWN_ACTION';end if;
 if p_action<>'heartbeat' and p_action<>'connected' then insert into ac_hotline_events(case_id,session_id,actor_id,kind,body,visible_to_customer) values(s.case_id,s.id,p_actor,p_action,left(coalesce(p_payload->>'body',p_payload->>'queue',''),3000),p_action in('message','end','callback','hold','transfer'));end if;
 select * into s from ac_hotline_sessions where id=p_id;
 return to_jsonb(s)-'guest_hash';
end $$;

create or replace function public.ac_hotline_case(p_id uuid,p_actor uuid,p_expected integer,p_patch jsonb,p_note text,p_visible boolean) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare c ac_hotline_cases;
begin
 select * into c from ac_hotline_cases where id=p_id for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if c.version<>p_expected then raise exception 'STALE_REVISION';end if;
 if p_patch ? 'status' and p_patch->>'status' not in('open','assigned','in_progress','waiting_customer','waiting_operations','resolved','closed','reopened') then raise exception 'INVALID_STATUS';end if;
 if p_patch->>'status' in('resolved','closed') and length(trim(coalesce(p_note,'')))=0 then raise exception 'RESOLUTION_REQUIRED';end if;
 update ac_hotline_cases set status=coalesce(p_patch->>'status',status),priority=coalesce(p_patch->>'priority',priority),classification=coalesce(left(p_patch->>'classification',120),classification),
 assigned_to=case when p_patch ? 'assigned_to' then nullif(p_patch->>'assigned_to','')::uuid else assigned_to end,
 follow_up_at=case when p_patch ? 'follow_up_at' then nullif(p_patch->>'follow_up_at','')::timestamptz else follow_up_at end,
 native_kind=coalesce(left(p_patch->>'native_kind',60),native_kind),native_reference=coalesce(left(p_patch->>'native_reference',120),native_reference),
 retention_hold=case when p_patch ? 'retention_hold' then (p_patch->>'retention_hold')::boolean else retention_hold end,
 version=version+1,updated_at=now() where id=p_id returning * into c;
 insert into ac_hotline_events(case_id,actor_id,kind,body,visible_to_customer) values(p_id,p_actor,'case_updated',left(coalesce(p_note,''),3000),p_visible);
 return to_jsonb(c)-'guest_hash';
end $$;

create or replace function public.ac_hotline_purge(p_id uuid,p_actor uuid,p_reference text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare c ac_hotline_cases;
begin
 perform pg_advisory_xact_lock(817510);
 select * into c from ac_hotline_cases where id=p_id for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if c.public_reference<>p_reference or c.retention_hold or c.status<>'closed' or exists(select 1 from ac_hotline_sessions where case_id=p_id and state in('queued','offered','connecting','connected')) then raise exception 'PURGE_BLOCKED';end if;
 delete from ac_hotline_sessions where case_id=p_id;
 delete from ac_hotline_cases where id=p_id;
 insert into ac_hotline_audit(actor_id,action,object_id) values(p_actor,'case.permanently_purged',p_id);
 return true;
end $$;

create or replace function public.ac_hotline_archive_audio(p_id uuid,p_actor uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(817510);
 -- Conservative reference guard under the same publication lock; historical versions stay playable.
 if exists(select 1 from ac_hotline_versions where config::text like '%'||p_id::text||'%') or exists(select 1 from ac_hotline_settings where draft::text like '%'||p_id::text||'%') then raise exception 'AUDIO_REFERENCED';end if;
 update ac_hotline_audio set status='archived' where id=p_id and status in('ready','failed','uploading');
 if not found then raise exception 'NOT_FOUND';end if;
 insert into ac_hotline_audit(actor_id,action,object_id) values(p_actor,'audio.archived',p_id);
 return true;
end $$;

-- No anonymous direct reads or executable RPCs. Next.js resolves caller/agent ownership first.
do $$ declare t text;f record;begin
 foreach t in array array['settings','versions','audio','agents','cases','sessions','events','rate_limits','audit'] loop
 execute format('alter table public.ac_hotline_%I enable row level security',t);
 execute format('revoke all on public.ac_hotline_%I from public,anon,authenticated',t);
 execute format('grant all on public.ac_hotline_%I to service_role',t);
 end loop;
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='public' and p.proname in('ac_hotline_rate','ac_hotline_config','ac_hotline_receive','ac_hotline_dispatch','ac_hotline_session','ac_hotline_case','ac_hotline_purge','ac_hotline_archive_audio') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
insert into public.angelcare_marketplace_roles(role_key,name,description) values
('marketplace_hotline_agent','HOTLINE · Conseiller','Réception et dossiers attribués.'),
('marketplace_hotline_supervisor','HOTLINE · Superviseur','Réception, équipe, Studio et publication.') on conflict(role_key) do nothing;
insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive,description) values
('marketplace.hotline.view','HOTLINE · view','HOTLINE',false,'Hotline OS R1.'),
('marketplace.hotline.answer','HOTLINE · answer','HOTLINE',false,'Hotline OS R1.'),
('marketplace.hotline.manage','HOTLINE · manage','HOTLINE',false,'Hotline OS R1.'),
('marketplace.hotline.supervise','HOTLINE · supervise','HOTLINE',true,'Hotline OS R1.'),
('marketplace.hotline.settings','HOTLINE · settings','HOTLINE',true,'Hotline OS R1.'),
('marketplace.hotline.publish','HOTLINE · publish','HOTLINE',true,'Hotline OS R1.'),
('marketplace.hotline.media','HOTLINE · media','HOTLINE',true,'Hotline OS R1.'),
('marketplace.hotline.purge','HOTLINE · purge','HOTLINE',true,'Hotline OS R1.') on conflict(permission_key) do nothing;
insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key from public.angelcare_marketplace_roles r cross join public.angelcare_marketplace_permissions p
where (r.role_key='marketplace_hotline_agent' and p.permission_key in('marketplace.admin.access','marketplace.hotline.view','marketplace.hotline.answer','marketplace.hotline.manage'))
or (r.role_key='marketplace_hotline_supervisor' and (p.permission_key='marketplace.admin.access' or p.permission_key like 'marketplace.hotline.%' and p.permission_key<>'marketplace.hotline.purge'))
on conflict do nothing;

notify pgrst,'reload schema';
commit;
