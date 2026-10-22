begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=10) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_draft_visible(p_user uuid,p_kind text,p_key text,p_body jsonb) returns boolean
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare object_id uuid;site_id uuid;v public.jobkix_vacancies;a public.jobkix_applications;uuid_pattern text:='^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$';begin
 if p_user is distinct from auth.uid() or not public.jobkix_own_active_account(p_user) then return false;end if;
 if p_kind='reputation' then
  if p_key in ('new-contribution:review','new-contribution:salary') then return true;end if;if split_part(p_key,':',1)<>'contribution' or split_part(p_key,':',2)!~*uuid_pattern or split_part(p_key,':',3)<>'' then return false;end if;
  return exists(select 1 from public.jobkix_reputation where id=split_part(p_key,':',2)::uuid and contributor_user_id=p_user);
 end if;
 if p_kind='talent' then
  if split_part(p_key,':',1)='candidate' then
   if split_part(p_key,':',2)!~*uuid_pattern or split_part(p_key,':',3)!~*uuid_pattern or split_part(p_key,':',4)<>'' then return false;end if;return public.jobkix_can_act(split_part(p_key,':',2)::uuid,'talent.search');
  end if;
  if split_part(p_key,':',1) not in ('new-pool','pool') or split_part(p_key,':',2)!~*uuid_pattern then return false;end if;
  object_id:=split_part(p_key,':',2)::uuid;
  if split_part(p_key,':',1)='pool' then
   if split_part(p_key,':',3)!~*uuid_pattern or split_part(p_key,':',4)<>'' then return false;end if;
   select organization_id into object_id from public.jobkix_talent_pools where id=object_id;
  elsif split_part(p_key,':',3)<>'' then return false;end if;
  return object_id is not null and public.jobkix_can_act(object_id,'talent.search');
 end if;
 if p_kind='team' then
  if split_part(p_key,':',1) not in ('invite','member','invitation') or split_part(p_key,':',2)!~*uuid_pattern or split_part(p_key,':',3)<>'' then return false;end if;
  object_id:=split_part(p_key,':',2)::uuid;
  if split_part(p_key,':',1)='member' then select organization_id into object_id from public.jobkix_memberships where id=object_id;
  elsif split_part(p_key,':',1)='invitation' then select organization_id into object_id from public.jobkix_invitations where id=object_id;end if;
  return object_id is not null and public.jobkix_can_act(object_id,'team.manage');
 end if;
 if p_kind='case' then
  if split_part(p_key,':',1)='support' then
   if split_part(p_key,':',2)!~*uuid_pattern or split_part(p_key,':',3)<>'' then return false;end if;return exists(select 1 from public.jobkix_memberships where organization_id=split_part(p_key,':',2)::uuid and user_id=p_user and active and (expires_at is null or expires_at>now()));
  end if;
  if split_part(p_key,':',1)='verification' then
   if split_part(p_key,':',2)!~*uuid_pattern or split_part(p_key,':',3)<>'' then return false;end if;return public.jobkix_can_act(split_part(p_key,':',2)::uuid,'organization.manage');
  end if;
  if p_key='new-case' then return true;end if;
  if split_part(p_key,':',1) not in ('reply','appeal') or split_part(p_key,':',2)!~*uuid_pattern or split_part(p_key,':',3)<>'' then return false;end if;
  return exists(select 1 from public.jobkix_cases where id=split_part(p_key,':',2)::uuid and reporter_user_id=p_user);
 end if;
 if p_kind='hiring' then
  if split_part(p_key,':',1)='pipeline' then
   if split_part(p_key,':',2)!~*uuid_pattern or split_part(p_key,':',3)<>'' then return false;end if;
   return public.jobkix_pipeline_authorized(split_part(p_key,':',2)::uuid,coalesce(p_body->'fields'->'applications','[]'::jsonb));
  end if;
  if split_part(p_key,':',1) not in ('interview','offer') or split_part(p_key,':',2)!~*uuid_pattern
   or (split_part(p_key,':',3)<>'new' and split_part(p_key,':',3)!~*uuid_pattern) or split_part(p_key,':',4)<>'' then return false;end if;
  select * into a from public.jobkix_applications where id=split_part(p_key,':',2)::uuid;
  if not found or a.candidate_user_id=p_user or not public.jobkix_application_visible(a.id) then return false;end if;
  select * into v from public.jobkix_vacancies where id=a.vacancy_id;
  return public.jobkix_can_act(a.organization_id,case split_part(p_key,':',1) when 'interview' then 'interview.manage' else 'offer.write' end,v.site_id,v.id);
 end if;
 if p_kind='profile' then return exists(select 1 from public.jobkix_candidates where user_id=p_user);end if;
 if p_kind='organization' and split_part(p_key,':',1)='site' then
  if split_part(p_key,':',2)!~*uuid_pattern or (split_part(p_key,':',3)<>'new' and split_part(p_key,':',3)!~*uuid_pattern) or split_part(p_key,':',4)<>'' then return false;end if;
  object_id:=split_part(p_key,':',2)::uuid;
  if split_part(p_key,':',3)<>'new' and not exists(select 1 from public.jobkix_sites where id=split_part(p_key,':',3)::uuid and organization_id=object_id) then return false;end if;
  return public.jobkix_can_act(object_id,'organization.manage');
 end if;
 if p_kind='organization' and p_key='new-organization' then return true;end if;
 if p_kind='vacancy' and p_key like 'new-vacancy:%' then
  if substring(p_key from 13)!~*uuid_pattern then return false;end if;object_id:=substring(p_key from 13)::uuid;
  if nullif(p_body->'fields'->>'siteId','') is not null then
   if p_body->'fields'->>'siteId'!~*uuid_pattern then return false;end if;site_id:=(p_body->'fields'->>'siteId')::uuid;
   if not exists(select 1 from public.jobkix_sites where id=site_id and organization_id=object_id and active) then return false;end if;
  end if;return public.jobkix_can_act(object_id,'vacancy.write',site_id);
 end if;
 if p_kind='vacancy' and p_key like 'vacancy-action:%' then p_key:=substring(p_key from 16);end if;
 if p_key!~*uuid_pattern then return false;end if;object_id:=p_key::uuid;
 if p_kind='message' then return public.jobkix_application_visible(object_id);end if;
 if p_kind='organization' then return public.jobkix_can_act(object_id,'organization.manage');end if;
 if p_kind='application' then return exists(select 1 from public.jobkix_candidates candidate_record join public.jobkix_vacancies vacancy_record on vacancy_record.id=object_id and vacancy_record.published_at is not null where candidate_record.user_id=p_user);end if;
 if p_kind='vacancy' then select * into v from public.jobkix_vacancies where id=object_id;return found and public.jobkix_can_act(v.organization_id,'vacancy.write',v.site_id,v.id);end if;
 return false;
end $$;
revoke all on function public.jobkix_draft_visible(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.jobkix_draft_visible(uuid,text,text,jsonb) to authenticated;
drop policy jobkix_drafts_self on public.jobkix_drafts;
create policy jobkix_drafts_self on public.jobkix_drafts for select to authenticated using(public.jobkix_draft_visible(user_id,kind,draft_key,body));
insert into public.jobkix_schema_versions(version) values(11);
commit;
