begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=17) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
alter table public.jobkix_cases add column guest_receipt_expires_at timestamptz;
create unique index jobkix_guest_receipt_unique on public.jobkix_cases(guest_receipt_hash) where guest_receipt_hash is not null;
create table public.jobkix_guest_case_receipts(receipt_hash text not null,idempotency_key text not null,request_hash text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(receipt_hash,idempotency_key));
create table public.jobkix_guest_case_drafts(receipt_hash text primary key,body jsonb not null,version integer not null default 1,expires_at timestamptz not null default now()+interval '30 days',updated_at timestamptz not null default now());
create table public.jobkix_guest_rate_windows(key_hash text not null,window_start timestamptz not null,kind text not null,hits integer not null,primary key(key_hash,window_start,kind));
alter table public.jobkix_guest_case_receipts enable row level security;
alter table public.jobkix_guest_case_drafts enable row level security;
alter table public.jobkix_guest_rate_windows enable row level security;
revoke all on public.jobkix_guest_case_receipts,public.jobkix_guest_case_drafts,public.jobkix_guest_rate_windows from public,anon,authenticated;
create function public.jobkix_guest_case_rate(p_key text,p_kind text) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare start_time timestamptz;maximum integer;counted integer;begin
 if p_key!~'^[a-f0-9]{64}$' or p_kind not in ('create','write','read') then raise exception 'INVALID_INPUT';end if;
 start_time:=case when p_kind='create' then date_trunc('hour',now()) else date_trunc('minute',now()) end;maximum:=case p_kind when 'create' then 10 when 'write' then 30 else 60 end;
 delete from public.jobkix_guest_rate_windows where window_start<now()-interval '72 hours';
 insert into public.jobkix_guest_rate_windows(key_hash,window_start,kind,hits) values(p_key,start_time,p_kind,1)
 on conflict(key_hash,window_start,kind) do update set hits=jobkix_guest_rate_windows.hits+1 returning hits into counted;
 if counted>maximum then raise exception 'RATE_LIMITED';end if;
end $$;
create function public.jobkix_guest_case_status(p_hash text,p_rate_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.jobkix_cases;draft public.jobkix_guest_case_drafts;begin
 if p_hash is null or p_hash!~'^[a-f0-9]{64}$' then raise exception 'INVALID_INPUT';end if;perform public.jobkix_guest_case_rate(p_rate_key,'read');
 select * into c from public.jobkix_cases where guest_receipt_hash=p_hash and reporter_user_id is null and guest_receipt_expires_at>now();
 if not found then select * into draft from public.jobkix_guest_case_drafts where receipt_hash=p_hash and expires_at>now();return jsonb_build_object('case',null,'draft',case when found then jsonb_build_object('body',draft.body,'version',draft.version) else null end);end if;
 return jsonb_build_object('case',jsonb_build_object('id',c.id,'reference',c.public_reference,'kind',c.kind,'category',c.category,'description',c.description,'originalLocale',c.original_locale,'state',c.state,'version',c.version,'createdAt',c.created_at,'expiresAt',c.guest_receipt_expires_at,
 'events',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'detail',detail,'originalLocale',original_locale,'createdAt',created_at) order by created_at,id),'[]') from public.jobkix_case_events where case_id=c.id and visibility='reporter')),
 'draft',(select jsonb_build_object('body',body,'version',version) from public.jobkix_guest_case_drafts where receipt_hash=p_hash and expires_at>now()));
end $$;
create function public.jobkix_guest_case_command(p_hash text,p_action text,p_payload jsonb,p_version integer,p_key text,p_rate_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.jobkix_cases;prior public.jobkix_guest_case_receipts;req_hash text;result jsonb;current_version integer;begin
 if p_hash is null or p_hash!~'^[a-f0-9]{64}$' or p_key is null or length(p_key) not between 16 and 180 or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>30000 then raise exception 'INVALID_INPUT';end if;
 perform public.jobkix_guest_case_rate(p_rate_key,case p_action when 'case.create' then 'create' else 'write' end);
 perform pg_advisory_xact_lock(hashtextextended('jobkix-guest-case:'||p_hash,0));
 req_hash:=encode(sha256(convert_to(jsonb_build_object('action',p_action,'payload',p_payload,'version',p_version)::text,'UTF8')),'hex');
 if exists(select 1 from public.jobkix_cases where guest_receipt_hash=p_hash and guest_receipt_expires_at<=now()) then raise exception 'FORBIDDEN';end if;
 select * into prior from public.jobkix_guest_case_receipts where receipt_hash=p_hash and idempotency_key=p_key;
 if found then if prior.request_hash<>req_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return prior.result||jsonb_build_object('replayed',true);end if;
 if p_action='draft.remove' then
  select version into current_version from public.jobkix_guest_case_drafts where receipt_hash=p_hash for update;if found then perform public.jobkix_version(current_version,p_version);elsif p_version is distinct from 0 then raise exception 'VERSION_CONFLICT';end if;
  delete from public.jobkix_guest_case_drafts where receipt_hash=p_hash;result:=jsonb_build_object('state','removed');
 elsif p_action='draft.save' then
  if jsonb_typeof(p_payload->'fields')<>'object' or (p_payload?'intent' and jsonb_typeof(p_payload->'intent') not in ('object','null')) then raise exception 'INVALID_INPUT';end if;
  select version into current_version from public.jobkix_guest_case_drafts where receipt_hash=p_hash and expires_at>now() for update;
  if found then perform public.jobkix_version(current_version,p_version);elsif p_version is distinct from 0 then raise exception 'VERSION_CONFLICT';end if;
  insert into public.jobkix_guest_case_drafts(receipt_hash,body) values(p_hash,p_payload) on conflict(receipt_hash) do update set body=excluded.body,version=jobkix_guest_case_drafts.version+1,updated_at=now(),expires_at=now()+interval '30 days' returning version into current_version;
  result:=jsonb_build_object('version',current_version,'state','saved');
 else
  select * into c from public.jobkix_cases where guest_receipt_hash=p_hash and reporter_user_id is null for update;
  if found and c.guest_receipt_expires_at<=now() then raise exception 'FORBIDDEN';end if;
  if p_action='case.create' then
   if c.id is not null then raise exception 'IDEMPOTENCY_CONFLICT';end if;
   if p_payload->>'kind' not in ('report','support') or p_payload->>'locale' not in ('en','fr','es','hi','tl','id','ar') or length(trim(coalesce(p_payload->>'description',''))) not between 10 and 16000 or length(trim(coalesce(p_payload->>'category',''))) not between 1 and 100 then raise exception 'INVALID_INPUT';end if;
   insert into public.jobkix_cases(public_reference,kind,guest_receipt_hash,guest_receipt_expires_at,category,description,original_locale,private_contact)
   values('JKC-'||upper(replace(gen_random_uuid()::text,'-','')),p_payload->>'kind',p_hash,now()+interval '30 days',p_payload->>'category',p_payload->>'description',p_payload->>'locale',jsonb_build_object('name',coalesce(p_payload->>'name',''),'email',coalesce(p_payload->>'email',''),'relatedUrl',coalesce(p_payload->>'relatedUrl',''))) returning * into c;
   result:=jsonb_build_object('id',c.id,'reference',c.public_reference,'version',c.version,'state',c.state,'expiresAt',c.guest_receipt_expires_at);
   perform public.jobkix_emit('case.created',c.id,null,'{}',jsonb_build_object('kind',c.kind));
  elsif p_action in ('case.reply','case.appeal') then
   if c.id is null then raise exception 'FORBIDDEN';end if;perform public.jobkix_version(c.version,p_version);
   if p_payload->>'locale' not in ('en','fr','es','hi','tl','id','ar') or length(trim(coalesce(p_payload->>'description',''))) not between 10 and 16000 then raise exception 'INVALID_INPUT';end if;
   if (p_action='case.reply' and c.state not in ('reported','triaged','under_review','needs_information','appealed')) or (p_action='case.appeal' and c.state not in ('action','no_action','resolved')) then raise exception 'INVALID_TRANSITION';end if;
   insert into public.jobkix_case_events(case_id,visibility,detail,original_locale) values(c.id,'reporter',p_payload->>'description',p_payload->>'locale');
   update public.jobkix_cases set state=case when p_action='case.appeal' then 'appealed' when state='needs_information' then 'under_review' else state end,version=version+1,updated_at=now() where id=c.id returning * into c;
   result:=jsonb_build_object('id',c.id,'reference',c.public_reference,'version',c.version,'state',c.state);perform public.jobkix_emit(p_action,c.id,null,'{}',jsonb_build_object('state',c.state));
  else raise exception 'INVALID_INPUT';end if;
  delete from public.jobkix_guest_case_drafts where receipt_hash=p_hash;
 end if;
 insert into public.jobkix_guest_case_receipts(receipt_hash,idempotency_key,request_hash,result) values(p_hash,p_key,req_hash,result);return result||jsonb_build_object('replayed',false);
end $$;
revoke all on function public.jobkix_guest_case_rate(text,text),public.jobkix_guest_case_status(text,text),public.jobkix_guest_case_command(text,text,jsonb,integer,text,text) from public,anon,authenticated;
grant execute on function public.jobkix_guest_case_status(text,text),public.jobkix_guest_case_command(text,text,jsonb,integer,text,text) to service_role;
insert into public.jobkix_schema_versions(version) values(18);
commit;
