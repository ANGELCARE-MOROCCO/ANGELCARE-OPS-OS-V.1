-- JOBKIX §§22–27: bounded, deduplicated operations. This file never schedules itself.
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=21) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
-- The public endpoint and saved-search alerts share these exact eligibility/filter predicates.
create function public.jobkix_matching_vacancies(p_filters jsonb) returns table(id uuid,published_at timestamptz,relevance real)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare q text:=coalesce(p_filters->>'q',''); origin text:=nullif(p_filters->>'origin',''); destination text:=nullif(p_filters->>'destination','');
 reach text:=coalesce(p_filters->>'reach','worldwide'); pg integer:=coalesce((p_filters->>'page')::integer,1);
 page_size integer:=coalesce((p_filters->>'pageSize')::integer,12);
begin
 if p_filters is null or jsonb_typeof(p_filters)<>'object' or octet_length(p_filters::text)>8000 or length(q)>300 or pg is null or pg<1 or pg>10000 or page_size is null or page_size<1 or page_size>48
 or reach not in ('domestic','abroad','worldwide') or (origin is not null and origin!~'^[A-Z]{2}$') or (destination is not null and destination!~'^[A-Z]{2}$') then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from jsonb_each(p_filters) f where f.key not in ('q','origin','destination','reach','city','setting','occupation','organizationId','workSchedule','contractType','workLocation','language','ageCohort','sponsorship','relocation','salaryMinimum','currency','salaryUnit','sort','page','pageSize') or jsonb_typeof(f.value) not in ('string','number'))
 or (p_filters?'sort' and p_filters->>'sort' not in ('newest','relevance'))
 or (p_filters?'salaryMinimum' and ((p_filters->>'salaryMinimum')!~'^[0-9]{1,10}(\.[0-9]{1,2})?$' or (p_filters->>'salaryMinimum')::numeric>1000000000 or coalesce(p_filters->>'currency','')!~'^[A-Z]{3}$' or coalesce(p_filters->>'salaryUnit','') not in ('hour','day','week','month','year'))) then raise exception 'INVALID_INPUT';end if;
 if (nullif(p_filters->>'setting','') is not null and not exists(select 1 from public.jobkix_taxonomy where kind='setting' and key=p_filters->>'setting' and status='published'))
 or (nullif(p_filters->>'occupation','') is not null and not exists(select 1 from public.jobkix_taxonomy where kind='occupation' and key=p_filters->>'occupation' and status='published')) then raise exception 'INVALID_INPUT';end if;
 return query with matched_professions as (
 select distinct t.key from public.jobkix_taxonomy t,
 lateral unnest(array[t.key,t.source_name_en]||t.synonyms||array(select value from jsonb_each_text(t.localized_names))) term
 where t.kind='occupation' and t.status='published' and q<>'' and public.jobkix_term_matches(term,q)
 ), matches as (
 select v.id,v.published_at,case when q='' then 0 else ts_rank(to_tsvector('simple',v.title||' '||v.description||' '||v.occupation_id),plainto_tsquery('simple',q)) end relevance
 from public.jobkix_vacancies v
 where public.jobkix_job_eligible(v.id)
 and (q='' or to_tsvector('simple',v.title||' '||v.description||' '||v.occupation_id)@@plainto_tsquery('simple',q) or position(lower(q) in lower(v.title))>0 or v.occupation_id in (select key from matched_professions))
 and (reach='domestic' or destination is null or v.country=destination)
 and (reach<>'domestic' or (origin is not null and v.country=origin))
 and (reach<>'abroad' or (origin is not null and v.country<>origin and v.overseas_applicants='yes'))
 and (nullif(p_filters->>'city','') is null or position(lower(p_filters->>'city') in lower(v.city))>0)
 and (nullif(p_filters->>'setting','') is null or v.setting_id=p_filters->>'setting')
 and (nullif(p_filters->>'occupation','') is null or v.occupation_id=p_filters->>'occupation')
 and (nullif(p_filters->>'organizationId','') is null or v.organization_id::text=p_filters->>'organizationId')
 and (nullif(p_filters->>'workSchedule','') is null or v.work_schedule=p_filters->>'workSchedule')
 and (nullif(p_filters->>'contractType','') is null or v.contract_type=p_filters->>'contractType')
 and (nullif(p_filters->>'workLocation','') is null or v.work_location=p_filters->>'workLocation')
 and (nullif(p_filters->>'language','') is null or (p_filters->>'language')=any(v.languages))
 and (nullif(p_filters->>'ageCohort','') is null or (p_filters->>'ageCohort')=any(v.age_cohorts))
 and (nullif(p_filters->>'sponsorship','') is null or v.sponsorship=p_filters->>'sponsorship')
 and (nullif(p_filters->>'relocation','') is null or v.relocation=p_filters->>'relocation')
 and (nullif(p_filters->>'salaryMinimum','') is null or (v.currency=p_filters->>'currency' and v.compensation_unit=p_filters->>'salaryUnit' and v.compensation_min>=(p_filters->>'salaryMinimum')::numeric))
 ) select m.id,m.published_at,m.relevance::real from matches m;
end $$;
create or replace function public.jobkix_search(p_filters jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare pg integer:=coalesce((p_filters->>'page')::integer,1);page_size integer:=coalesce((p_filters->>'pageSize')::integer,12);result jsonb;begin
 if pg not between 1 and 10000 or page_size not between 1 and 48 then raise exception 'INVALID_INPUT';end if;
 with matches as materialized(select * from public.jobkix_matching_vacancies(p_filters)),paged as (
 select * from matches order by case when p_filters->>'sort'='relevance' then relevance end desc nulls last,published_at desc,id offset (pg-1)*page_size limit page_size)
 select jsonb_build_object('items',coalesce((select jsonb_agg(public.jobkix_public_vacancy(id) order by case when p_filters->>'sort'='relevance' then relevance end desc nulls last,published_at desc,id) from paged),'[]'),
 'total',(select count(*) from matches),'page',pg,'pageSize',page_size) into result;return result;
end $$;
revoke all on function public.jobkix_matching_vacancies(jsonb) from public,anon,authenticated;

alter table public.jobkix_saved_searches add column retry_after timestamptz;
alter table public.jobkix_saved_searches add column last_error_code text;
alter table public.jobkix_outbox add column version integer not null default 1 check(version>0);
alter table public.jobkix_outbox add column attempt_limit integer not null default 8 check(attempt_limit between 8 and 1000000);
create function public.jobkix_delivery_version() returns trigger language plpgsql set search_path=pg_catalog as $$ begin new.version:=old.version+1;return new;end $$;
create trigger jobkix_delivery_version before update on public.jobkix_outbox for each row execute function public.jobkix_delivery_version();
create table public.jobkix_search_matches(
 search_id uuid not null references public.jobkix_saved_searches(id) on delete cascade,search_version integer not null,
 vacancy_id uuid not null references public.jobkix_vacancies(id),published_version integer not null,created_at timestamptz not null default now(),
 event_id uuid references public.jobkix_events(id),primary key(search_id,search_version,vacancy_id,published_version)
);
create table public.jobkix_scheduled_effects(
 effect_key text primary key check(length(effect_key) between 1 and 240),event_id uuid references public.jobkix_events(id),created_at timestamptz not null default now()
);
alter table public.jobkix_search_matches enable row level security;
alter table public.jobkix_scheduled_effects enable row level security;
revoke all on public.jobkix_search_matches,public.jobkix_scheduled_effects from public,anon,authenticated;

create function public.jobkix_process_search_alerts() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare saved public.jobkix_saved_searches;match record;event uuid;ids uuid[];count_searches integer:=0;count_matches integer:=0;has_more boolean;
begin
 for saved in select s.* from public.jobkix_saved_searches s join public.jobkix_accounts a on a.user_id=s.user_id and a.status='active'
 join auth.users u on u.id=s.user_id and u.email_confirmed_at is not null
 where s.enabled and s.frequency in ('daily','weekly') and coalesce(s.retry_after,'-infinity')<=now()
 and (s.last_run_at is null or s.last_run_at<=now()-case s.frequency when 'daily' then interval '1 day' else interval '7 days' end)
 order by s.last_run_at nulls first,s.created_at,s.id for update of s skip locked limit 20 loop
  count_searches:=count_searches+1;ids:='{}';
  begin
   -- Twenty matches per search per transaction; no offset can skip a match during interruption.
   for match in select m.id,v.published_version from public.jobkix_matching_vacancies(saved.filters) m join public.jobkix_vacancies v on v.id=m.id
    where not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=saved.user_id and b.organization_id=v.organization_id)
    and not exists(select 1 from public.jobkix_search_matches seen where seen.search_id=saved.id and seen.search_version=saved.version and seen.vacancy_id=v.id and seen.published_version=v.published_version)
    order by m.published_at desc,m.id limit 20 loop
    insert into public.jobkix_search_matches(search_id,search_version,vacancy_id,published_version) values(saved.id,saved.version,match.id,match.published_version) on conflict do nothing;
    if found then ids:=array_append(ids,match.id);end if;
   end loop;
   if cardinality(ids)>0 then
    event:=public.jobkix_emit('search.match',saved.id,null,array[saved.user_id],jsonb_build_object('savedSearchId',saved.id,'searchVersion',saved.version,'vacancyIds',to_jsonb(ids)));
    update public.jobkix_search_matches set event_id=event where search_id=saved.id and search_version=saved.version and vacancy_id=any(ids) and event_id is null;
    count_matches:=count_matches+cardinality(ids);
   end if;
   select exists(select 1 from public.jobkix_matching_vacancies(saved.filters) m join public.jobkix_vacancies v on v.id=m.id
    where not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=saved.user_id and b.organization_id=v.organization_id)
    and not exists(select 1 from public.jobkix_search_matches seen where seen.search_id=saved.id and seen.search_version=saved.version and seen.vacancy_id=v.id and seen.published_version=v.published_version)) into has_more;
   update public.jobkix_saved_searches set last_run_at=case when has_more then last_run_at else now() end,retry_after=null,last_error_code=null where id=saved.id;
  exception when sqlstate 'P0001' or invalid_text_representation or numeric_value_out_of_range then
   -- Preserve the authored filters and previous results. An archived taxonomy may require correction.
   update public.jobkix_saved_searches set retry_after=now()+interval '1 day',last_error_code='SAVED_FILTER_UNAVAILABLE' where id=saved.id;
  end;
 end loop;
 return jsonb_build_object('searches',count_searches,'matches',count_matches);
end $$;

create function public.jobkix_process_interview_reminders() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare app public.jobkix_applications;meeting public.jobkix_interviews;event uuid;effect text;reminder_window text;recipients uuid[];count_effects integer:=0;
begin
 -- Recruitment commands lock the application before its children. Workers use the same order.
 for app in select a.* from public.jobkix_applications a where a.state in ('submitted','acknowledged','under_review','shortlisted','interview','offer','on_hold')
 and exists(select 1 from public.jobkix_interviews i where i.application_id=a.id and i.state in ('proposed','scheduled') and i.candidate_response in ('pending','accepted') and i.starts_at>now() and i.starts_at<=now()+interval '24 hours'
 and not exists(select 1 from public.jobkix_scheduled_effects e where e.effect_key='interview:'||i.id||':'||i.version||':'||case when i.starts_at<=now()+interval '1 hour' then '1h' else '24h' end))
 order by a.id for update of a skip locked limit 50 loop
  for meeting in select * from public.jobkix_interviews i where i.application_id=app.id and i.state in ('proposed','scheduled') and i.candidate_response in ('pending','accepted')
   and i.starts_at>now() and i.starts_at<=now()+interval '24 hours' order by i.id for update loop
   reminder_window:=case when meeting.starts_at<=now()+interval '1 hour' then '1h' else '24h' end;effect:='interview:'||meeting.id||':'||meeting.version||':'||reminder_window;
   insert into public.jobkix_scheduled_effects(effect_key) values(effect) on conflict do nothing;if not found then continue;end if;
   recipients:=array[meeting.candidate_user_id]||array(select member_user_id from public.jobkix_interview_panels where interview_id=meeting.id and response<>'declined');
   event:=public.jobkix_emit('interview.reminder',meeting.id,null,recipients,jsonb_build_object('applicationId',app.id,'interviewId',meeting.id,'version',meeting.version,'window',reminder_window));
   update public.jobkix_scheduled_effects set event_id=event where effect_key=effect;count_effects:=count_effects+1;
  end loop;
 end loop;return jsonb_build_object('reminders',count_effects);
end $$;

create function public.jobkix_process_expiries() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare app public.jobkix_applications;offer public.jobkix_offers;vac public.jobkix_vacancies;count_offers integer:=0;count_vacancies integer:=0;
begin
 for app in select a.* from public.jobkix_applications a where exists(select 1 from public.jobkix_offers o where o.application_id=a.id and o.state='sent' and o.response_deadline<=now())
 order by a.id for update of a skip locked limit 50 loop
  for offer in select * from public.jobkix_offers o where o.application_id=app.id and o.state='sent' and o.response_deadline<=now() order by o.id for update loop
   update public.jobkix_offers set state='expired',version=version+1,updated_at=now() where id=offer.id returning * into offer;
   perform public.jobkix_emit('offer.expired',offer.id,null,array[app.candidate_user_id]||public.jobkix_recruiters(app.vacancy_id),jsonb_build_object('applicationId',app.id,'offerId',offer.id,'version',offer.version));count_offers:=count_offers+1;
  end loop;
 end loop;
 for vac in select * from public.jobkix_vacancies where state='published' and expires_at<=now() order by id for update skip locked limit 50 loop
  update public.jobkix_vacancies set state='expired',version=version+1,updated_at=now() where id=vac.id returning * into vac;
  insert into public.jobkix_vacancy_revisions(vacancy_id,version,snapshot,edited_by) values(vac.id,vac.version,to_jsonb(vac),vac.created_by);
  perform public.jobkix_emit('vacancy.expired',vac.id,null,'{}',jsonb_build_object('vacancyId',vac.id,'version',vac.version));count_vacancies:=count_vacancies+1;
 end loop;
 -- Query-time guards are effective even when this bounded cleanup is delayed.
 return jsonb_build_object('offers',count_offers,'vacancies',count_vacancies);
end $$;

create function public.jobkix_operations_read(p_actor uuid,p_purpose text,p_page integer default 1,p_state text default '') returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if p_actor is null or length(trim(p_purpose)) not between 20 and 1000 or p_page is null or p_page not between 1 and 10000 or p_state not in ('','pending','processing','provider_accepted','failed','delivery_unknown','cancelled') then raise exception 'INVALID_INPUT';end if;
 with matches as (select * from public.jobkix_outbox where channel='email' and (p_state='' or state=p_state)),paged as (select * from matches order by created_at desc,id offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'type',template_key,'state',state,'attempts',attempts,'attemptLimit',attempt_limit,'version',version,'errorCode',last_error_code,'createdAt',created_at,'availableAt',available_at,'leaseExpiresAt',locked_until) order by created_at desc,id) from paged),'[]'),
 'total',(select count(*) from matches),'page',p_page,'pageSize',24,'counts',(select coalesce(jsonb_object_agg(state,n),'{}') from (select state,count(*) n from public.jobkix_outbox where channel='email' group by state)s),
 'savedFilterFailures',(select count(*) from public.jobkix_saved_searches where last_error_code is not null),
 'expiredPublishedVacancies',(select count(*) from public.jobkix_vacancies where state='published' and expires_at<=now())) into result;
 insert into public.jobkix_events(type,object_id,admin_actor_id,detail) values('admin.read',gen_random_uuid(),p_actor,jsonb_build_object('collection','health','purpose',p_purpose,'page',p_page,'state',p_state));return result;
end $$;
create function public.jobkix_delivery_recovery(p_id uuid,p_version integer,p_action text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare job public.jobkix_outbox;begin
 select * into job from public.jobkix_outbox where id=p_id and channel='email' for update;if not found then raise exception 'NOT_FOUND';end if;perform public.jobkix_version(job.version,p_version);
 if p_action='delivery.retry' then
  if job.state<>'failed' or job.last_error_code not in ('SMTP_AUTH_535','SMTP_TRANSIENT','TRANSPORT_CONFIGURATION','AUTH_EMAIL_CONFIGURATION','SMTP_RECIPIENT_REJECTED') then raise exception 'INVALID_TRANSITION';end if;
  if public.jobkix_notification_context(job,true) is null then raise exception 'FORBIDDEN';end if;
  update public.jobkix_outbox set state='pending',available_at=now(),last_error_code=null,attempt_limit=least(1000000,greatest(attempt_limit,attempts+8)) where id=job.id returning * into job;
 elsif p_action='delivery.cancel' then
  if job.state not in ('pending','failed','delivery_unknown') then raise exception 'INVALID_TRANSITION';end if;
  update public.jobkix_outbox set state='cancelled',last_error_code='OPERATOR_CANCELLED' where id=job.id returning * into job;
 else raise exception 'INVALID_INPUT';end if;
 -- An uncertain acknowledgement can only be cancelled here; no unsafe resend action exists.
 return jsonb_build_object('id',job.id,'state',job.state,'version',job.version,'attempts',job.attempts);
end $$;

revoke all on function public.jobkix_process_search_alerts(),public.jobkix_process_interview_reminders(),public.jobkix_process_expiries(),public.jobkix_operations_read(uuid,text,integer,text),public.jobkix_delivery_recovery(uuid,integer,text),public.jobkix_delivery_version() from public,anon,authenticated;
grant execute on function public.jobkix_process_search_alerts(),public.jobkix_process_interview_reminders(),public.jobkix_process_expiries(),public.jobkix_operations_read(uuid,text,integer,text) to service_role;
insert into public.jobkix_schema_versions(version) values(22);
commit;
