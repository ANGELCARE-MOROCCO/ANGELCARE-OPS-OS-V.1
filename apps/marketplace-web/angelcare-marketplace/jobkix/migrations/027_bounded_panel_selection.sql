begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=26) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;

-- One eligible-roster read, shared by the legacy projection and bounded picker.
-- Interview commands retain their independent current-authority recheck.
create function public.jobkix_panel_members(p_vacancy uuid) returns table(id uuid,label text,member_role text)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();v public.jobkix_vacancies;begin
 select * into v from public.jobkix_vacancies where public.jobkix_vacancies.id=p_vacancy;
 if not found or not public.jobkix_can_act(v.organization_id,'interview.manage',v.site_id,v.id) then raise exception 'FORBIDDEN';end if;
 return query select distinct on(m.user_id) m.user_id,coalesce(nullif(btrim(a.display_name),''),m.user_id::text),m.role
 from public.jobkix_memberships m join public.jobkix_accounts a on a.user_id=m.user_id and a.status='active'
 join auth.users u on u.id=m.user_id and u.email_confirmed_at is not null
 where m.organization_id=v.organization_id and m.active and (m.expires_at is null or m.expires_at>now())
 and m.role in ('owner','admin','recruiter','hiring_manager','interviewer')
 and (cardinality(m.site_ids)=0 or v.site_id=any(m.site_ids)) and (cardinality(m.vacancy_ids)=0 or v.id=any(m.vacancy_ids))
 order by m.user_id,m.created_at;
end $$;
create or replace function public.jobkix_panel_roster(p_vacancy uuid) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(jsonb_agg(jsonb_build_object('userId',id,'name',label,'role',member_role) order by label,id),'[]')
 from public.jobkix_panel_members(p_vacancy)
$$;

create function public.jobkix_panel_options(p_application uuid,p_page integer default 1,p_query text default '',p_selected uuid[] default '{}') returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();a public.jobkix_applications;v public.jobkix_vacancies;pattern text;result jsonb;begin
 if p_application is null or p_page is null or p_page<1 or p_page>10000 or p_query is null or length(p_query)>180 or p_query~'[[:cntrl:]]'
 or p_selected is null or cardinality(p_selected)>20 or array_position(p_selected,null) is not null
 or cardinality(p_selected)<>(select count(distinct x) from unnest(p_selected)x) then raise exception 'INVALID_INPUT';end if;
 select * into a from public.jobkix_applications where id=p_application;
 select * into v from public.jobkix_vacancies where id=a.vacancy_id;
 if a.id is null or a.candidate_user_id=actor or not public.jobkix_application_visible(a.id)
 or not public.jobkix_can_act(a.organization_id,'interview.manage',v.site_id,v.id) then raise exception 'FORBIDDEN';end if;
 pattern:='%'||replace(replace(replace(btrim(p_query),'\','\\'),'%','\%'),'_','\_')||'%';
 with eligible as materialized (
  select id,label from public.jobkix_panel_members(v.id) where id<>a.candidate_user_id
 ), matching as (
  select * from eligible where label ilike pattern
 ), page_rows as (
  select * from matching order by label,id limit 24 offset (p_page-1)*24
 ) select jsonb_build_object(
  'items',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'available',true) order by label,id),'[]') from page_rows),
  'selected',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'available',true) order by label,id),'[]') from eligible where id=any(p_selected)),
  'total',(select count(*) from matching),'page',p_page,'pageSize',24
 ) into result;
 return result;
end $$;
revoke all on function public.jobkix_panel_members(uuid),public.jobkix_panel_options(uuid,integer,text,uuid[]) from public,anon,authenticated;
grant execute on function public.jobkix_panel_options(uuid,integer,text,uuid[]) to authenticated;
insert into public.jobkix_schema_versions(version) values(27);
commit;
