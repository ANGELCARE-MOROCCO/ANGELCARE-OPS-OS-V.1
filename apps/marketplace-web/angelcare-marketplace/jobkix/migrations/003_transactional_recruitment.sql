-- JOBKIX §§22–24: one transaction per command; identity comes exclusively from auth.uid().
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=2) then raise exception 'JOBKIX_MIGRATION_ORDER'; end if; end $$;

create function public.jobkix_version(p_actual integer,p_expected integer) returns void
language plpgsql set search_path=pg_catalog,public as $$ begin
 if p_expected is null or p_expected<1 or p_expected<>p_actual then raise exception 'VERSION_CONFLICT'; end if;
end $$;
create function public.jobkix_array(p_value jsonb,p_maximum integer default 100) returns text[]
language plpgsql immutable set search_path=pg_catalog,public as $$ begin
 if p_value is null or jsonb_typeof(p_value)<>'array' or jsonb_array_length(p_value)>p_maximum
 or exists(select 1 from jsonb_array_elements(p_value) x where jsonb_typeof(x)<>'string' or length(x#>>'{}')>1000)
 then raise exception 'INVALID_INPUT'; end if;
 return array(select x#>>'{}' from jsonb_array_elements(p_value) x);
end $$;
create function public.jobkix_emit(p_type text,p_object uuid,p_actor uuid,p_recipients uuid[],p_data jsonb default '{}') returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare event_id uuid:=gen_random_uuid(); recipient uuid; loc text; email_enabled boolean; begin
 insert into public.jobkix_events(id,type,object_id,actor_user_id,detail) values(event_id,p_type,p_object,p_actor,p_data);
 for recipient in select distinct unnest(p_recipients) loop
  select preferred_locale,notifications_email into loc,email_enabled from public.jobkix_accounts where user_id=recipient and status='active';
  if found then
   insert into public.jobkix_outbox(event_id,recipient_user_id,channel,template_key,locale,data,state)
   values(event_id,recipient,'in_app',p_type,loc,p_data,'sent');
   if email_enabled then insert into public.jobkix_outbox(event_id,recipient_user_id,channel,template_key,locale,data)
    values(event_id,recipient,'email',p_type,loc,p_data); end if;
  end if;
 end loop;
 return event_id;
end $$;
create function public.jobkix_recruiters(p_vacancy uuid) returns uuid[]
language sql stable security definer set search_path=pg_catalog,public as $$
select coalesce(array_agg(distinct m.user_id),'{}') from public.jobkix_memberships m
join public.jobkix_vacancies v on v.organization_id=m.organization_id
join public.jobkix_accounts a on a.user_id=m.user_id and a.status='active'
where v.id=p_vacancy and m.active and (m.expires_at is null or m.expires_at>now())
and m.role in ('owner','admin','recruiter','hiring_manager')
and (cardinality(m.site_ids)=0 or v.site_id=any(m.site_ids)) and (cardinality(m.vacancy_ids)=0 or v.id=any(m.vacancy_ids))
$$;

create function public.jobkix_preserve_hiring_revision() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$ begin
 if tg_table_name='jobkix_offers' then insert into public.jobkix_offer_revisions(offer_id,version,snapshot) values(new.id,new.version,to_jsonb(new));
 else insert into public.jobkix_interview_revisions(interview_id,version,snapshot) values(new.id,new.version,to_jsonb(new)); end if;
 return new;
end $$;
create trigger jobkix_offer_revision after insert or update on public.jobkix_offers for each row execute function public.jobkix_preserve_hiring_revision();
create trigger jobkix_interview_revision after insert or update on public.jobkix_interviews for each row execute function public.jobkix_preserve_hiring_revision();

create function public.jobkix_capture_interview_panels(p_id uuid,p_version integer) returns void
language sql security definer set search_path=pg_catalog,public as $$
update public.jobkix_interview_revisions set snapshot=snapshot||jsonb_build_object('panels',(select coalesce(jsonb_agg(jsonb_build_object('userId',member_user_id,'response',response) order by member_user_id),'[]') from public.jobkix_interview_panels where interview_id=p_id)) where interview_id=p_id and version=p_version
$$;
revoke all on function public.jobkix_capture_interview_panels(uuid,integer) from public,anon,authenticated;

create function public.jobkix_command(p_action text,p_payload jsonb,p_expected_version integer,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 actor uuid; req_hash text; previous public.jobkix_command_receipts; result jsonb; obj uuid; ev uuid;
 org public.jobkix_organizations; vac public.jobkix_vacancies; candidate public.jobkix_candidates;
 app public.jobkix_applications; doc public.jobkix_files; offer public.jobkix_offers; meeting public.jobkix_interviews;
 question record; answers jsonb; answer text; snapshot jsonb; recipients uuid[]; target text; thread_id uuid; parent_org uuid;
 start_time timestamptz; end_time timestamptz; panel uuid; panel_ids uuid[]; qjson jsonb; updated_version integer; account_terms jsonb;
begin
 if jsonb_typeof(p_payload)<>'object' or p_payload is null or octet_length(p_payload::text)>200000
 or p_idempotency_key is null or length(p_idempotency_key) not between 16 and 180 then raise exception 'INVALID_INPUT'; end if;
 actor:=public.jobkix_actor(p_action<>'account.initialize');
 -- The idempotency lock prevents simultaneous same-key effects. Request hash includes expected revision.
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':'||p_idempotency_key,0));
 req_hash:=encode(sha256(convert_to(jsonb_build_object('action',p_action,'payload',p_payload,'expectedVersion',p_expected_version)::text,'UTF8')),'hex');

 -- Recheck current object/membership authorization BEFORE receipt recovery.
 if p_action='application.bulk_stage' then return public.jobkix_bulk_stage(p_payload,p_expected_version,p_idempotency_key);
 elsif p_action='vacancy.create' then
  if not public.jobkix_can_act((p_payload->>'organizationId')::uuid,'vacancy.write',nullif(p_payload->>'siteId','')::uuid) then raise exception 'FORBIDDEN'; end if;
 elsif p_action like 'vacancy.%' then
  select * into vac from public.jobkix_vacancies where id=(p_payload->>'id')::uuid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not public.jobkix_can_act(vac.organization_id,case when p_action='vacancy.publish' then 'vacancy.publish' else 'vacancy.write' end,vac.site_id,vac.id) then raise exception 'FORBIDDEN'; end if;
 elsif p_action in ('application.stage','application.withdraw','message.send','interview.propose','offer.create') then
  select * into app from public.jobkix_applications where id=(p_payload->>'applicationId')::uuid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into vac from public.jobkix_vacancies where id=app.vacancy_id;
  if p_action='application.withdraw' then
   if app.candidate_user_id<>actor then raise exception 'FORBIDDEN'; end if;
  elsif p_action='message.send' then
   if not public.jobkix_application_visible(app.id) or (app.candidate_user_id<>actor and not public.jobkix_can_act(app.organization_id,'message.write',vac.site_id,vac.id)) then raise exception 'FORBIDDEN'; end if;
  elsif app.candidate_user_id=actor or not public.jobkix_application_visible(app.id) or not public.jobkix_can_act(app.organization_id,case p_action when 'application.stage' then 'application.decide' when 'interview.propose' then 'interview.manage' else 'offer.write' end,vac.site_id,vac.id) then raise exception 'FORBIDDEN'; end if;
 elsif p_action like 'interview.%' then
  select * into meeting from public.jobkix_interviews where id=(p_payload->>'id')::uuid;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into app from public.jobkix_applications where id=meeting.application_id for update;
  -- Application first, then its child: matches withdrawal and stage-transition lock order.
  select * into meeting from public.jobkix_interviews where id=meeting.id for update;
  select * into vac from public.jobkix_vacancies where id=app.vacancy_id;
  if p_action='interview.panel_respond' then
   if meeting.candidate_user_id=actor or not public.jobkix_interview_visible(meeting.id) or not public.jobkix_can_act(meeting.organization_id,'evaluation.write',vac.site_id,vac.id) or not exists(select 1 from public.jobkix_interview_panels where interview_id=meeting.id and member_user_id=actor) then raise exception 'FORBIDDEN';end if;
  elsif p_action='interview.respond' then
   if meeting.candidate_user_id<>actor then raise exception 'FORBIDDEN'; end if;
  elsif app.candidate_user_id=actor or not public.jobkix_application_visible(app.id) or not public.jobkix_can_act(meeting.organization_id,'interview.manage',vac.site_id,vac.id) then raise exception 'FORBIDDEN'; end if;
 elsif p_action like 'offer.%' then
  select * into offer from public.jobkix_offers where id=(p_payload->>'id')::uuid;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into app from public.jobkix_applications where id=offer.application_id for update;
  select * into offer from public.jobkix_offers where id=offer.id for update;
  select * into vac from public.jobkix_vacancies where id=app.vacancy_id;
  if p_action='offer.respond' then
   if offer.candidate_user_id<>actor then raise exception 'FORBIDDEN'; end if;
  elsif app.candidate_user_id=actor or not public.jobkix_application_visible(app.id) or not public.jobkix_can_act(offer.organization_id,'offer.write',vac.site_id,vac.id) then raise exception 'FORBIDDEN'; end if;
 end if;

 select * into previous from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_idempotency_key;
 if found then
  if previous.request_hash<>req_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return previous.result||jsonb_build_object('replayed',true);
 end if;

 -- New communication/acceptance effects require current consent and an active counterparty.
 -- A previously committed receipt above remains recoverable without repeating its effect.
 if p_action='message.send' or (p_action='offer.respond' and p_payload->>'response'='accepted') or (p_action in ('interview.respond','interview.panel_respond') and p_payload->>'response'<>'declined') then
  select * into org from public.jobkix_organizations where id=app.organization_id for share;
  if not found or org.status<>'active' or exists(select 1 from public.jobkix_candidate_blocks where candidate_user_id=app.candidate_user_id and organization_id=app.organization_id) then raise exception 'FORBIDDEN';end if;
  if app.state='withdrawn' then raise exception 'INVALID_TRANSITION';end if;
 end if;

 if p_action='account.initialize' then
  if coalesce((p_payload->>'adultConfirmed')::boolean,false) is not true or coalesce((p_payload->>'accepted')::boolean,false) is not true then raise exception 'INVALID_INPUT'; end if;
  if p_payload->>'locale' not in ('en','fr','es','hi','tl','id','ar') or not exists(select 1 from pg_timezone_names where name=p_payload->>'timezone') then raise exception 'INVALID_INPUT'; end if;
  account_terms:=public.jobkix_account_terms(p_payload->>'locale');
  if account_terms is null then raise exception 'DEPENDENCY_UNAVAILABLE'; end if;
  if p_payload->>'consentRevision' is distinct from account_terms->>'revision' then raise exception 'VERSION_CONFLICT'; end if;
  insert into public.jobkix_accounts(user_id,preferred_locale,timezone,adult_confirmed_at,display_name)
  values(actor,p_payload->>'locale',p_payload->>'timezone',now(),trim(p_payload->>'displayName')) on conflict(user_id) do nothing;
  insert into public.jobkix_account_consents(user_id,revision,locale,terms_snapshot,privacy_snapshot)
  values(actor,account_terms->>'revision',p_payload->>'locale',account_terms->'terms',account_terms->'privacy') on conflict(user_id,revision) do nothing;
  if p_payload->>'intent'='candidate' then
   if length(trim(p_payload->>'displayName')) not between 1 and 180 then raise exception 'INVALID_INPUT'; end if;
   insert into public.jobkix_candidates(user_id,display_name,country) values(actor,trim(p_payload->>'displayName'),nullif(p_payload->>'country','')) on conflict(user_id) do nothing;
  elsif p_payload->>'intent'<>'hirer' then raise exception 'INVALID_INPUT'; end if;
  obj:=actor;updated_version:=1;target:='initialized';

 elsif p_action='profile.save' then
  select * into candidate from public.jobkix_candidates where user_id=actor for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.jobkix_version(candidate.version,p_expected_version);
  update public.jobkix_candidates set display_name=trim(p_payload->>'displayName'),headline=p_payload->>'headline',summary=p_payload->>'summary',
  country=nullif(p_payload->>'country',''),skills=public.jobkix_array(p_payload->'skills'),occupations=public.jobkix_array(p_payload->'occupations'),languages=public.jobkix_array(p_payload->'languages'),
  experience=public.jobkix_profile_entries(coalesce(p_payload->'experience','[]')),education=public.jobkix_profile_entries(coalesce(p_payload->'education','[]')),preferences=coalesce(p_payload->'preferences','{}'),version=version+1,updated_at=now()
  where id=candidate.id returning id,version into obj,updated_version;
  target:='saved';

 elsif p_action='privacy.save' then
  select * into candidate from public.jobkix_candidates where user_id=actor for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.jobkix_version(candidate.version,p_expected_version);
  if not (p_payload?'discoverable') or jsonb_typeof(p_payload->'discoverable')<>'boolean' then raise exception 'INVALID_INPUT'; end if;
  update public.jobkix_candidates set discoverable=(p_payload->>'discoverable')::boolean,
  discoverability_consented_at=case when (p_payload->>'discoverable')::boolean then now() else null end,version=version+1,updated_at=now()
  where id=candidate.id returning id,version into obj,updated_version;
  target:='saved';

 elsif p_action='organization.create' then
  if length(trim(p_payload->>'publicName')) not between 2 and 180 then raise exception 'INVALID_INPUT'; end if;
  insert into public.jobkix_organizations(kind,public_name,country,city,original_locale,created_by)
  values(p_payload->>'kind',trim(p_payload->>'publicName'),p_payload->>'country',coalesce(p_payload->>'city',''),coalesce(p_payload->>'originalLocale','en'),actor) returning * into org;
  insert into public.jobkix_organization_private(organization_id) values(org.id);
  insert into public.jobkix_memberships(organization_id,user_id,role) values(org.id,actor,'owner');
  obj:=org.id;updated_version:=org.version;target:='created';

 elsif p_action='vacancy.create' then
  parent_org:=(p_payload->>'organizationId')::uuid;
  if not public.jobkix_can_act(parent_org,'vacancy.write',nullif(p_payload->>'siteId','')::uuid) then raise exception 'FORBIDDEN'; end if;
  if not exists(select 1 from public.jobkix_taxonomy where kind='setting' and key=p_payload->>'settingId' and status='published') or not exists(select 1 from public.jobkix_taxonomy where kind='occupation' and key=p_payload->>'occupationId' and status='published') then raise exception 'INVALID_INPUT';end if;
  insert into public.jobkix_vacancies(organization_id,site_id,title,setting_id,occupation_id,original_locale,country,region,city,description,work_schedule,contract_type,work_location,live_in,created_by)
  values(parent_org,nullif(p_payload->>'siteId','')::uuid,p_payload->>'title',p_payload->>'settingId',p_payload->>'occupationId',p_payload->>'originalLocale',p_payload->>'country',coalesce(p_payload->>'region',''),p_payload->>'city',coalesce(p_payload->>'description',''),p_payload->>'workSchedule',p_payload->>'contractType',p_payload->>'workLocation',coalesce((p_payload->>'liveIn')::boolean,false),actor)
  returning * into vac;
  insert into public.jobkix_vacancy_revisions(vacancy_id,version,snapshot,edited_by) values(vac.id,vac.version,to_jsonb(vac),actor);
  obj:=vac.id;updated_version:=vac.version;target:=vac.state;

 elsif p_action='vacancy.duplicate' then
  perform public.jobkix_version(vac.version,p_expected_version);
  if coalesce(length(trim(p_payload->>'reason')),0) not between 10 and 1500 then raise exception 'INVALID_INPUT';end if;
  if vac.state='suspended' or not public.jobkix_can_act(vac.organization_id,'vacancy.write',vac.site_id) then raise exception 'FORBIDDEN';end if;
  obj:=vac.id;vac.id:=gen_random_uuid();vac.state:='draft';vac.version:=1;vac.public_snapshot:=null;vac.published_version:=null;
  vac.published_at:=null;vac.expires_at:=null;vac.reviewed_version:=null;vac.reviewed_at:=null;vac.created_by:=actor;vac.created_at:=now();vac.updated_at:=now();
  insert into public.jobkix_vacancies select (vac).*;
  insert into public.jobkix_screening_questions(id,vacancy_id,label,kind,required,max_length,position)
   select gen_random_uuid(),vac.id,label,kind,required,max_length,position from public.jobkix_screening_questions where vacancy_id=obj;
  insert into public.jobkix_vacancy_revisions(vacancy_id,version,snapshot,edited_by) values(vac.id,1,to_jsonb(vac)||jsonb_build_object('change',jsonb_build_object('action',p_action,'reason',trim(p_payload->>'reason'),'copiedFrom',obj)),actor);
  perform public.jobkix_emit('vacancy.duplicated',vac.id,actor,'{}',jsonb_build_object('sourceId',obj));
  obj:=vac.id;updated_version:=1;target:='draft';

 elsif p_action='vacancy.save' then
  perform public.jobkix_pay(p_payload->'compensation');
  perform public.jobkix_version(vac.version,p_expected_version);
  if vac.state not in ('draft','pending_review','paused') then raise exception 'INVALID_TRANSITION'; end if;
  if not exists(select 1 from public.jobkix_taxonomy where kind='setting' and key=p_payload->>'settingId' and status='published')
  or not exists(select 1 from public.jobkix_taxonomy where kind='occupation' and key=p_payload->>'occupationId' and status='published') then raise exception 'INVALID_INPUT'; end if;
  if not public.jobkix_can_act(vac.organization_id,'vacancy.write',nullif(p_payload->>'siteId','')::uuid,vac.id) then raise exception 'FORBIDDEN';end if;
  update public.jobkix_vacancies set title=p_payload->>'title',site_id=nullif(p_payload->>'siteId','')::uuid,setting_id=p_payload->>'settingId',occupation_id=p_payload->>'occupationId',original_locale=coalesce(p_payload->>'originalLocale',vac.original_locale),
  description=p_payload->>'description',duties=public.jobkix_array(p_payload->'duties'),requirements=public.jobkix_array(p_payload->'requirements'),benefits=public.jobkix_array(p_payload->'benefits'),
  work_schedule=p_payload->>'workSchedule',contract_type=p_payload->>'contractType',work_location=p_payload->>'workLocation',live_in=(p_payload->>'liveIn')::boolean,
  country=p_payload->>'country',region=coalesce(p_payload->>'region',''),city=p_payload->>'city',languages=public.jobkix_array(p_payload->'languages'),age_cohorts=public.jobkix_array(p_payload->'ageCohorts'),
  hours_per_week=(p_payload->>'hoursPerWeek')::numeric,compensation_min=(p_payload->'compensation'->>'minimum')::numeric,compensation_max=(p_payload->'compensation'->>'maximum')::numeric,
  currency=p_payload->'compensation'->>'currency',compensation_unit=p_payload->'compensation'->>'unit',
  overseas_applicants=p_payload->>'overseasApplicants',sponsorship=p_payload->>'sponsorship',relocation=p_payload->>'relocation',
  required_document=(p_payload->>'requiredDocument')::boolean,state='draft',reviewed_version=null,reviewed_at=null,version=version+1,updated_at=now()
  where id=vac.id returning * into vac;
  qjson:=coalesce(p_payload->'questions','[]');
  if jsonb_typeof(qjson)<>'array' or jsonb_array_length(qjson)>30 then raise exception 'INVALID_INPUT'; end if;
  if exists(select 1 from jsonb_array_elements(qjson) q where q->>'kind'='yes_no' and coalesce((q->>'maxLength')::integer,0)<3)
   or (select count(*) from jsonb_array_elements(qjson))<>(select count(distinct q->>'id') from jsonb_array_elements(qjson) q)
   or exists(select 1 from jsonb_array_elements(qjson) q join public.jobkix_screening_questions existing on existing.id=(q->>'id')::uuid where existing.vacancy_id<>vac.id) then raise exception 'INVALID_INPUT';end if;
  delete from public.jobkix_screening_questions where vacancy_id=vac.id;
  insert into public.jobkix_screening_questions(id,vacancy_id,label,kind,required,max_length,position)
  select (q->>'id')::uuid,vac.id,q->>'label',q->>'kind',(q->>'required')::boolean,(q->>'maxLength')::integer,(position-1)::integer from jsonb_array_elements(qjson) with ordinality items(q,position);
  insert into public.jobkix_vacancy_revisions(vacancy_id,version,snapshot,edited_by) values(vac.id,vac.version,to_jsonb(vac)||jsonb_build_object('questions',qjson),actor);
  obj:=vac.id;updated_version:=vac.version;target:='draft';

 elsif p_action in ('vacancy.submit_review','vacancy.publish','vacancy.pause','vacancy.close','vacancy.archive','vacancy.reopen') then
  perform public.jobkix_version(vac.version,p_expected_version);
  if p_action in ('vacancy.pause','vacancy.close','vacancy.archive','vacancy.reopen') and coalesce(length(trim(p_payload->>'reason')),0) not between 10 and 1500 then raise exception 'INVALID_INPUT';end if;
  if p_action='vacancy.submit_review' then
   if vac.state not in ('draft','paused') or length(vac.description)<50 or cardinality(vac.duties)=0 or cardinality(vac.requirements)=0 then raise exception 'INVALID_TRANSITION'; end if;
   if not exists(select 1 from public.jobkix_taxonomy where kind='setting' and key=vac.setting_id and status='published') or not exists(select 1 from public.jobkix_taxonomy where kind='occupation' and key=vac.occupation_id and status='published') then raise exception 'INVALID_INPUT';end if;
   target:='pending_review';
  elsif p_action='vacancy.publish' then
   select * into org from public.jobkix_organizations where id=vac.organization_id for share;
   if vac.state<>'pending_review' or vac.reviewed_version is distinct from vac.version or org.identity_reviewed_until is null or org.identity_reviewed_until<=now() or org.public_profile_approved_at is null then raise exception 'FORBIDDEN'; end if;
   if vac.site_id is not null and not exists(select 1 from public.jobkix_sites site where site.id=vac.site_id and site.organization_id=vac.organization_id and site.active) then raise exception 'INVALID_TRANSITION';end if;
   if nullif(p_payload->>'expiresAt','') is null or (p_payload->>'expiresAt')::timestamptz<=now() then raise exception 'INVALID_INPUT'; end if;
   target:='published';
  elsif p_action='vacancy.reopen' then
   if vac.state not in ('closed','expired','paused') and not (vac.state='published' and vac.expires_at<=now()) then raise exception 'INVALID_TRANSITION';end if;
   target:='draft';
  elsif p_action='vacancy.pause' then
   if vac.state<>'published' then raise exception 'INVALID_TRANSITION'; end if;target:='paused';
  elsif p_action='vacancy.close' then
   if vac.state not in ('published','paused','pending_review','draft') then raise exception 'INVALID_TRANSITION'; end if;target:='closed';
  else
   if vac.state not in ('draft','closed','expired','filled','paused') then raise exception 'INVALID_TRANSITION'; end if;target:='archived';
  end if;
  update public.jobkix_vacancies set state=target,version=version+1,updated_at=now(),
   reviewed_version=case when p_action='vacancy.reopen' then null else reviewed_version end,reviewed_at=case when p_action='vacancy.reopen' then null else reviewed_at end,
   published_at=case when target='published' then now() else published_at end,
   expires_at=case when target='published' then (p_payload->>'expiresAt')::timestamptz else expires_at end
   where id=vac.id returning * into vac;
  if target='published' then update public.jobkix_vacancies set public_snapshot=public.jobkix_vacancy_projection(vac.id),published_version=version where id=vac.id returning * into vac;end if;
  insert into public.jobkix_vacancy_revisions(vacancy_id,version,snapshot,edited_by) values(vac.id,vac.version,to_jsonb(vac)||jsonb_build_object('change',jsonb_build_object('action',p_action,'reason',p_payload->>'reason')),actor);
  recipients:=array(select candidate_user_id from public.jobkix_applications where vacancy_id=vac.id and state<>'withdrawn');
  perform public.jobkix_emit('vacancy.'||target,vac.id,actor,recipients,jsonb_build_object('vacancyId',vac.id));
  obj:=vac.id;updated_version:=vac.version;

 elsif p_action='application.submit' then
  select * into candidate from public.jobkix_candidates where user_id=actor for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into vac from public.jobkix_vacancies where id=(p_payload->>'vacancyId')::uuid for update;
  if not found or not public.jobkix_job_eligible(vac.id) then raise exception 'VACANCY_UNAVAILABLE'; end if;
  select * into org from public.jobkix_organizations where id=vac.organization_id for share;
  if exists(select 1 from public.jobkix_candidate_blocks where candidate_user_id=actor and organization_id=org.id) then raise exception 'FORBIDDEN'; end if;
  perform public.jobkix_version(vac.version,(p_payload->>'vacancyVersion')::integer);
  perform public.jobkix_version(candidate.version,(p_payload->>'profileVersion')::integer);
  if exists(select 1 from public.jobkix_applications where vacancy_id=vac.id and candidate_user_id=actor) then raise exception 'ALREADY_APPLIED'; end if;
  if not exists(select 1 from public.jobkix_accounts where user_id=actor and adult_confirmed_at is not null)
   or coalesce((p_payload->>'sharingConsent')::boolean,false) is not true or p_payload->>'consentRevision' is distinct from 'jobkix-application-2026-10-20' then raise exception 'INVALID_INPUT'; end if;
  if nullif(p_payload->>'documentId','') is not null then
   select * into doc from public.jobkix_files where id=(p_payload->>'documentId')::uuid and owner_user_id=actor for share;
   if not found or doc.state<>'ready' or doc.purpose<>'cv' then raise exception 'DOCUMENT_NOT_READY'; end if;
  elsif vac.required_document then raise exception 'DOCUMENT_NOT_READY'; end if;
  answers:=coalesce(p_payload->'answers','{}');
  if jsonb_typeof(answers)<>'object' or exists(select 1 from jsonb_object_keys(answers) k where not exists(select 1 from public.jobkix_screening_questions q where q.vacancy_id=vac.id and q.id::text=k)) then raise exception 'INVALID_INPUT'; end if;
  for question in select * from public.jobkix_screening_questions where vacancy_id=vac.id loop
   answer:=coalesce(answers->>question.id::text,'');
   if (question.required and length(trim(answer))=0) or length(answer)>question.max_length or (question.kind='yes_no' and answer<>'' and answer not in ('yes','no')) then raise exception 'INVALID_INPUT'; end if;
  end loop;
  snapshot:=jsonb_build_object('vacancyId',vac.id,'vacancyVersion',vac.version,'vacancy',public.jobkix_public_vacancy(vac.id),
   'profileVersion',candidate.version,'profile',jsonb_build_object('displayName',candidate.display_name,'headline',candidate.headline,'summary',candidate.summary,'country',candidate.country,'skills',candidate.skills,'occupations',candidate.occupations,'languages',candidate.languages,'experience',candidate.experience,'education',candidate.education),
   'answers',answers,'file',case when doc.id is null then null else jsonb_build_object('id',doc.id,'revision',doc.revision,'sha256',doc.sha256) end,
   'sharedAt',now(),'consentRevision','jobkix-application-2026-10-20');
  insert into public.jobkix_applications(vacancy_id,candidate_user_id,organization_id,snapshot,file_id,receipt)
   values(vac.id,actor,org.id,snapshot,doc.id,'JK-'||upper(replace(gen_random_uuid()::text,'-',''))) returning * into app;
  insert into public.jobkix_application_events(application_id,type,actor_user_id) values(app.id,'application.submitted',actor);
  insert into public.jobkix_threads(application_id) values(app.id);
  perform public.jobkix_emit('application.submitted',app.id,actor,array[actor]||public.jobkix_recruiters(vac.id),jsonb_build_object('applicationId',app.id,'vacancyId',vac.id,'receipt',app.receipt));
  result:=jsonb_build_object('id',app.id,'version',app.version,'state',app.state,'receipt',app.receipt,'replayed',false);

 elsif p_action in ('application.stage','application.withdraw') then
  perform public.jobkix_version(app.version,p_expected_version);
  target:=case when p_action='application.withdraw' then 'withdrawn' else p_payload->>'state' end;
  if app.state in ('hired','declined','withdrawn','closed_due_to_vacancy') or target is null then raise exception 'INVALID_TRANSITION'; end if;
  if target='hired' then raise exception 'INVALID_TRANSITION'; end if;
  if target<>'withdrawn' and not (case app.state
   when 'submitted' then target=any(array['acknowledged','under_review','shortlisted','declined','on_hold','closed_due_to_vacancy'])
   when 'acknowledged' then target=any(array['under_review','shortlisted','declined','on_hold','closed_due_to_vacancy'])
   when 'under_review' then target=any(array['shortlisted','interview','declined','on_hold','closed_due_to_vacancy'])
   when 'shortlisted' then target=any(array['interview','offer','declined','on_hold','closed_due_to_vacancy'])
   when 'interview' then target=any(array['shortlisted','offer','declined','on_hold','closed_due_to_vacancy'])
   when 'offer' then target=any(array['shortlisted','declined','closed_due_to_vacancy'])
   when 'on_hold' then target=any(array['under_review','shortlisted','declined','closed_due_to_vacancy']) else false end) then raise exception 'INVALID_TRANSITION'; end if;
  -- Only the offer-send command may move an application into the offer stage.
  if target='offer' then raise exception 'INVALID_TRANSITION'; end if;
  update public.jobkix_applications set state=target,version=version+1,updated_at=now() where id=app.id returning * into app;
  if target in ('withdrawn','declined','closed_due_to_vacancy') or app.state<>'offer' then
   for offer in update public.jobkix_offers set state='withdrawn',version=version+1,updated_at=now() where application_id=app.id and state in ('draft','sent') returning * loop
    insert into public.jobkix_application_events(application_id,type,public_detail,actor_user_id) values(app.id,'offer.withdrawn',jsonb_build_object('offerId',offer.id,'version',offer.version),actor);
    perform public.jobkix_emit('offer.withdrawn',offer.id,actor,array[app.candidate_user_id]||public.jobkix_recruiters(app.vacancy_id),jsonb_build_object('applicationId',app.id,'offerId',offer.id,'version',offer.version));
   end loop;
  end if;
  if target in ('withdrawn','declined','closed_due_to_vacancy') then
   update public.jobkix_interviews set state='cancelled',version=version+1,updated_at=now() where application_id=app.id and state in ('proposed','scheduled');
  end if;
  insert into public.jobkix_application_events(application_id,type,public_detail,actor_user_id) values(app.id,'application.stage_changed',jsonb_build_object('state',target),actor);
  perform public.jobkix_emit('application.stage_changed',app.id,actor,array[app.candidate_user_id]||public.jobkix_recruiters(app.vacancy_id),jsonb_build_object('applicationId',app.id,'state',target));
  obj:=app.id;updated_version:=app.version;

 elsif p_action='message.send' then
  if length(trim(p_payload->>'body')) not between 1 and 12000 or p_payload->>'locale' not in ('en','fr','es','hi','tl','id','ar') then raise exception 'INVALID_INPUT'; end if;
  select id into thread_id from public.jobkix_threads where application_id=app.id;
  if thread_id is null then raise exception 'NOT_FOUND'; end if;
  if nullif(p_payload->>'attachmentId','') is not null then
   select * into doc from public.jobkix_files where id=(p_payload->>'attachmentId')::uuid and owner_user_id=actor for share;
   if not found or doc.state<>'ready' or doc.purpose<>'message' then raise exception 'DOCUMENT_NOT_READY'; end if;
  end if;
  insert into public.jobkix_messages(thread_id,sender_user_id,body,original_locale,attachment_id)
  values(thread_id,actor,trim(p_payload->>'body'),p_payload->>'locale',doc.id) returning id into obj;
  perform public.jobkix_emit('message.recorded',obj,actor,array[app.candidate_user_id]||public.jobkix_recruiters(app.vacancy_id),jsonb_build_object('applicationId',app.id,'threadId',thread_id));
  updated_version:=1;target:='recorded';

 elsif p_action in ('interview.propose','interview.reschedule') then
  if app.state in ('hired','declined','withdrawn','closed_due_to_vacancy') then raise exception 'INVALID_TRANSITION'; end if;
  if p_action='interview.reschedule' then perform public.jobkix_version(meeting.version,p_expected_version); if meeting.state not in ('proposed','scheduled') then raise exception 'INVALID_TRANSITION'; end if; end if;
  if coalesce(p_payload->>'startsAt','')!~'^\d{4}-\d{2}-\d{2}T.*Z$' or coalesce(p_payload->>'endsAt','')!~'^\d{4}-\d{2}-\d{2}T.*Z$' then raise exception 'INVALID_INPUT'; end if;
  start_time:=(p_payload->>'startsAt')::timestamptz;end_time:=(p_payload->>'endsAt')::timestamptz;
  if start_time<=now() or end_time<start_time+interval '5 minutes' or end_time>start_time+interval '8 hours'
   or not exists(select 1 from pg_timezone_names where name=p_payload->>'timezone') then raise exception 'INVALID_INPUT'; end if;
  if p_payload->>'format'='video' and coalesce(p_payload->>'location','')!~'^https://[^/@[:space:]]+([/:].*)?$' then raise exception 'INVALID_INPUT'; end if;
  panel_ids:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_payload->'panelUserIds','[]')));
  if app.candidate_user_id=any(panel_ids) or cardinality(panel_ids)>20 or cardinality(panel_ids)<>(select count(distinct x) from unnest(panel_ids)x) then raise exception 'INVALID_INPUT'; end if;
  -- Canonical person locks + overlap query. Locks are sorted to avoid panel-order deadlocks.
  for panel in select distinct x from unnest(array[app.candidate_user_id]||panel_ids)x order by x loop
   perform pg_advisory_xact_lock(hashtextextended('jobkix-calendar:'||panel::text,0));
   if panel<>app.candidate_user_id and not exists(select 1 from public.jobkix_memberships m join public.jobkix_accounts ac on ac.user_id=m.user_id and ac.status='active' join auth.users panel_identity on panel_identity.id=m.user_id and panel_identity.email_confirmed_at is not null
    where m.user_id=panel and m.organization_id=app.organization_id and m.active and (m.expires_at is null or m.expires_at>now())
    and m.role in ('owner','admin','recruiter','hiring_manager','interviewer') and (cardinality(m.site_ids)=0 or vac.site_id=any(m.site_ids)) and (cardinality(m.vacancy_ids)=0 or vac.id=any(m.vacancy_ids))) then raise exception 'FORBIDDEN'; end if;
   if exists(select 1 from public.jobkix_interviews existing where existing.state in ('proposed','scheduled')
    and (meeting.id is null or existing.id<>meeting.id) and existing.starts_at<end_time and existing.ends_at>start_time
    and (existing.candidate_user_id=panel or exists(select 1 from public.jobkix_interview_panels ip where ip.interview_id=existing.id and ip.member_user_id=panel))) then raise exception 'VERSION_CONFLICT'; end if;
  end loop;
  if p_action='interview.propose' then
   insert into public.jobkix_interviews(application_id,organization_id,candidate_user_id,starts_at,ends_at,timezone,format,location,created_by)
   values(app.id,app.organization_id,app.candidate_user_id,start_time,end_time,p_payload->>'timezone',p_payload->>'format',p_payload->>'location',actor) returning * into meeting;
  else
   update public.jobkix_interviews set starts_at=start_time,ends_at=end_time,timezone=p_payload->>'timezone',format=p_payload->>'format',location=p_payload->>'location',
   state='proposed',candidate_response='pending',version=version+1,updated_at=now() where id=meeting.id returning * into meeting;
   delete from public.jobkix_interview_panels where interview_id=meeting.id;
  end if;
  insert into public.jobkix_interview_panels(interview_id,member_user_id) select meeting.id,unnest(panel_ids);
  perform public.jobkix_capture_interview_panels(meeting.id,meeting.version);
  perform public.jobkix_emit('interview.proposed',meeting.id,actor,array[app.candidate_user_id]||panel_ids||public.jobkix_recruiters(app.vacancy_id),jsonb_build_object('applicationId',app.id,'interviewId',meeting.id,'version',meeting.version));
  obj:=meeting.id;updated_version:=meeting.version;target:=meeting.state;

 elsif p_action='interview.panel_respond' then
  perform public.jobkix_version(meeting.version,p_expected_version);
  if meeting.state not in ('proposed','scheduled') or meeting.starts_at<=now() then raise exception 'INVALID_TRANSITION';end if;
  if p_payload->>'response' not in ('accepted','declined') then raise exception 'INVALID_INPUT';end if;
  update public.jobkix_interview_panels set response=p_payload->>'response' where interview_id=meeting.id and member_user_id=actor;
  if not found then raise exception 'FORBIDDEN';end if;
  update public.jobkix_interviews set version=version+1,updated_at=now() where id=meeting.id returning * into meeting;
  perform public.jobkix_capture_interview_panels(meeting.id,meeting.version);
  perform public.jobkix_emit('interview.panel_responded',meeting.id,actor,public.jobkix_recruiters(app.vacancy_id),jsonb_build_object('applicationId',app.id,'interviewId',meeting.id,'panelUserId',actor,'response',p_payload->>'response','version',meeting.version));
  obj:=meeting.id;updated_version:=meeting.version;target:=meeting.state;

 elsif p_action in ('interview.respond','interview.cancel','interview.complete') then
  perform public.jobkix_version(meeting.version,p_expected_version);
  if meeting.state not in ('proposed','scheduled') then raise exception 'INVALID_TRANSITION'; end if;
  if p_action='interview.respond' then
   target:=p_payload->>'response';if target not in ('accepted','declined','reschedule_requested') then raise exception 'INVALID_INPUT'; end if;
   if meeting.starts_at<=now() then raise exception 'INVALID_TRANSITION'; end if;
   update public.jobkix_interviews set candidate_response=target,state=case target when 'accepted' then 'scheduled' when 'declined' then 'declined' else 'proposed' end,version=version+1,updated_at=now() where id=meeting.id returning * into meeting;
  else
   if p_action='interview.complete' and meeting.ends_at>now() then raise exception 'INVALID_TRANSITION'; end if;
   update public.jobkix_interviews set state=case p_action when 'interview.cancel' then 'cancelled' else 'completed' end,version=version+1,updated_at=now() where id=meeting.id returning * into meeting;
  end if;
  perform public.jobkix_capture_interview_panels(meeting.id,meeting.version);
  perform public.jobkix_emit('interview.updated',meeting.id,actor,array[app.candidate_user_id]||public.jobkix_recruiters(app.vacancy_id),jsonb_build_object('applicationId',app.id,'interviewId',meeting.id,'version',meeting.version,'state',meeting.state));
  obj:=meeting.id;updated_version:=meeting.version;target:=meeting.state;

 elsif p_action='offer.create' then
  if app.state not in ('shortlisted','interview','offer') then raise exception 'INVALID_TRANSITION'; end if;
  insert into public.jobkix_offers(application_id,organization_id,candidate_user_id,title,terms,compensation,starts_at,response_deadline,created_by)
  values(app.id,app.organization_id,app.candidate_user_id,p_payload->>'title',p_payload->>'terms',public.jobkix_pay(p_payload->'compensation'),nullif(p_payload->>'startsAt','')::timestamptz,nullif(p_payload->>'responseDeadline','')::timestamptz,actor) returning * into offer;
  obj:=offer.id;updated_version:=offer.version;target:=offer.state;

 elsif p_action in ('offer.save','offer.send','offer.withdraw','offer.respond') then
  perform public.jobkix_version(offer.version,p_expected_version);
  if p_action='offer.save' then
   if offer.state<>'draft' then raise exception 'INVALID_TRANSITION'; end if;
   update public.jobkix_offers set title=p_payload->>'title',terms=p_payload->>'terms',compensation=public.jobkix_pay(p_payload->'compensation'),starts_at=nullif(p_payload->>'startsAt','')::timestamptz,response_deadline=nullif(p_payload->>'responseDeadline','')::timestamptz,version=version+1,updated_at=now() where id=offer.id returning * into offer;
  elsif p_action='offer.send' then
   if offer.state<>'draft' or app.state not in ('shortlisted','interview','offer') or offer.response_deadline<=now() then raise exception 'INVALID_TRANSITION'; end if;
   update public.jobkix_offers set state='sent',sent_at=now(),version=version+1,updated_at=now() where id=offer.id returning * into offer;
   update public.jobkix_applications set state='offer',version=version+1,updated_at=now() where id=app.id;
   insert into public.jobkix_application_events(application_id,type,public_detail,actor_user_id) values(app.id,'offer.sent',jsonb_build_object('offerId',offer.id,'version',offer.version),actor);
  elsif p_action='offer.withdraw' then
   if offer.state not in ('draft','sent') then raise exception 'INVALID_TRANSITION'; end if;
   update public.jobkix_offers set state='withdrawn',version=version+1,updated_at=now() where id=offer.id returning * into offer;
   insert into public.jobkix_application_events(application_id,type,public_detail,actor_user_id) values(app.id,'offer.withdrawn',jsonb_build_object('offerId',offer.id,'version',offer.version),actor);
  else
   if offer.state<>'sent' or app.state<>'offer' then raise exception 'INVALID_TRANSITION'; end if;
   if offer.response_deadline<=now() then raise exception 'OFFER_EXPIRED'; end if;
   target:=p_payload->>'response';if target not in ('accepted','declined') then raise exception 'INVALID_INPUT'; end if;
   update public.jobkix_offers set state=target,responded_at=now(),version=version+1,updated_at=now() where id=offer.id returning * into offer;
   update public.jobkix_applications set state=case target when 'accepted' then 'hired' else 'declined' end,version=version+1,updated_at=now() where id=app.id;
   insert into public.jobkix_application_events(application_id,type,public_detail,actor_user_id) values(app.id,'offer.'||target,jsonb_build_object('offerId',offer.id,'version',offer.version),actor);
  end if;
  perform public.jobkix_emit('offer.'||offer.state,offer.id,actor,array[app.candidate_user_id]||public.jobkix_recruiters(app.vacancy_id),jsonb_build_object('applicationId',app.id,'offerId',offer.id,'version',offer.version));
  obj:=offer.id;updated_version:=offer.version;target:=offer.state;

 else raise exception 'INVALID_INPUT';
 end if;

 if result is null then result:=jsonb_build_object('id',obj,'version',updated_version,'state',target,'replayed',false); end if;
 insert into public.jobkix_command_receipts(actor_user_id,idempotency_key,action,request_hash,result) values(actor,p_idempotency_key,p_action,req_hash,result);
 return result;
end $$;

revoke all on function public.jobkix_version(integer,integer),public.jobkix_array(jsonb,integer),public.jobkix_emit(text,uuid,uuid,uuid[],jsonb),public.jobkix_recruiters(uuid),public.jobkix_command(text,jsonb,integer,text) from public,anon,authenticated;
revoke all on function public.jobkix_preserve_hiring_revision() from public,anon,authenticated;
grant execute on function public.jobkix_command(text,jsonb,integer,text) to authenticated;
insert into public.jobkix_schema_versions(version) values(3);
commit;
