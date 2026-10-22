-- Closed/restricted identities retain a narrow, verified, private assistance path.
-- Recruitment, files, organization permissions and the active-account authority remain unchanged.
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=25) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_case_actor() returns uuid
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid();begin
 if actor is null then raise exception 'AUTHENTICATION_REQUIRED';end if;
 if not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then raise exception 'EMAIL_UNCONFIRMED';end if;
 return actor;
end $$;
create function public.jobkix_support_draft_key(p_actor uuid,p_key text) returns boolean
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if p_key='new-case' then return true;end if;
 if split_part(p_key,':',1) not in ('reply','appeal') or split_part(p_key,':',2)!~*'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' or split_part(p_key,':',3)<>'' then return false;end if;
 return exists(select 1 from public.jobkix_cases where id=split_part(p_key,':',2)::uuid and reporter_user_id=p_actor);
end $$;
create function public.jobkix_restricted_case_command(p_action text,p_payload jsonb,p_expected_version integer,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_case_actor();previous public.jobkix_command_receipts;req_hash text;result jsonb;draft public.jobkix_drafts;begin
 if exists(select 1 from public.jobkix_accounts where user_id=actor and status='active') then raise exception 'FORBIDDEN';end if;
 if p_action is null or p_action not in ('case.create','case.reply','case.appeal','privacy.request','draft.save','draft.remove') or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>100000
 or p_expected_version is null or p_expected_version<0 or length(coalesce(p_idempotency_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 if p_action like 'draft.%' and (p_payload->>'kind' is distinct from 'case' or not public.jobkix_support_draft_key(actor,p_payload->>'key')) then raise exception 'FORBIDDEN';end if;
 if p_action in ('case.reply','case.appeal') and not exists(select 1 from public.jobkix_cases where id=(p_payload->>'id')::uuid and reporter_user_id=actor) then raise exception 'FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':'||p_idempotency_key,0));
 req_hash:=encode(sha256(convert_to(jsonb_build_object('action',p_action,'payload',p_payload,'expectedVersion',p_expected_version)::text,'UTF8')),'hex');
 select * into previous from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_idempotency_key;
 if found then if previous.request_hash<>req_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return previous.result||jsonb_build_object('replayed',true);end if;
 if p_action like 'draft.%' then
  perform pg_advisory_xact_lock(hashtextextended('jobkix-draft:'||actor::text||':case:'||(p_payload->>'key'),0));
  select * into draft from public.jobkix_drafts where user_id=actor and kind='case' and draft_key=p_payload->>'key' for update;
  if found then perform public.jobkix_version(draft.version,p_expected_version);elsif p_expected_version<>0 then raise exception 'VERSION_CONFLICT';end if;
  if p_action='draft.save' then
   if coalesce(jsonb_typeof(p_payload->'body'),'null')<>'object' then raise exception 'INVALID_INPUT';end if;
   insert into public.jobkix_drafts(user_id,kind,draft_key,body) values(actor,'case',p_payload->>'key',p_payload->'body')
   on conflict(user_id,kind,draft_key) do update set body=excluded.body,version=jobkix_drafts.version+1,updated_at=now() returning * into draft;
   result:=jsonb_build_object('id',actor,'version',draft.version,'state','saved','replayed',false);
  else delete from public.jobkix_drafts where user_id=actor and kind='case' and draft_key=p_payload->>'key';result:=jsonb_build_object('id',actor,'version',coalesce(draft.version,0)+1,'state','removed','replayed',false);end if;
 else result:=public.jobkix_case_effect(actor,p_action,p_payload,p_expected_version);
 end if;
 perform public.jobkix_emit('support.'||p_action,(result->>'id')::uuid,actor,'{}','{}');
 insert into public.jobkix_command_receipts(actor_user_id,idempotency_key,action,request_hash,result) values(actor,p_idempotency_key,p_action,req_hash,result);return result;
end $$;
create function public.jobkix_restricted_cases(p_id uuid default null,p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_case_actor();c public.jobkix_cases;result jsonb;requested_key text;begin
 if exists(select 1 from public.jobkix_accounts where user_id=actor and status='active') then raise exception 'FORBIDDEN';end if;
 if p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 if p_id is null then
  with own as (select * from public.jobkix_cases where reporter_user_id=actor),paged as (select * from own order by updated_at desc,id offset (p_page-1)*24 limit 24)
  select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'public_reference',public_reference,'kind',kind,'state',state,'updated_at',updated_at) order by updated_at desc,id) from paged),'[]'),'total',(select count(*) from own),'page',p_page,'pageSize',24,'case',null) into result;requested_key:='new-case';
 else
  select * into c from public.jobkix_cases where id=p_id and reporter_user_id=actor;if not found then raise exception 'FORBIDDEN';end if;
  with visible as (select * from public.jobkix_case_events where case_id=c.id and visibility='reporter'),paged as (select * from visible order by created_at,id offset (p_page-1)*24 limit 24)
  select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'detail',detail,'original_locale',original_locale,'created_at',created_at) order by created_at,id) from paged),'[]'),'total',(select count(*) from visible),'page',p_page,'pageSize',24,
   'case',jsonb_build_object('id',c.id,'public_reference',c.public_reference,'kind',c.kind,'category',c.category,'description',c.description,'original_locale',c.original_locale,'state',c.state,'version',c.version,'created_at',c.created_at)) into result;
  requested_key:=case when c.state in ('action','no_action','resolved') then 'appeal:' else 'reply:' end||c.id;
 end if;
 return result||jsonb_build_object('draft',(select to_jsonb(d) from public.jobkix_drafts d where user_id=actor and kind='case' and d.draft_key=requested_key));
end $$;
create function public.jobkix_case_effect(actor uuid,p_action text,p_payload jsonb,p_expected_version integer,parent_org uuid default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.jobkix_cases;target text;obj uuid;updated_version integer:=1;result jsonb;begin
 if actor is distinct from public.jobkix_case_actor() then raise exception 'FORBIDDEN';end if;
 if p_action='verification.submit' and not public.jobkix_can_act(parent_org,'organization.manage') then raise exception 'FORBIDDEN';end if;
 if not exists(select 1 from public.jobkix_accounts where user_id=actor and status='active') and (p_action='verification.submit' or (p_action in ('case.create','privacy.request') and (nullif(p_payload->>'organizationId','') is not null or nullif(p_payload->>'vacancyId','') is not null or nullif(p_payload->>'fileId','') is not null))) then raise exception 'FORBIDDEN';end if;
 if p_action in ('case.create','verification.submit','privacy.request') then
  if p_expected_version is distinct from 0 then raise exception 'VERSION_CONFLICT';end if;
  perform pg_advisory_xact_lock(hashtextextended('jobkix-case-rate:'||actor::text,0));
  if (select count(*) from public.jobkix_cases where reporter_user_id=actor and created_at>now()-interval '1 hour')>=20 then raise exception 'RATE_LIMITED';end if;
  target:=case p_action when 'verification.submit' then 'verification' when 'privacy.request' then p_payload->>'kind' else p_payload->>'kind' end;
  if not (case p_action when 'case.create' then target in ('report','support') when 'privacy.request' then target in ('privacy_export','privacy_deletion') when 'verification.submit' then target='verification' else false end) or length(trim(coalesce(p_payload->>'description',''))) not between 10 and 16000 or length(trim(coalesce(p_payload->>'category','general'))) not between 1 and 100 then raise exception 'INVALID_INPUT';end if;
  if p_action='verification.submit' and nullif(p_payload->>'fileId','') is null then raise exception 'DOCUMENT_NOT_READY';end if;
  if nullif(p_payload->>'fileId','') is not null and not exists(select 1 from public.jobkix_files where id=(p_payload->>'fileId')::uuid and owner_user_id=actor and state='ready' and (p_action<>'verification.submit' or (purpose='verification' and organization_id=parent_org))) then raise exception 'DOCUMENT_NOT_READY';end if;
  if p_action<>'verification.submit' then parent_org:=nullif(p_payload->>'organizationId','')::uuid;end if;
  insert into public.jobkix_cases(public_reference,kind,reporter_user_id,organization_id,vacancy_id,category,description,evidence_file_id,original_locale)
   values('JKC-'||upper(replace(gen_random_uuid()::text,'-','')),target,actor,parent_org,nullif(p_payload->>'vacancyId','')::uuid,coalesce(p_payload->>'category','general'),p_payload->>'description',nullif(p_payload->>'fileId','')::uuid,coalesce(p_payload->>'locale','en')) returning * into c;
  result:=jsonb_build_object('id',c.id,'version',c.version,'state',c.state,'reference',c.public_reference,'replayed',false);obj:=c.id;
 elsif p_action='case.reply' then
  select * into c from public.jobkix_cases where id=(p_payload->>'id')::uuid and reporter_user_id=actor for update;
  if not found then raise exception 'FORBIDDEN';end if;perform public.jobkix_version(c.version,p_expected_version);
  if c.state not in ('reported','triaged','under_review','needs_information','appealed') or length(trim(p_payload->>'description')) not between 10 and 16000 then raise exception 'INVALID_TRANSITION';end if;
  insert into public.jobkix_case_events(case_id,user_actor_id,visibility,detail,original_locale) values(c.id,actor,'reporter',trim(p_payload->>'description'),coalesce(p_payload->>'locale','en'));
  update public.jobkix_cases set state=case when state='needs_information' then 'under_review' else state end,version=version+1,updated_at=now() where id=c.id returning version into updated_version;obj:=c.id;target:='replied';
 elsif p_action='case.appeal' then
  select * into c from public.jobkix_cases where id=(p_payload->>'id')::uuid and reporter_user_id=actor for update;
  if not found then raise exception 'FORBIDDEN';end if;perform public.jobkix_version(c.version,p_expected_version);
  if c.state not in ('action','no_action','resolved') or length(p_payload->>'description') not between 10 and 16000 then raise exception 'INVALID_TRANSITION';end if;
  update public.jobkix_cases set state='appealed',version=version+1,updated_at=now() where id=c.id returning version into updated_version;
  insert into public.jobkix_case_events(case_id,user_actor_id,visibility,detail,original_locale) values(c.id,actor,'reporter',p_payload->>'description',coalesce(p_payload->>'locale','en'));obj:=c.id;target:='appealed';

 else raise exception 'INVALID_INPUT';end if;
 if result is null then result:=jsonb_build_object('id',obj,'version',updated_version,'state',target,'replayed',false);end if;return result;
end $$;

revoke all on function public.jobkix_case_actor(),public.jobkix_case_effect(uuid,text,jsonb,integer,uuid),public.jobkix_support_draft_key(uuid,text),public.jobkix_restricted_case_command(text,jsonb,integer,text),public.jobkix_restricted_cases(uuid,integer) from public,anon,authenticated;
grant execute on function public.jobkix_restricted_case_command(text,jsonb,integer,text),public.jobkix_restricted_cases(uuid,integer) to authenticated;
insert into public.jobkix_schema_versions(version) values(26);
commit;
