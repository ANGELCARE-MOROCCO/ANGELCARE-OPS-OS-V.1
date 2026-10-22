begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=4) then raise exception 'JOBKIX_MIGRATION_ORDER'; end if; end $$;

create function public.jobkix_workspace_command(p_action text,p_payload jsonb,p_expected_version integer,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor(); req_hash text; prior public.jobkix_command_receipts; result jsonb;
 org public.jobkix_organizations; member public.jobkix_memberships; invitation public.jobkix_invitations;
 candidate public.jobkix_candidates; pool public.jobkix_talent_pools; c public.jobkix_cases; private_org public.jobkix_organization_private;
 reputation_parent public.jobkix_reputation;reputation_methodology jsonb;
 meeting public.jobkix_interviews; vac public.jobkix_vacancies; account public.jobkix_accounts;
 parent_org uuid; obj uuid; updated_version integer:=1; current_version integer; target text:='saved';
 new_site_ids uuid[]; new_vacancy_ids uuid[]; token text; target_email text; event_id uuid; lang text;
begin
 if p_payload is null or p_action is null or p_idempotency_key is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>200000 or length(p_idempotency_key) not between 16 and 180 then raise exception 'INVALID_INPUT'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':'||p_idempotency_key,0));
 if p_action='draft.save' and not public.jobkix_draft_visible(actor,p_payload->>'kind',p_payload->>'key',p_payload->'body') then raise exception 'FORBIDDEN';end if;
 req_hash:=encode(sha256(convert_to(jsonb_build_object('action',p_action,'payload',p_payload,'expectedVersion',p_expected_version)::text,'UTF8')),'hex');
 if p_action in ('organization.save','site.create','site.save','team.invite','team.change','team.transfer','team.revoke','pool.create','pool.add','pool.remove','verification.submit') then
  if p_action='team.revoke' then
   select * into invitation from public.jobkix_invitations where id=(p_payload->>'id')::uuid for update;if not found then raise exception 'NOT_FOUND';end if;parent_org:=invitation.organization_id;
  elsif p_action like 'team.%' and p_action<>'team.invite' then
   select * into member from public.jobkix_memberships where id=(p_payload->>'id')::uuid for update;
   if not found then raise exception 'NOT_FOUND'; end if;parent_org:=member.organization_id;
  elsif p_action in ('pool.add','pool.remove') then
   select * into pool from public.jobkix_talent_pools where id=(p_payload->>'poolId')::uuid for update;
   if not found then raise exception 'NOT_FOUND'; end if;parent_org:=pool.organization_id;
  elsif p_action='site.save' then
   select organization_id into parent_org from public.jobkix_sites where id=(p_payload->>'id')::uuid;
   if not found then raise exception 'NOT_FOUND'; end if;
  else parent_org:=(p_payload->>'organizationId')::uuid; end if;
  if not public.jobkix_can_act(parent_org,case when p_action like 'team.%' then 'team.manage' when p_action like 'pool.%' then 'talent.search' else 'organization.manage' end) then raise exception 'FORBIDDEN'; end if;
  select * into org from public.jobkix_organizations where id=parent_org for update;
 end if;
 select * into prior from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_idempotency_key;
 if found then if prior.request_hash<>req_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return prior.result||jsonb_build_object('replayed',true);end if;

 if p_action='employer.search.save' then
  select * into org from public.jobkix_organizations where id=(p_payload->>'organizationId')::uuid and status='active' and public_profile_approved_at is not null;if not found then raise exception 'NOT_FOUND';end if;
  perform pg_advisory_xact_lock(hashtextextended('jobkix-employer-search:'||actor::text||':'||org.id::text,0));
  select id,version into obj,updated_version from public.jobkix_saved_searches where user_id=actor and filters=jsonb_build_object('organizationId',org.id::text) order by created_at desc,id limit 1;
  if not found then insert into public.jobkix_saved_searches(user_id,name,filters,frequency,enabled) values(actor,org.public_name,jsonb_build_object('organizationId',org.id::text),'off',true) returning id,version into obj,updated_version;end if;
 elsif p_action='saved.save' then
  if not exists(select 1 from public.jobkix_vacancies where id=(p_payload->>'vacancyId')::uuid and published_at is not null) then raise exception 'NOT_FOUND';end if;
  perform pg_advisory_xact_lock(hashtextextended('jobkix-saved:'||actor::text||':'||(p_payload->>'vacancyId'),0));
  select version into current_version from public.jobkix_saved_jobs where user_id=actor and vacancy_id=(p_payload->>'vacancyId')::uuid for update;
  if found then perform public.jobkix_version(current_version,p_expected_version);elsif p_expected_version is distinct from 0 then raise exception 'VERSION_CONFLICT';end if;
  insert into public.jobkix_saved_jobs(user_id,vacancy_id,collection) values(actor,(p_payload->>'vacancyId')::uuid,coalesce(p_payload->>'collection','default'))
  on conflict(user_id,vacancy_id) do update set collection=excluded.collection,saved=true,version=jobkix_saved_jobs.version+1,saved_at=now() returning version into updated_version;
  obj:=(p_payload->>'vacancyId')::uuid;
 elsif p_action='saved.remove' then
  perform pg_advisory_xact_lock(hashtextextended('jobkix-saved:'||actor::text||':'||(p_payload->>'vacancyId'),0));
  select version into current_version from public.jobkix_saved_jobs where user_id=actor and vacancy_id=(p_payload->>'vacancyId')::uuid for update;
  if found then perform public.jobkix_version(current_version,p_expected_version);elsif p_expected_version is distinct from 0 then raise exception 'VERSION_CONFLICT';end if;
  update public.jobkix_saved_jobs set saved=false,version=version+1 where user_id=actor and vacancy_id=(p_payload->>'vacancyId')::uuid returning version into updated_version;
  updated_version:=coalesce(updated_version,0);
  obj:=(p_payload->>'vacancyId')::uuid;target:='removed';
 elsif p_action='search.save' then
  if jsonb_typeof(p_payload->'filters')<>'object' or octet_length((p_payload->'filters')::text)>6000 then raise exception 'INVALID_INPUT';end if;
  if exists(select 1 from jsonb_each(p_payload->'filters') f where f.key not in ('q','origin','destination','reach','city','setting','occupation','organizationId','workSchedule','contractType','workLocation','language','ageCohort','sponsorship','relocation','salaryMinimum','currency','salaryUnit','sort') or jsonb_typeof(f.value)<>'string') then raise exception 'INVALID_INPUT';end if;
  perform public.jobkix_search(p_payload->'filters');
  if p_payload->>'frequency' not in ('off','daily','weekly') or coalesce(jsonb_typeof(p_payload->'enabled'),'null')<>'boolean' then raise exception 'INVALID_INPUT';end if;
  if nullif(p_payload->>'id','') is null then
   insert into public.jobkix_saved_searches(user_id,name,filters,frequency,enabled) values(actor,p_payload->>'name',p_payload->'filters',p_payload->>'frequency',(p_payload->>'enabled')::boolean) returning id,version into obj,updated_version;
  else
   select version into current_version from public.jobkix_saved_searches where id=(p_payload->>'id')::uuid and user_id=actor for update;
   if not found then raise exception 'NOT_FOUND';end if;perform public.jobkix_version(current_version,p_expected_version);
   update public.jobkix_saved_searches set name=p_payload->>'name',filters=p_payload->'filters',frequency=p_payload->>'frequency',enabled=(p_payload->>'enabled')::boolean,last_run_at=null,retry_after=null,last_error_code=null,version=version+1 where id=(p_payload->>'id')::uuid returning id,version into obj,updated_version;
  end if;
 elsif p_action='search.remove' then
  select version into current_version from public.jobkix_saved_searches where id=(p_payload->>'id')::uuid and user_id=actor for update;
  if not found then raise exception 'NOT_FOUND';end if;perform public.jobkix_version(current_version,p_expected_version);
  delete from public.jobkix_saved_searches where id=(p_payload->>'id')::uuid;obj:=(p_payload->>'id')::uuid;target:='removed';
 elsif p_action='draft.save' then
  if p_payload->>'kind' not in ('application','vacancy','message','profile','organization','hiring','case','team','talent','reputation') or jsonb_typeof(p_payload->'body')<>'object' or length(p_payload->>'key') not between 1 and 180 then raise exception 'INVALID_INPUT';end if;
  perform pg_advisory_xact_lock(hashtextextended('jobkix-draft:'||actor::text||':'||(p_payload->>'kind')||':'||(p_payload->>'key'),0));
  select version into current_version from public.jobkix_drafts where user_id=actor and kind=p_payload->>'kind' and draft_key=p_payload->>'key' for update;
  if found then
   perform public.jobkix_version(current_version,p_expected_version);
   update public.jobkix_drafts set body=p_payload->'body',version=version+1,updated_at=now() where user_id=actor and kind=p_payload->>'kind' and draft_key=p_payload->>'key' returning version into updated_version;
  else
   if p_expected_version<>0 then raise exception 'VERSION_CONFLICT';end if;
   insert into public.jobkix_drafts(user_id,kind,draft_key,body) values(actor,p_payload->>'kind',p_payload->>'key',p_payload->'body');
  end if;obj:=actor;
 elsif p_action='draft.remove' then
  delete from public.jobkix_drafts where user_id=actor and kind=p_payload->>'kind' and draft_key=p_payload->>'key' and version=p_expected_version;
  if not found then raise exception 'VERSION_CONFLICT';end if;obj:=actor;target:='removed';
 elsif p_action in ('privacy.block','privacy.unblock') then
  if not exists(select 1 from public.jobkix_candidates where user_id=actor) then raise exception 'FORBIDDEN';end if;
  if p_action='privacy.block' then insert into public.jobkix_candidate_blocks(candidate_user_id,organization_id) values(actor,(p_payload->>'organizationId')::uuid) on conflict do nothing;
  else delete from public.jobkix_candidate_blocks where candidate_user_id=actor and organization_id=(p_payload->>'organizationId')::uuid;end if;
  obj:=actor;
 elsif p_action='settings.save' then
  select * into account from public.jobkix_accounts where user_id=actor for update;perform public.jobkix_version(account.version,p_expected_version);
  if p_payload->>'locale' not in ('en','fr','es','hi','tl','id','ar') or not exists(select 1 from pg_timezone_names where name=p_payload->>'timezone') then raise exception 'INVALID_INPUT';end if;
  update public.jobkix_accounts set preferred_locale=p_payload->>'locale',timezone=p_payload->>'timezone',notifications_email=(p_payload->>'emailNotifications')::boolean,version=version+1,updated_at=now() where user_id=actor returning version into updated_version;obj:=actor;
 elsif p_action='organization.save' then
  perform public.jobkix_version(org.version,p_expected_version);
  select * into private_org from public.jobkix_organization_private where organization_id=org.id for update;
  update public.jobkix_organizations set public_name=p_payload->>'publicName',public_description=p_payload->>'description',country=p_payload->>'country',city=p_payload->>'city',
   original_locale=coalesce(p_payload->>'originalLocale',org.original_locale),
   public_profile_approved_at=case when row(org.public_name,org.public_description,org.country,org.city,org.original_locale) is distinct from row(p_payload->>'publicName',p_payload->>'description',p_payload->>'country',p_payload->>'city',coalesce(p_payload->>'originalLocale',org.original_locale)) then null else org.public_profile_approved_at end,
   identity_reviewed_until=case when org.country is distinct from p_payload->>'country' or private_org.legal_name is distinct from coalesce(p_payload->>'legalName','') then null else org.identity_reviewed_until end,
   identity_review_reference=case when org.country is distinct from p_payload->>'country' or private_org.legal_name is distinct from coalesce(p_payload->>'legalName','') then null else org.identity_review_reference end,
   version=version+1,updated_at=now() where id=org.id returning version into updated_version;
  if org.country is distinct from p_payload->>'country' or private_org.legal_name is distinct from coalesce(p_payload->>'legalName','') then update public.jobkix_employer_media_approvals set revoked_at=coalesce(revoked_at,now()) where organization_id=org.id;end if;
  -- Private contact is never copied into public_name/description by this command.
  update public.jobkix_organization_private set legal_name=coalesce(p_payload->>'legalName',''),contact_email=coalesce(p_payload->>'contactEmail',''),contact_phone=coalesce(p_payload->>'contactPhone',''),private_address=coalesce(p_payload->>'privateAddress',''),updated_at=now() where organization_id=org.id;obj:=org.id;
 elsif p_action in ('site.create','site.save') then
  if not exists(select 1 from pg_timezone_names where name=p_payload->>'timezone') then raise exception 'INVALID_INPUT';end if;
  if p_action='site.create' then
   insert into public.jobkix_sites(organization_id,label,country,region,city,timezone) values(parent_org,p_payload->>'label',p_payload->>'country',coalesce(p_payload->>'region',''),p_payload->>'city',p_payload->>'timezone') returning id,version into obj,updated_version;
  else
   select version into current_version from public.jobkix_sites where id=(p_payload->>'id')::uuid for update;perform public.jobkix_version(current_version,p_expected_version);
   update public.jobkix_sites set label=p_payload->>'label',country=p_payload->>'country',region=coalesce(p_payload->>'region',''),city=p_payload->>'city',timezone=p_payload->>'timezone',active=(p_payload->>'active')::boolean,version=version+1 where id=(p_payload->>'id')::uuid returning id,version into obj,updated_version;
  end if;
 elsif p_action='team.invite' then
  target_email:=lower(trim(p_payload->>'email'));lang:=p_payload->>'locale';
  if exists(select 1 from public.jobkix_invitations where organization_id=org.id and email=target_email and accepted_by is null and revoked_at is null and expires_at>now()) or exists(select 1 from public.jobkix_memberships m join auth.users u on u.id=m.user_id where m.organization_id=org.id and lower(u.email)=target_email) then raise exception 'INVALID_TRANSITION';end if;
  if target_email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or lang not in ('en','fr','es','hi','tl','id','ar') then raise exception 'INVALID_INPUT';end if;
  new_site_ids:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_payload->'siteIds','[]')));
  new_vacancy_ids:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_payload->'vacancyIds','[]')));
  if exists(select 1 from unnest(new_site_ids)x where not exists(select 1 from public.jobkix_sites where id=x and organization_id=org.id and active))
   or exists(select 1 from unnest(new_vacancy_ids)x where not exists(select 1 from public.jobkix_vacancies where id=x and organization_id=org.id)) then raise exception 'FORBIDDEN';end if;
  token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
  insert into public.jobkix_invitations(organization_id,email,token_hash,role,site_ids,vacancy_ids,invited_by,expires_at)
  values(org.id,target_email,encode(sha256(convert_to(token,'UTF8')),'hex'),p_payload->>'role',new_site_ids,new_vacancy_ids,actor,now()+interval '7 days') returning id into obj;
  event_id:=public.jobkix_emit('team.invited',obj,actor,'{}',jsonb_build_object('organizationId',org.id,'invitationId',obj));
  insert into public.jobkix_outbox(event_id,recipient_email,channel,template_key,locale,data)
  values(event_id,target_email,'email','team.invited',lang,jsonb_build_object('organizationId',org.id,'invitationId',obj,'token',token));target:='invited';
 elsif p_action='team.revoke' then
  perform public.jobkix_version(invitation.version,p_expected_version);if invitation.accepted_by is not null or invitation.revoked_at is not null then raise exception 'INVALID_TRANSITION';end if;
  update public.jobkix_invitations set revoked_at=now(),version=version+1 where id=invitation.id returning version into updated_version;
  update public.jobkix_outbox set state='cancelled',locked_until=null,lock_token=null where template_key='team.invited' and data->>'invitationId'=invitation.id::text and state in ('pending','failed');obj:=invitation.id;target:='revoked';
 elsif p_action='team.accept' then
  select * into invitation from public.jobkix_invitations where id=(p_payload->>'id')::uuid for update;
  if not found or invitation.revoked_at is not null or invitation.expires_at<=now() then raise exception 'FORBIDDEN';end if;
  if invitation.accepted_by is not null then raise exception 'INVALID_TRANSITION';end if;
  if invitation.token_hash<>encode(sha256(convert_to(p_payload->>'token','UTF8')),'hex') or not exists(select 1 from auth.users where id=actor and lower(email)=invitation.email and email_confirmed_at is not null)
   or not exists(select 1 from public.jobkix_organizations where id=invitation.organization_id and status='active')
   or not exists(select 1 from public.jobkix_memberships m where m.user_id=invitation.invited_by and m.organization_id=invitation.organization_id and m.active and m.role in ('owner','admin') and cardinality(m.site_ids)=0 and cardinality(m.vacancy_ids)=0 and (m.expires_at is null or m.expires_at>now())) then raise exception 'FORBIDDEN';end if;
  if exists(select 1 from public.jobkix_memberships where organization_id=invitation.organization_id and user_id=actor) then raise exception 'INVALID_TRANSITION';end if;
  insert into public.jobkix_memberships(organization_id,user_id,role,site_ids,vacancy_ids) values(invitation.organization_id,actor,invitation.role,invitation.site_ids,invitation.vacancy_ids) returning id into obj;
  update public.jobkix_invitations set accepted_by=actor,accepted_at=now(),version=version+1 where id=invitation.id;target:='accepted';
 elsif p_action in ('team.change','team.transfer') then
  perform public.jobkix_version(member.version,p_expected_version);
  if member.role='owner' or p_action='team.transfer' then
   if not exists(select 1 from public.jobkix_memberships where organization_id=org.id and user_id=actor and role='owner' and active) then raise exception 'FORBIDDEN';end if;
  end if;
  if p_action='team.transfer' then
   if not member.active or (member.expires_at is not null and member.expires_at<=now()) or member.user_id=actor or cardinality(member.site_ids)>0 or cardinality(member.vacancy_ids)>0
   or not exists(select 1 from public.jobkix_accounts a where a.user_id=member.user_id and a.status='active') then raise exception 'INVALID_INPUT';end if;
   update public.jobkix_memberships set role='owner',version=version+1 where id=member.id returning version into updated_version;
   update public.jobkix_memberships set role='admin',version=version+1 where organization_id=org.id and user_id=actor;
  else
   if p_payload->>'role' not in ('admin','recruiter','hiring_manager','interviewer','viewer') then raise exception 'INVALID_INPUT';end if;
   if member.role='owner' and not exists(select 1 from public.jobkix_memberships m join public.jobkix_accounts a on a.user_id=m.user_id where m.organization_id=org.id and m.role='owner' and m.active and m.id<>member.id and (m.expires_at is null or m.expires_at>now()) and cardinality(m.site_ids)=0 and cardinality(m.vacancy_ids)=0 and a.status='active') then raise exception 'INVALID_TRANSITION';end if;
   new_site_ids:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_payload->'siteIds','[]')));
   new_vacancy_ids:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_payload->'vacancyIds','[]')));
   if exists(select 1 from unnest(new_site_ids)x where not exists(select 1 from public.jobkix_sites where id=x and organization_id=org.id)) or exists(select 1 from unnest(new_vacancy_ids)x where not exists(select 1 from public.jobkix_vacancies where id=x and organization_id=org.id)) then raise exception 'FORBIDDEN';end if;
   update public.jobkix_memberships set role=p_payload->>'role',active=(p_payload->>'active')::boolean,site_ids=new_site_ids,vacancy_ids=new_vacancy_ids,version=version+1 where id=member.id returning version into updated_version;
  end if;obj:=member.id;
 elsif p_action='pool.create' then
  insert into public.jobkix_talent_pools(organization_id,name,created_by) values(parent_org,p_payload->>'name',actor) returning id into obj;
 elsif p_action in ('pool.add','pool.remove') then
  if p_action='pool.add' then
   if not public.jobkix_candidate_discoverable((p_payload->>'candidateUserId')::uuid,parent_org) then raise exception 'FORBIDDEN';end if;
   select version into current_version from public.jobkix_talent_pool_members where pool_id=pool.id and candidate_user_id=(p_payload->>'candidateUserId')::uuid and expires_at>now() for update;
   if found then perform public.jobkix_version(current_version,p_expected_version);elsif p_expected_version is distinct from 0 then raise exception 'VERSION_CONFLICT';end if;
   insert into public.jobkix_talent_pool_members(pool_id,candidate_user_id,added_by,expires_at) values(pool.id,(p_payload->>'candidateUserId')::uuid,actor,now()+interval '90 days') on conflict(pool_id,candidate_user_id) do update set expires_at=excluded.expires_at,added_by=excluded.added_by,version=jobkix_talent_pool_members.version+1 returning version into updated_version;
  else
   select version into current_version from public.jobkix_talent_pool_members where pool_id=pool.id and candidate_user_id=(p_payload->>'candidateUserId')::uuid for update;
   if not found then raise exception 'NOT_FOUND';end if;perform public.jobkix_version(current_version,p_expected_version);
   delete from public.jobkix_talent_pool_members where pool_id=pool.id and candidate_user_id=(p_payload->>'candidateUserId')::uuid;updated_version:=current_version+1;target:='removed';end if;obj:=pool.id;
 elsif p_action='evaluation.save' then
  select * into meeting from public.jobkix_interviews where id=(p_payload->>'interviewId')::uuid for update;
  if not found or meeting.candidate_user_id=actor or not public.jobkix_interview_visible(meeting.id) or not public.jobkix_application_visible(meeting.application_id) then raise exception 'FORBIDDEN';end if;
  select * into vac from public.jobkix_vacancies where id=(select vacancy_id from public.jobkix_applications where id=meeting.application_id);
  if not public.jobkix_can_act(meeting.organization_id,'evaluation.write',vac.site_id,vac.id) or jsonb_typeof(p_payload->'criteria')<>'object' then raise exception 'FORBIDDEN';end if;
  select id,version into obj,current_version from public.jobkix_evaluations where interview_id=meeting.id and evaluator_user_id=actor for update;
  if found then
   perform public.jobkix_version(current_version,p_expected_version);
   update public.jobkix_evaluations set professional_criteria=p_payload->'criteria',confidential_notes=p_payload->>'notes',version=version+1,updated_at=now() where id=obj returning version into updated_version;
  else insert into public.jobkix_evaluations(interview_id,evaluator_user_id,professional_criteria,confidential_notes) values(meeting.id,actor,p_payload->'criteria',p_payload->>'notes') returning id into obj;end if;
 elsif p_action in ('case.create','verification.submit','privacy.request','case.reply','case.appeal') then
  result:=public.jobkix_case_effect(actor,p_action,p_payload,p_expected_version,parent_org);obj:=(result->>'id')::uuid;
 elsif p_action='reputation.contribute' then
  reputation_methodology:=public.jobkix_public_editorial('reputation-methodology',p_payload->>'locale');if reputation_methodology is null then raise exception 'DEPENDENCY_UNAVAILABLE';end if;
  if coalesce(p_payload->'publicationConsent','null')<>'true'::jsonb then raise exception 'INVALID_INPUT';end if;if p_payload->>'methodologyRevision' is distinct from reputation_methodology->>'sourceHash' then raise exception 'VERSION_CONFLICT';end if;
  if not exists(select 1 from public.jobkix_organizations where id=(p_payload->>'organizationId')::uuid and status='active' and public_profile_approved_at is not null) then raise exception 'NOT_FOUND';end if;
  if p_payload->>'kind' not in ('review','salary') or p_payload->>'locale' not in ('en','fr','es','hi','tl','id','ar') or length(trim(p_payload->>'relationship')) not between 1 and 500 or length(trim(p_payload->>'body')) not between 20 and 12000 then raise exception 'INVALID_INPUT';end if;
  if nullif(p_payload->>'parentId','') is not null then
   select * into reputation_parent from public.jobkix_reputation where id=(p_payload->>'parentId')::uuid and contributor_user_id=actor for update;
   if not found then raise exception 'FORBIDDEN';end if;perform public.jobkix_version(reputation_parent.version,p_expected_version);
   if reputation_parent.kind<>p_payload->>'kind' or reputation_parent.organization_id<>(p_payload->>'organizationId')::uuid or reputation_parent.state='withdrawn' or exists(select 1 from public.jobkix_reputation where parent_id=reputation_parent.id and state in ('submitted','under_review')) then raise exception 'INVALID_TRANSITION';end if;
  elsif p_expected_version is distinct from 0 then raise exception 'VERSION_CONFLICT';end if;
  if p_payload->>'kind'='salary' then
   perform public.jobkix_pay(jsonb_build_object('minimum',p_payload->'amount','maximum',null,'currency',p_payload->>'currency','unit',p_payload->>'unit'));
   if coalesce(p_payload->>'country','')!~'^[A-Z]{2}$' or not exists(select 1 from public.jobkix_taxonomy where kind='occupation' and key=p_payload->>'professionId' and status='published') then raise exception 'INVALID_INPUT';end if;
  end if;
  insert into public.jobkix_reputation(organization_id,contributor_user_id,kind,original_locale,body,evidence,amount,currency,unit,profession_id,country,rating,parent_id,parent_version,publication_consented_at,consent_methodology_hash)
  values((p_payload->>'organizationId')::uuid,actor,p_payload->>'kind',p_payload->>'locale',p_payload->>'body',jsonb_build_object('provenance','contributor_declaration','relationship',p_payload->>'relationship'),(p_payload->>'amount')::numeric,p_payload->>'currency',p_payload->>'unit',p_payload->>'professionId',p_payload->>'country',nullif(p_payload->>'rating','')::smallint,reputation_parent.id,reputation_parent.version,now(),reputation_methodology->>'sourceHash') returning id into obj;target:='submitted';
 elsif p_action='reputation.withdraw' then
  select * into reputation_parent from public.jobkix_reputation where id=(p_payload->>'id')::uuid and contributor_user_id=actor for update;if not found then raise exception 'FORBIDDEN';end if;perform public.jobkix_version(reputation_parent.version,p_expected_version);
  if reputation_parent.state='withdrawn' then raise exception 'INVALID_TRANSITION';end if;update public.jobkix_reputation set state='withdrawn',version=version+1 where id=reputation_parent.id returning version into updated_version;obj:=reputation_parent.id;target:='withdrawn';
 elsif p_action='notification.read' then
  update public.jobkix_outbox set read_at=coalesce(read_at,now()) where id=(p_payload->>'id')::uuid and recipient_user_id=actor and channel='in_app' returning id into obj;
  if not found then raise exception 'NOT_FOUND';end if;target:='read';
 else raise exception 'INVALID_INPUT';end if;

 perform public.jobkix_emit(p_action,obj,actor,'{}',jsonb_build_object('objectId',obj));
 if result is null then result:=jsonb_build_object('id',obj,'version',updated_version,'state',target,'replayed',false);end if;
 insert into public.jobkix_command_receipts(actor_user_id,idempotency_key,action,request_hash,result) values(actor,p_idempotency_key,p_action,req_hash,result);
 return result;
end $$;
revoke all on function public.jobkix_workspace_command(text,jsonb,integer,text) from public,anon,authenticated;
grant execute on function public.jobkix_workspace_command(text,jsonb,integer,text) to authenticated;
insert into public.jobkix_schema_versions(version) values(5);
commit;
