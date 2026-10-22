begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=15) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
alter table public.jobkix_talent_pool_members add column version integer not null default 1 check(version>0);
alter table public.jobkix_interviews add column created_at timestamptz not null default now();
alter table public.jobkix_invitations add column version integer not null default 1 check(version>0);
alter table public.jobkix_drafts drop constraint jobkix_drafts_kind_check;
alter table public.jobkix_drafts add constraint jobkix_drafts_kind_check check(kind in ('application','vacancy','message','profile','organization','hiring','case','team','talent'));
-- No contact details, current CVs, exact addresses or private availability preferences are projected.
create function public.jobkix_talent_projection(p_user uuid) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('id',c.id,'userId',c.user_id,'displayName',c.display_name,'headline',c.headline,'summary',c.summary,'country',c.country,'skills',c.skills,'occupations',c.occupations,'languages',c.languages,'experience',c.experience,'education',c.education,'updatedAt',c.updated_at)
 from public.jobkix_candidates c where c.user_id=p_user
$$;
revoke all on function public.jobkix_talent_projection(uuid) from public,anon,authenticated;
create function public.jobkix_talent_page(p_org uuid,p_filters jsonb default '{}',p_page integer default 1,p_pool uuid default null) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if not public.jobkix_can_act(p_org,'talent.search') then raise exception 'FORBIDDEN';end if;
 if p_page is null or p_page not between 1 and 10000 or p_filters is null or jsonb_typeof(p_filters)<>'object' or octet_length(p_filters::text)>3000 then raise exception 'INVALID_INPUT';end if;
 if exists(select 1 from jsonb_each(p_filters) f where key not in ('q','country','occupation','skill','language','experience') or jsonb_typeof(value)<>'string' or length(value#>>'{}')>300)
 or (p_filters?'country' and p_filters->>'country'!~'^[A-Z]{2}$') or (p_filters?'experience' and p_filters->>'experience' not in ('recorded','none')) then raise exception 'INVALID_INPUT';end if;
 if p_pool is not null and not exists(select 1 from public.jobkix_talent_pools where id=p_pool and organization_id=p_org) then raise exception 'FORBIDDEN';end if;
 with eligible as (
  select c.*,m.expires_at as pool_expires_at,m.version as pool_member_version from public.jobkix_candidates c left join public.jobkix_talent_pool_members m on m.candidate_user_id=c.user_id and m.pool_id=p_pool
  where public.jobkix_candidate_discoverable(c.user_id,p_org) and (p_pool is null or m.expires_at>now())
  and position(lower(coalesce(p_filters->>'q','')) in lower(c.display_name||' '||c.headline||' '||c.summary||' '||array_to_string(c.skills,' ')))>0
  and (not p_filters?'country' or c.country=p_filters->>'country')
  and (not p_filters?'occupation' or p_filters->>'occupation'=any(c.occupations))
  and (not p_filters?'language' or p_filters->>'language'=any(c.languages))
  and (not p_filters?'skill' or exists(select 1 from unnest(c.skills) skill where position(lower(p_filters->>'skill') in lower(skill))>0))
  and (not p_filters?'experience' or (case p_filters->>'experience' when 'recorded' then jsonb_array_length(c.experience)>0 else jsonb_array_length(c.experience)=0 end))
 ),paged as (select * from eligible order by updated_at desc,id offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(public.jobkix_talent_projection(c.user_id)||jsonb_build_object('poolExpiresAt',c.pool_expires_at,'poolMemberVersion',c.pool_member_version) order by c.updated_at desc,c.id) from paged c),'[]'),'total',(select count(*) from eligible),'page',p_page,'pageSize',24) into result;return result;
end $$;
-- Keep the earlier two-argument adapter compatible while using this single eligibility projection.
create or replace function public.jobkix_talent_search(p_org uuid,p_query text default '') returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$ select public.jobkix_talent_page(p_org,jsonb_build_object('q',coalesce(p_query,'')),1,null)->'items' $$;
create function public.jobkix_team_page(p_org uuid,p_page integer default 1,p_invitations boolean default false) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if not public.jobkix_can_act(p_org,'team.manage') then raise exception 'FORBIDDEN';end if;
 if p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 if p_invitations then
  with eligible as (select * from public.jobkix_invitations where organization_id=p_org),paged as (select * from eligible order by created_at desc,id offset (p_page-1)*24 limit 24)
  select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'email',i.email,'role',i.role,'site_ids',i.site_ids,'vacancy_ids',i.vacancy_ids,'expires_at',i.expires_at,'accepted_at',i.accepted_at,'revoked_at',i.revoked_at,'created_at',i.created_at,'version',i.version,
    'delivery',(select jsonb_build_object('state',o.state,'attempts',o.attempts) from public.jobkix_outbox o where o.template_key='team.invited' and o.data->>'invitationId'=i.id::text order by o.created_at desc limit 1)) order by i.created_at desc,i.id) from paged i),'[]'),'total',(select count(*) from eligible),'page',p_page,'pageSize',24) into result;
 else
  with eligible as (select m.*,a.display_name from public.jobkix_memberships m join public.jobkix_accounts a on a.user_id=m.user_id where m.organization_id=p_org),paged as (select * from eligible order by created_at,id offset (p_page-1)*24 limit 24)
  select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'user_id',m.user_id,'name',m.display_name,'role',m.role,'site_ids',m.site_ids,'vacancy_ids',m.vacancy_ids,'active',m.active,'expires_at',m.expires_at,'version',m.version) order by m.created_at,m.id) from paged m),'[]'),'total',(select count(*) from eligible),'page',p_page,'pageSize',24) into result;
 end if;return result;
end $$;
create function public.jobkix_team_receipt(p_action text,p_key text) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();receipt public.jobkix_command_receipts;org_id uuid;begin
 if p_action not in ('team.invite','team.change','team.transfer','team.revoke') or length(coalesce(p_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 select * into receipt from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_key and action=p_action;if not found then return null;end if;
 if p_action in ('team.invite','team.revoke') then select organization_id into org_id from public.jobkix_invitations where id=(receipt.result->>'id')::uuid;else select organization_id into org_id from public.jobkix_memberships where id=(receipt.result->>'id')::uuid;end if;
 if org_id is null or not public.jobkix_can_act(org_id,'team.manage') then raise exception 'FORBIDDEN';end if;return receipt.result||jsonb_build_object('recordedAt',receipt.created_at);
end $$;
create function public.jobkix_talent_receipt(p_action text,p_key text) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();receipt public.jobkix_command_receipts;org_id uuid;begin
 if p_action not in ('pool.create','pool.add','pool.remove') or length(coalesce(p_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 select * into receipt from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_key and action=p_action;if not found then return null;end if;
 select organization_id into org_id from public.jobkix_talent_pools where id=(receipt.result->>'id')::uuid;
 if org_id is null or not public.jobkix_can_act(org_id,'talent.search') then raise exception 'FORBIDDEN';end if;return receipt.result||jsonb_build_object('recordedAt',receipt.created_at);
end $$;
create function public.jobkix_hiring_analytics(p_org uuid,p_from timestamptz,p_until timestamptz) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if not exists(select 1 from public.jobkix_memberships m join public.jobkix_organizations o on o.id=m.organization_id and o.status='active' where m.user_id=public.jobkix_actor() and m.organization_id=p_org and m.active and (m.expires_at is null or m.expires_at>now()) and m.role in ('owner','admin','recruiter','hiring_manager')) then raise exception 'FORBIDDEN';end if;
 if p_from is null or p_until is null or p_until<=p_from or p_until-p_from>interval '366 days' then raise exception 'INVALID_INPUT';end if;
 with eligible_jobs as (select v.* from public.jobkix_vacancies v where v.organization_id=p_org and public.jobkix_can_act(p_org,'analytics.read',v.site_id,v.id)),
 applications as (select a.* from public.jobkix_applications a join eligible_jobs v on v.id=a.vacancy_id where a.submitted_at>=p_from and a.submitted_at<p_until),
 states as (select state,count(*) as n from applications group by state)
 select jsonb_build_object('from',p_from,'until',p_until,'asOf',now(),'activeVacancies',(select count(*) from eligible_jobs where public.jobkix_job_eligible(id)),
 'submissions',(select count(*) from applications),'currentApplicationStates',coalesce((select jsonb_object_agg(state,n) from states),'{}'),
 'interviewsProposed',(select count(*) from public.jobkix_interviews i join eligible_jobs v on v.id=(select vacancy_id from public.jobkix_applications where id=i.application_id) where i.created_at>=p_from and i.created_at<p_until),
 'offersSent',(select count(*) from public.jobkix_offers o join eligible_jobs v on v.id=(select vacancy_id from public.jobkix_applications where id=o.application_id) where o.sent_at>=p_from and o.sent_at<p_until),
 'acceptedOffers',(select count(*) from public.jobkix_offers o join eligible_jobs v on v.id=(select vacancy_id from public.jobkix_applications where id=o.application_id) where o.state='accepted' and o.responded_at>=p_from and o.responded_at<p_until)) into result;return result;
end $$;
revoke all on function public.jobkix_talent_page(uuid,jsonb,integer,uuid),public.jobkix_team_page(uuid,integer,boolean),public.jobkix_team_receipt(text,text),public.jobkix_talent_receipt(text,text),public.jobkix_hiring_analytics(uuid,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.jobkix_talent_page(uuid,jsonb,integer,uuid),public.jobkix_team_page(uuid,integer,boolean),public.jobkix_team_receipt(text,text),public.jobkix_talent_receipt(text,text),public.jobkix_hiring_analytics(uuid,timestamptz,timestamptz) to authenticated;
insert into public.jobkix_schema_versions(version) values(16);
commit;
