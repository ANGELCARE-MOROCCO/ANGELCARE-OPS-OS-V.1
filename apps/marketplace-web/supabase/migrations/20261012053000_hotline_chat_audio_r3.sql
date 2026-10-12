-- Hotline Chat + MP3 mapping R3. Run separately in Supabase SQL editor.
-- No catalog, auth-user, payment or gateway mutation. Transactional/service-only.
begin;
do $$ begin
 if to_regclass('public.ac_hotline_cases') is null or to_regclass('public.ac_hotline_audio') is null then raise exception 'Install Hotline OS R1 first';end if;
end $$;
do $$ begin
 if to_regclass('public.ac_hotline_chat_threads') is not null and obj_description(to_regclass('public.ac_hotline_chat_threads'),'pg_class') is distinct from 'ANGELCARE_HOTLINE_CHAT_AUDIO_R3' then raise exception 'Existing chat threads table preserved: different marker';end if;
 if to_regclass('public.ac_hotline_chat_messages') is not null and obj_description(to_regclass('public.ac_hotline_chat_messages'),'pg_class') is distinct from 'ANGELCARE_HOTLINE_CHAT_AUDIO_R3' then raise exception 'Existing chat messages table preserved: different marker';end if;
end $$;
create table if not exists public.ac_hotline_chat_threads (
 id uuid primary key default gen_random_uuid(),case_id uuid not null unique references public.ac_hotline_cases(id) on delete cascade,
 guest_hash text not null,receive_nonce uuid not null,locale text not null check(locale in('ar','fr','en')),
 queue_key text not null check(queue_key in('family','commerce','academy','b2b','access','finance','quality','general')),
 state text not null default 'queued' check(state in('queued','active','waiting_customer','resolved','closed')),
 version integer not null default 1,customer_read_seq bigint not null default 0,agent_read_seq bigint not null default 0,
 customer_typing_until timestamptz,agent_typing_until timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(guest_hash,receive_nonce));
create unique index if not exists ac_hotline_chat_one_open_guest on public.ac_hotline_chat_threads(guest_hash) where state not in('resolved','closed');
create index if not exists ac_hotline_chat_queue_r3 on public.ac_hotline_chat_threads(state,queue_key,updated_at);
create table if not exists public.ac_hotline_chat_messages (
 id uuid primary key default gen_random_uuid(),seq bigint generated always as identity unique,
 thread_id uuid not null references public.ac_hotline_chat_threads(id) on delete cascade,
 event_id uuid not null references public.ac_hotline_events(id) on delete cascade,
 sender text not null check(sender in('customer','hotline','internal','system')),actor_id uuid,
 body text not null check(length(body) between 1 and 3000),nonce uuid not null,created_at timestamptz not null default now(),unique(thread_id,sender,nonce));
create index if not exists ac_hotline_chat_messages_page_r3 on public.ac_hotline_chat_messages(thread_id,seq desc);
alter table public.ac_hotline_chat_threads enable row level security;
alter table public.ac_hotline_chat_messages enable row level security;
revoke all on public.ac_hotline_chat_threads,public.ac_hotline_chat_messages from public,anon,authenticated;
grant all on public.ac_hotline_chat_threads,public.ac_hotline_chat_messages to service_role;
grant usage,select on sequence public.ac_hotline_chat_messages_seq_seq to service_role;

create or replace function public.ac_hotline_audio_classify_r3(p_id uuid,p_actor uuid,p_locale text,p_purpose text) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare a public.ac_hotline_audio;
begin
 perform 1 from public.ac_hotline_settings where id for update;
 if p_actor is null or p_locale not in('ar','fr','en','all') or p_purpose not in('greeting','menu','closed','error','music') or (p_purpose='music')<>(p_locale='all') then raise exception 'INVALID_CLASSIFICATION';end if;
 select * into a from public.ac_hotline_audio where id=p_id and status='ready' for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if a.locale=p_locale and a.purpose=p_purpose then return to_jsonb(a);end if;
 if exists(select 1 from public.ac_hotline_versions where strpos(config::text,p_id::text)>0) then raise exception 'PUBLISHED_AUDIO_IMMUTABLE';end if;
 if p_purpose<>'music' and length(trim(a.transcript))=0 then raise exception 'TRANSCRIPT_REQUIRED';end if;
 update public.ac_hotline_audio set locale=p_locale,purpose=p_purpose where id=p_id returning * into a;
 return to_jsonb(a);
end $$;

create or replace function public.ac_hotline_chat_receive_r3(p_guest text,p_customer uuid,p_nonce uuid,p_data jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare t public.ac_hotline_chat_threads;c public.ac_hotline_cases;e uuid;ref text;q text:=p_data->>'queue';l text:=p_data->>'locale';body text:=trim(p_data->>'body');
begin
 if p_guest is null or p_guest !~ '^[0-9a-f]{64}$' or p_nonce is null or q is null or l is null or q not in('family','commerce','academy','b2b','access','finance','quality','general') or l not in('ar','fr','en') or body is null or length(body) not between 1 and 3000 or coalesce((p_data->>'consent')::boolean,false)=false then raise exception 'INVALID_CHAT_REQUEST';end if;
 perform pg_advisory_xact_lock(hashtextextended('hotline-chat:'||p_guest,0));
 update public.ac_hotline_chat_threads x set state=c0.status,version=x.version+1 from public.ac_hotline_cases c0 where x.case_id=c0.id and x.guest_hash=p_guest and c0.status in('closed','resolved') and x.state not in('closed','resolved');
 select * into t from public.ac_hotline_chat_threads where guest_hash=p_guest and receive_nonce=p_nonce;
 if found then return to_jsonb(t);end if;
 select * into t from public.ac_hotline_chat_threads where guest_hash=p_guest and state not in('closed','resolved');
 if found then
  perform 1 from public.ac_hotline_cases where id=t.case_id for update;
  select * into t from public.ac_hotline_chat_threads where id=t.id for update;
  if t.state in('closed','resolved') then t.id:=null;end if;
 end if;
 if t.id is null then
 ref:='HL-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 insert into public.ac_hotline_cases(public_reference,customer_id,guest_hash,display_name,contact,locale,queue_key,subject,details,classification,native_kind,native_reference)
 values(ref,p_customer,p_guest,left(coalesce(p_data->>'name',''),120),left(coalesce(p_data->>'contact',''),180),l,q,'Chat · ANGELCARE HOTLINE',body,'chat_received','unverified_customer_reference',left(coalesce(p_data->>'reference',''),120)) returning * into c;
 insert into public.ac_hotline_chat_threads(case_id,guest_hash,receive_nonce,locale,queue_key) values(c.id,p_guest,p_nonce,l,q) returning * into t;
 end if;
 if exists(select 1 from public.ac_hotline_chat_messages where thread_id=t.id and sender='customer' and nonce=p_nonce) then return to_jsonb(t);end if;
 insert into public.ac_hotline_events(case_id,kind,body,visible_to_customer) values(t.case_id,'chat_customer',body,true) returning id into e;
 insert into public.ac_hotline_chat_messages(thread_id,event_id,sender,body,nonce) values(t.id,e,'customer',body,p_nonce);
 update public.ac_hotline_chat_threads set updated_at=now() where id=t.id returning * into t;
 return to_jsonb(t);
end $$;

create or replace function public.ac_hotline_chat_command_r3(p_id uuid,p_actor uuid,p_guest text,p_action text,p_payload jsonb,p_expected integer,p_supervisor boolean default false) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare t public.ac_hotline_chat_threads;c public.ac_hotline_cases;a public.ac_hotline_agents;e uuid;msg public.ac_hotline_chat_messages;body text;v_sender text;v_nonce uuid;target text;target_locale text;seen bigint;
begin
 select * into t from public.ac_hotline_chat_threads where id=p_id;
 if not found then raise exception 'NOT_FOUND';end if;
 select * into c from public.ac_hotline_cases where id=t.case_id for update;
 select * into t from public.ac_hotline_chat_threads where id=p_id for update;
 if p_guest is not null then if p_guest<>t.guest_hash or p_actor is not null then raise exception 'NOT_FOUND';end if;
 elsif p_actor is null then raise exception 'NOT_AUTHORIZED';
 elsif p_action<>'claim' and not p_supervisor and c.assigned_to is distinct from p_actor then raise exception 'NOT_ASSIGNED';end if;
 if p_action in('claim','transfer','close','waiting') and p_expected is distinct from t.version then raise exception 'STALE_REVISION';end if;
 if p_action='claim' then
  if p_guest is not null or t.state in('closed','resolved') or c.status in('closed','resolved') or c.assigned_to is not null and c.assigned_to<>p_actor then raise exception 'CLAIM_UNAVAILABLE';end if;
  select * into a from public.ac_hotline_agents where actor_id=p_actor and enabled and status in('ready','busy') and heartbeat_at>now()-interval '45 seconds' and t.locale=any(locales) and t.queue_key=any(queues);
  if not found then raise exception 'AGENT_COVERAGE_REQUIRED';end if;
  update public.ac_hotline_agents set status='busy' where actor_id=p_actor and current_session_id is null;
  update public.ac_hotline_cases set assigned_to=p_actor,status='in_progress',version=version+1,updated_at=now() where id=c.id;
  update public.ac_hotline_chat_threads set state='active',version=version+1,updated_at=now() where id=t.id;
  insert into public.ac_hotline_events(case_id,actor_id,kind,visible_to_customer) values(c.id,p_actor,'chat_claimed',false);
 elsif p_action in('message','note') then
  if t.state in('closed','resolved') or c.status in('closed','resolved') then raise exception 'CHAT_CLOSED';end if;
  if p_guest is null and c.assigned_to is distinct from p_actor then raise exception 'NOT_ASSIGNED';end if;
  if p_action='note' and p_guest is not null then raise exception 'NOT_AUTHORIZED';end if;
  body:=trim(p_payload->>'body');v_nonce:=(p_payload->>'nonce')::uuid;
  if v_nonce is null or body is null or length(body) not between 1 and 3000 then raise exception 'INVALID_MESSAGE';end if;
  v_sender:=case when p_guest is not null then 'customer' when p_action='note' then 'internal' else 'hotline' end;
  select * into msg from public.ac_hotline_chat_messages where thread_id=t.id and ac_hotline_chat_messages.sender=v_sender and ac_hotline_chat_messages.nonce=v_nonce;
  if found then if msg.body<>body then raise exception 'NONCE_BODY_CONFLICT';end if;return to_jsonb(t);end if;
  insert into public.ac_hotline_events(case_id,actor_id,kind,body,visible_to_customer) values(c.id,p_actor,'chat_'||v_sender,body,v_sender<>'internal') returning id into e;
  insert into public.ac_hotline_chat_messages(thread_id,event_id,sender,actor_id,body,nonce) values(t.id,e,v_sender,p_actor,body,v_nonce);
  update public.ac_hotline_chat_threads set updated_at=now(),state=case when p_guest is not null and state='waiting_customer' then 'active' else state end,version=version+1 where id=t.id;
  if p_guest is not null and c.status='waiting_customer' then update public.ac_hotline_cases set status='in_progress',version=version+1,updated_at=now() where id=c.id;end if;
 elsif p_action='read' then
  if p_guest is null and c.assigned_to is distinct from p_actor then raise exception 'NOT_ASSIGNED';end if;
  select coalesce(max(seq),0) into seen from public.ac_hotline_chat_messages where thread_id=t.id and sender<>'internal';seen:=least(seen,greatest(coalesce((p_payload->>'seq')::bigint,0),0));
  if p_guest is not null then update public.ac_hotline_chat_threads set customer_read_seq=greatest(customer_read_seq,seen) where id=t.id;else update public.ac_hotline_chat_threads set agent_read_seq=greatest(agent_read_seq,seen) where id=t.id;end if;
 elsif p_action='typing' then
  if t.state in('closed','resolved') then raise exception 'CHAT_CLOSED';end if;
  if p_guest is null and c.assigned_to is distinct from p_actor then raise exception 'NOT_ASSIGNED';end if;
  if p_guest is not null then update public.ac_hotline_chat_threads set customer_typing_until=now()+interval '6 seconds' where id=t.id;else update public.ac_hotline_chat_threads set agent_typing_until=now()+interval '6 seconds' where id=t.id;end if;
 elsif p_action='transfer' then
  if p_guest is not null or c.status in('closed','resolved') then raise exception 'NOT_AUTHORIZED';end if;
  target:=p_payload->>'queue';target_locale:=coalesce(p_payload->>'locale',t.locale);
  if target not in('family','commerce','academy','b2b','access','finance','quality','general') or target_locale not in('ar','fr','en') then raise exception 'INVALID_TRANSFER';end if;
  update public.ac_hotline_cases set queue_key=target,locale=target_locale,assigned_to=null,status='open',version=version+1,updated_at=now() where id=c.id;
  update public.ac_hotline_chat_threads set queue_key=target,locale=target_locale,state='queued',agent_read_seq=0,version=version+1,updated_at=now() where id=t.id;
  insert into public.ac_hotline_events(case_id,actor_id,kind,visible_to_customer) values(c.id,p_actor,'chat_transferred',false);
 elsif p_action in('close','waiting') then
  if p_guest is not null or c.assigned_to is distinct from p_actor and not p_supervisor then raise exception 'NOT_ASSIGNED';end if;
  body:=trim(p_payload->>'body');if p_action='close' and coalesce(length(body),0)=0 then raise exception 'RESOLUTION_REQUIRED';end if;
  update public.ac_hotline_cases set status=case when p_action='close' then 'resolved' else 'waiting_customer' end,version=version+1,updated_at=now() where id=c.id;
  update public.ac_hotline_chat_threads set state=case when p_action='close' then 'resolved' else 'waiting_customer' end,version=version+1,updated_at=now() where id=t.id;
  if coalesce(length(body),0)>0 then insert into public.ac_hotline_events(case_id,actor_id,kind,body,visible_to_customer) values(c.id,p_actor,'chat_resolution',left(body,3000),false);end if;
 else raise exception 'UNKNOWN_ACTION';end if;
 select * into t from public.ac_hotline_chat_threads where id=p_id;return to_jsonb(t);
end $$;

create or replace function public.ac_hotline_chat_list_r3(p_actor uuid,p_supervisor boolean,p_state text,p_queue text,p_query text,p_page integer) returns jsonb
language sql security definer set search_path=pg_catalog as $$
 with filtered as (
 select t.*,c.public_reference,c.display_name,c.contact,c.customer_id,c.status as case_status,c.priority,c.assigned_to,c.subject,
 (select count(*) from public.ac_hotline_chat_messages m where m.thread_id=t.id and m.sender='customer' and m.seq>t.agent_read_seq) as unread,
 (select m.body from public.ac_hotline_chat_messages m where m.thread_id=t.id and m.sender<>'internal' order by seq desc limit 1) as preview
 from public.ac_hotline_chat_threads t join public.ac_hotline_cases c on c.id=t.case_id
 where p_actor is not null and (p_supervisor or c.assigned_to=p_actor or c.assigned_to is null and exists(select 1 from public.ac_hotline_agents a where a.actor_id=p_actor and a.enabled and t.queue_key=any(a.queues) and t.locale=any(a.locales)))
 and (coalesce(p_state,'all')='all' or t.state=p_state or p_state='mine' and c.assigned_to=p_actor)
 and (coalesce(p_queue,'all')='all' or t.queue_key=p_queue)
 and (coalesce(p_query,'')='' or strpos(lower(c.public_reference||' '||c.display_name||' '||c.contact||' '||c.details),lower(left(p_query,120)))>0)
 ), page as(select * from filtered order by priority='high' desc,updated_at desc,id limit 50 offset least(greatest(p_page,0),100000)*50)
 select jsonb_build_object('total',(select count(*) from filtered),'items',coalesce((select jsonb_agg(to_jsonb(page)-'guest_hash'-'receive_nonce') from page),'[]'::jsonb));
$$;
create or replace function public.ac_hotline_chat_delete_guard_r3() returns trigger language plpgsql set search_path=pg_catalog as $$
begin if exists(select 1 from public.ac_hotline_chat_threads where case_id=old.id and state not in('closed','resolved')) then raise exception 'ACTIVE_CHAT_RETAINED';end if;return old;end $$;
drop trigger if exists ac_hotline_chat_case_delete_guard_r3 on public.ac_hotline_cases;
create trigger ac_hotline_chat_case_delete_guard_r3 before delete on public.ac_hotline_cases for each row execute function public.ac_hotline_chat_delete_guard_r3();
revoke all on function public.ac_hotline_audio_classify_r3(uuid,uuid,text,text),public.ac_hotline_chat_receive_r3(text,uuid,uuid,jsonb),public.ac_hotline_chat_command_r3(uuid,uuid,text,text,jsonb,integer,boolean),public.ac_hotline_chat_list_r3(uuid,boolean,text,text,text,integer),public.ac_hotline_chat_delete_guard_r3() from public,anon,authenticated;
grant execute on function public.ac_hotline_audio_classify_r3(uuid,uuid,text,text),public.ac_hotline_chat_receive_r3(text,uuid,uuid,jsonb),public.ac_hotline_chat_command_r3(uuid,uuid,text,text,jsonb,integer,boolean),public.ac_hotline_chat_list_r3(uuid,boolean,text,text,text,integer) to service_role;
comment on table public.ac_hotline_chat_threads is 'ANGELCARE_HOTLINE_CHAT_AUDIO_R3';
comment on table public.ac_hotline_chat_messages is 'ANGELCARE_HOTLINE_CHAT_AUDIO_R3';
create or replace function public.ac_hotline_audio_publication_guard_r3() returns trigger language plpgsql set search_path=pg_catalog as $$
declare f text;clip record;
begin
 perform 1 from public.ac_hotline_settings where id for update;
 for f in select unnest(array['greeting','closed','error']) loop
  for clip in select key,value from jsonb_each_text(new.config->f) loop
   if not exists(select 1 from public.ac_hotline_audio where id::text=clip.value and status='ready' and locale=clip.key and purpose=f) then raise exception 'AUDIO_PUBLICATION_CHANGED';end if;
  end loop;
 end loop;
 for clip in select p.key,p.value from jsonb_array_elements(new.config->'nodes') n cross join lateral jsonb_each_text(n->'prompt') p where n->>'kind'='menu' loop
  if not exists(select 1 from public.ac_hotline_audio where id::text=clip.value and status='ready' and locale=clip.key and purpose='menu') then raise exception 'AUDIO_PUBLICATION_CHANGED';end if;
 end loop;
 if not exists(select 1 from public.ac_hotline_audio where id::text=new.config->>'musicAssetId' and status='ready' and locale='all' and purpose='music') then raise exception 'AUDIO_PUBLICATION_CHANGED';end if;
 return new;
end $$;
drop trigger if exists ac_hotline_audio_publication_guard_r3 on public.ac_hotline_versions;
create trigger ac_hotline_audio_publication_guard_r3 before insert on public.ac_hotline_versions for each row execute function public.ac_hotline_audio_publication_guard_r3();
revoke all on function public.ac_hotline_audio_publication_guard_r3() from public,anon,authenticated;
create or replace function public.ac_hotline_chat_case_state_r3() returns trigger language plpgsql set search_path=pg_catalog as $$
begin
 if new.status in('closed','resolved') and new.status is distinct from old.status then
  update public.ac_hotline_chat_threads set state=new.status,version=version+1,updated_at=now() where case_id=new.id and state not in('closed','resolved');
 end if;
 return new;
end $$;
drop trigger if exists ac_hotline_chat_case_state_r3 on public.ac_hotline_cases;
create trigger ac_hotline_chat_case_state_r3 after update of status on public.ac_hotline_cases for each row execute function public.ac_hotline_chat_case_state_r3();
revoke all on function public.ac_hotline_chat_case_state_r3() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
