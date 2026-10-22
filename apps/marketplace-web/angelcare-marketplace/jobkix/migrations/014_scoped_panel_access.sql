begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=13) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
-- A panel assignment shares the submitted application only, never the live candidate profile or private vacancy draft.
create or replace function public.jobkix_application_visible(p_application uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(select 1 from public.jobkix_applications a join public.jobkix_vacancies v on v.id=a.vacancy_id
 join public.jobkix_accounts account on account.user_id=auth.uid() and account.status='active'
 join auth.users u on u.id=account.user_id and u.email_confirmed_at is not null
 where a.id=p_application and (a.candidate_user_id=auth.uid() or (
 a.state<>'withdrawn' and not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=a.candidate_user_id and b.organization_id=a.organization_id)
 and (public.jobkix_can_act(a.organization_id,'application.read',v.site_id,v.id) or (
 public.jobkix_can_act(a.organization_id,'evaluation.write',v.site_id,v.id) and exists(select 1 from public.jobkix_interviews i join public.jobkix_interview_panels panel on panel.interview_id=i.id
 where i.application_id=a.id and i.state in ('proposed','scheduled','completed') and panel.member_user_id=auth.uid() and panel.response<>'declined'))))))
$$;
create function public.jobkix_application_capabilities(p_application uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();a public.jobkix_applications;v public.jobkix_vacancies;begin
 if not public.jobkix_application_visible(p_application) then raise exception 'FORBIDDEN';end if;
 select * into a from public.jobkix_applications where id=p_application;select * into v from public.jobkix_vacancies where id=a.vacancy_id;
 return jsonb_build_object('decide',a.candidate_user_id<>actor and public.jobkix_can_act(a.organization_id,'application.decide',v.site_id,v.id),'message',a.candidate_user_id<>actor and public.jobkix_can_act(a.organization_id,'message.write',v.site_id,v.id),
 'interview',a.candidate_user_id<>actor and public.jobkix_can_act(a.organization_id,'interview.manage',v.site_id,v.id),'offer',a.candidate_user_id<>actor and public.jobkix_can_act(a.organization_id,'offer.write',v.site_id,v.id),
 'evaluate',a.candidate_user_id<>actor and public.jobkix_can_act(a.organization_id,'evaluation.write',v.site_id,v.id));
end $$;
revoke all on function public.jobkix_application_capabilities(uuid) from public,anon,authenticated;
grant execute on function public.jobkix_application_capabilities(uuid) to authenticated;
insert into public.jobkix_schema_versions(version) values(14);
commit;
