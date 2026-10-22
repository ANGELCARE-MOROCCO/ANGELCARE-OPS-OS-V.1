begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=12) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_recruitment_receipt(p_action text,p_key text) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();receipt public.jobkix_command_receipts;a public.jobkix_applications;v public.jobkix_vacancies;app_id uuid;begin
 if p_action not in ('interview.propose','interview.reschedule','interview.cancel','interview.complete','offer.create','offer.save','offer.send','offer.withdraw') or length(coalesce(p_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 select * into receipt from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_key and action=p_action;if not found then return null;end if;
 if p_action like 'interview.%' then select application_id into app_id from public.jobkix_interviews where id=(receipt.result->>'id')::uuid;
 else select application_id into app_id from public.jobkix_offers where id=(receipt.result->>'id')::uuid;end if;
 select * into a from public.jobkix_applications where id=app_id;select * into v from public.jobkix_vacancies where id=a.vacancy_id;
 if a.id is null or a.candidate_user_id=actor or not public.jobkix_application_visible(a.id) or not public.jobkix_can_act(a.organization_id,case when p_action like 'interview.%' then 'interview.manage' else 'offer.write' end,v.site_id,v.id) then raise exception 'FORBIDDEN';end if;
 return receipt.result||jsonb_build_object('recordedAt',receipt.created_at);
end $$;
create function public.jobkix_panel_roster(p_vacancy uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();v public.jobkix_vacancies;begin
 select * into v from public.jobkix_vacancies where id=p_vacancy;if not found or not public.jobkix_can_act(v.organization_id,'interview.manage',v.site_id,v.id) then raise exception 'FORBIDDEN';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('userId',user_id,'name',display_name,'role',role) order by display_name,user_id),'[]') from (
 select distinct on(m.user_id) m.user_id,a.display_name,m.role from public.jobkix_memberships m join public.jobkix_accounts a on a.user_id=m.user_id and a.status='active' join auth.users u on u.id=m.user_id and u.email_confirmed_at is not null
 where m.organization_id=v.organization_id and m.active and (m.expires_at is null or m.expires_at>now()) and m.role in ('owner','admin','recruiter','hiring_manager','interviewer')
 and (cardinality(m.site_ids)=0 or v.site_id=any(m.site_ids)) and (cardinality(m.vacancy_ids)=0 or v.id=any(m.vacancy_ids)) order by m.user_id,m.created_at) eligible);
end $$;
revoke all on function public.jobkix_recruitment_receipt(text,text),public.jobkix_panel_roster(uuid) from public,anon,authenticated;
grant execute on function public.jobkix_recruitment_receipt(text,text),public.jobkix_panel_roster(uuid) to authenticated;
insert into public.jobkix_schema_versions(version) values(13);
commit;
