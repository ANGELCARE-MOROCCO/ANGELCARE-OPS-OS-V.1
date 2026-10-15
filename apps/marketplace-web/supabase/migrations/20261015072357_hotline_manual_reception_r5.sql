-- Hotline manual reception R5. Run in the Marketplace SQL Editor as owner.
-- No daemon, cron, new server, audio upload or environment change.
begin;
set local lock_timeout='8s';
set local statement_timeout='60s';
-- Verify prerequisites before creating anything.
do $$begin
 if to_regclass('public.ac_hotline_manual_r5_backup') is not null and obj_description(to_regclass('public.ac_hotline_manual_r5_backup'),'pg_class') is distinct from 'ANGELCARE_HOTLINE_MANUAL_RECEPTION_R5' then raise exception 'UNFAMILIAR_BACKUP_TABLE_PRESERVED';end if;
 if to_regclass('public.ac_hotline_sessions') is null or to_regclass('public.ac_hotline_agents') is null or to_regprocedure('public.ac_hotline_receive(text,uuid,uuid,jsonb)') is null or to_regprocedure('public.ac_hotline_dispatch()') is null then raise exception 'HOTLINE_R1_REQUIRED';end if;
end $$;
create table if not exists public.ac_hotline_manual_r5_backup(
 id boolean primary key default true check(id),original_definitions jsonb not null,installed_definitions jsonb,created_at timestamptz not null default now());
comment on table public.ac_hotline_manual_r5_backup is 'ANGELCARE_HOTLINE_MANUAL_RECEPTION_R5';
alter table public.ac_hotline_manual_r5_backup enable row level security;
revoke all on public.ac_hotline_manual_r5_backup from public,anon,authenticated,service_role;
do $$declare definitions jsonb;current_def text;old_gate text;begin
 -- Repeat application preserves the first backup; later SQL edits are not overwritten.
 if exists(select 1 from public.ac_hotline_manual_r5_backup where id and installed_definitions is not null) then
  for current_def in select key from jsonb_each((select installed_definitions from public.ac_hotline_manual_r5_backup where id)) loop
   if pg_get_functiondef(to_regprocedure(current_def)) is distinct from (select installed_definitions->>current_def from public.ac_hotline_manual_r5_backup where id) then raise exception 'LATER_SQL_EDIT_PRESERVED: %',current_def;end if;
  end loop;
 else
  if to_regprocedure('public.ac_hotline_pickup_r5(uuid,uuid)') is not null or to_regprocedure('public.ac_hotline_presence_r5(uuid,text)') is not null then raise exception 'UNFAMILIAR_R5_FUNCTION_PRESERVED';end if;
  select jsonb_build_object('public.ac_hotline_receive(text,uuid,uuid,jsonb)',pg_get_functiondef('public.ac_hotline_receive(text,uuid,uuid,jsonb)'::regprocedure),'public.ac_hotline_dispatch()',pg_get_functiondef('public.ac_hotline_dispatch()'::regprocedure)) into definitions;
  insert into public.ac_hotline_manual_r5_backup(id,original_definitions) values(true,definitions);
 end if;
 current_def:=pg_get_functiondef('public.ac_hotline_receive(text,uuid,uuid,jsonb)'::regprocedure);
 old_gate:=' or not exists(select 1 from ac_hotline_settings where id and worker_heartbeat>now()-interval ''25 seconds'') or not exists(select 1 from ac_hotline_agents where enabled and status in(''ready'',''busy'') and heartbeat_at>now()-interval ''45 seconds'' and p_data->>''locale''=any(locales) and q=any(queues))';
 if position(old_gate in current_def)>0 then
  execute replace(current_def,old_gate,'');
 elsif position('worker_heartbeat' in current_def)>0 then raise exception 'UNFAMILIAR_RECEIVE_GATE_PRESERVED';
 end if;
end $$;

-- Compatibility entry point now performs bounded lazy maintenance only. Never assigns calls.
create or replace function public.ac_hotline_dispatch() returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s ac_hotline_sessions;cfg jsonb;n integer:=0;
begin
 if not pg_try_advisory_xact_lock(817510) then return jsonb_build_object('mode','manual','skipped',true);end if;
 if exists(select 1 from ac_hotline_settings where id and worker_heartbeat>now()-interval '5 seconds') then return jsonb_build_object('mode','manual','skipped',true);end if;
 for s in select * from ac_hotline_sessions where state in('queued','offered','connecting','connected') order by heartbeat_at limit 1000 for update skip locked loop
  select config into cfg from ac_hotline_versions where id=s.version_id;
  if s.heartbeat_at<now()-make_interval(secs=>greatest(90,least(coalesce((cfg->>'reconnectSeconds')::integer,90),600))) or (s.state='queued' and s.expires_at<now()) then
   update ac_hotline_sessions set state=case when s.state in('queued','offered') then 'abandoned' else 'failed' end,ended_at=now(),held=false where id=s.id;
   update ac_hotline_agents set current_session_id=null,status='busy' where current_session_id=s.id;
   insert into ac_hotline_events(case_id,session_id,kind,body,visible_to_customer) values(s.case_id,s.id,'connection_ended','Reception expired; case retained.',true);n:=n+1;
  elsif (s.state='offered' and s.offer_expires_at<now()) or (s.state in('connecting','connected') and coalesce(s.agent_heartbeat_at,s.created_at)<now()-interval '90 seconds') or (s.state='connecting' and s.offer_expires_at<now()) then
   update ac_hotline_agents set current_session_id=null,status='busy' where current_session_id=s.id;
   update ac_hotline_sessions set state='queued',agent_id=null,offer_expires_at=null,agent_heartbeat_at=null,connected_at=null,held=false,room_name='ac-hotline-'||gen_random_uuid()::text,expires_at=now()+make_interval(secs=>greatest(60,least(coalesce((cfg->>'maxWaitSeconds')::integer,900),3600))) where id=s.id;
   update ac_hotline_cases set assigned_to=null,status='open',version=version+1,updated_at=now() where id=s.case_id;
   insert into ac_hotline_events(case_id,session_id,kind,body,visible_to_customer) values(s.case_id,s.id,'returned_to_hold','Audio connection not completed; request retained in reception.',true);n:=n+1;
  end if;
 end loop;
 update ac_hotline_agents set status='offline' where heartbeat_at<now()-interval '90 seconds' and current_session_id is null and status<>'offline';
 update ac_hotline_settings set worker_heartbeat=now() where id;
 delete from ac_hotline_rate_limits where window_start<now()-interval '2 days';
 return jsonb_build_object('mode','manual','assigned',0,'maintained',n);
end $$;

create or replace function public.ac_hotline_presence_r5(p_actor uuid,p_status text default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare a ac_hotline_agents;begin
 perform pg_advisory_xact_lock(817510);
 if p_status is not null and p_status not in('ready','away','offline','busy') then raise exception 'INVALID_PRESENCE';end if;
 update ac_hotline_agents set heartbeat_at=now(),status=case when current_session_id is not null then 'busy' else coalesce(p_status,status) end where actor_id=p_actor returning * into a;
 if not found then raise exception 'AGENT_NOT_REGISTERED';end if;
 if a.current_session_id is not null then update ac_hotline_sessions set agent_heartbeat_at=now() where id=a.current_session_id and agent_id=p_actor and state in('offered','connecting','connected');end if;
 return to_jsonb(a);
end $$;

create or replace function public.ac_hotline_pickup_r5(p_id uuid,p_actor uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s ac_hotline_sessions;a ac_hotline_agents;busy_chat boolean:=false;begin
 perform pg_advisory_xact_lock(817510);
 select * into a from ac_hotline_agents where actor_id=p_actor for update;
 if not found or not a.enabled then raise exception 'AGENT_COVERAGE_REQUIRED';end if;
 select * into s from ac_hotline_sessions where id=p_id for update;
 if not found then raise exception 'NOT_FOUND';end if;
 -- Retrying the same successful pickup is idempotent; it never creates another room.
 if s.agent_id=p_actor and s.state in('connecting','connected') then return to_jsonb(s)-'guest_hash';end if;
 if s.state<>'queued' or s.channel<>'voice' or s.heartbeat_at<now()-interval '90 seconds' or s.expires_at<now() then raise exception 'PICKUP_UNAVAILABLE';end if;
 if s.locale<>all(a.locales) or s.queue_key<>all(a.queues) then raise exception 'AGENT_COVERAGE_REQUIRED';end if;
 if a.current_session_id is not null then raise exception 'AGENT_ALREADY_IN_CALL';end if;
 -- Shared text reception remains protected without requiring the chat extension.
 if to_regclass('public.ac_hotline_chat_threads') is not null then
  execute 'select exists(select 1 from public.ac_hotline_chat_threads t join public.ac_hotline_cases c on c.id=t.case_id where c.assigned_to=$1 and t.state not in(''resolved'',''closed''))' into busy_chat using p_actor;
 end if;
 if busy_chat then raise exception 'ACTIVE_CHAT_REQUIRES_HANDOFF';end if;
 update ac_hotline_agents set current_session_id=s.id,status='busy',heartbeat_at=now() where actor_id=p_actor;
 update ac_hotline_sessions set state='connecting',agent_id=p_actor,agent_heartbeat_at=now(),offer_expires_at=now()+interval '120 seconds' where id=s.id returning * into s;
 update ac_hotline_cases set assigned_to=p_actor,status='in_progress',version=version+1,updated_at=now() where id=s.case_id;
 insert into ac_hotline_events(case_id,session_id,actor_id,kind,body,visible_to_customer) values(s.case_id,s.id,p_actor,'picked_up','ANGELCARE HOTLINE',true);
 insert into ac_hotline_audit(actor_id,action,object_id) values(p_actor,'reception.picked_up',s.id);
 return to_jsonb(s)-'guest_hash';
end $$;
revoke all on function public.ac_hotline_dispatch(),public.ac_hotline_presence_r5(uuid,text),public.ac_hotline_pickup_r5(uuid,uuid) from public,anon,authenticated;
grant execute on function public.ac_hotline_dispatch(),public.ac_hotline_presence_r5(uuid,text),public.ac_hotline_pickup_r5(uuid,uuid) to service_role;
update public.ac_hotline_manual_r5_backup set installed_definitions=jsonb_build_object(
 'public.ac_hotline_receive(text,uuid,uuid,jsonb)',pg_get_functiondef('public.ac_hotline_receive(text,uuid,uuid,jsonb)'::regprocedure),
 'public.ac_hotline_dispatch()',pg_get_functiondef('public.ac_hotline_dispatch()'::regprocedure),
 'public.ac_hotline_presence_r5(uuid,text)',pg_get_functiondef('public.ac_hotline_presence_r5(uuid,text)'::regprocedure),
 'public.ac_hotline_pickup_r5(uuid,uuid)',pg_get_functiondef('public.ac_hotline_pickup_r5(uuid,uuid)'::regprocedure)) where id;
notify pgrst,'reload schema';
commit;
select 'HOTLINE_MANUAL_RECEPTION_R5=APPLIED' as result;
