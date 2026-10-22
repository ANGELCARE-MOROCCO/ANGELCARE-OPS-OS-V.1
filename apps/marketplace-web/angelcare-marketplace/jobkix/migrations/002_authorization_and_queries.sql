-- Apply after 001, in the designated database only. No production execution by source tooling.
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=1) then raise exception 'JOBKIX_MIGRATION_ORDER'; end if; end $$;

create function public.jobkix_actor(p_require_account boolean default true) returns uuid
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare a uuid:=auth.uid(); begin
  if a is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not exists(select 1 from auth.users where id=a and email_confirmed_at is not null) then raise exception 'EMAIL_UNCONFIRMED'; end if;
  if exists(select 1 from public.jobkix_accounts where user_id=a and status<>'active') then raise exception 'ACCOUNT_RESTRICTED'; end if;
  if p_require_account and not exists(select 1 from public.jobkix_accounts where user_id=a) then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  return a;
end $$;

create function public.jobkix_can_act(p_org uuid,p_capability text,p_site uuid default null,p_vacancy uuid default null) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(
 select 1 from public.jobkix_memberships m
 join public.jobkix_accounts a on a.user_id=m.user_id and a.status='active'
 join auth.users u on u.id=m.user_id and u.email_confirmed_at is not null
 join public.jobkix_organizations o on o.id=m.organization_id and o.status='active'
 where m.user_id=auth.uid() and m.organization_id=p_org and m.active and (m.expires_at is null or m.expires_at>now())
 and (cardinality(m.site_ids)=0 or p_site=any(m.site_ids))
 and (cardinality(m.vacancy_ids)=0 or p_vacancy=any(m.vacancy_ids))
 and case
   when p_capability in ('organization.manage','team.manage') then m.role in ('owner','admin')
   when p_capability in ('vacancy.write','vacancy.publish','talent.search') then m.role in ('owner','admin','recruiter')
   when p_capability in ('application.read','application.decide','interview.manage','offer.write','message.write','analytics.read') then m.role in ('owner','admin','recruiter','hiring_manager')
   when p_capability='evaluation.write' then m.role in ('owner','admin','recruiter','hiring_manager','interviewer')
   else false end
)
$$;

create function public.jobkix_job_eligible(p_vacancy uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(select 1 from public.jobkix_vacancies v join public.jobkix_organizations o on o.id=v.organization_id
 where v.id=p_vacancy and v.state='published' and v.published_at<=now() and v.expires_at>now()
 and v.public_snapshot is not null and v.published_version=v.version
 and o.status='active' and o.identity_reviewed_until>now() and o.public_profile_approved_at is not null
 and (v.site_id is null or exists(select 1 from public.jobkix_sites site where site.id=v.site_id and site.organization_id=v.organization_id and site.active)))
$$;

create function public.jobkix_application_visible(p_application uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(select 1 from public.jobkix_applications a join public.jobkix_vacancies v on v.id=a.vacancy_id
 join public.jobkix_accounts account on account.user_id=auth.uid() and account.status='active'
 join auth.users u on u.id=account.user_id and u.email_confirmed_at is not null
 where a.id=p_application and (a.candidate_user_id=auth.uid() or (
 a.state<>'withdrawn' and not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=a.candidate_user_id and b.organization_id=a.organization_id)
 and public.jobkix_can_act(a.organization_id,'application.read',v.site_id,v.id))))
$$;

create function public.jobkix_interview_visible(p_interview uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(select 1 from public.jobkix_interviews i join public.jobkix_applications a on a.id=i.application_id
 join public.jobkix_vacancies v on v.id=a.vacancy_id
 where i.id=p_interview and (public.jobkix_application_visible(a.id) or (
 public.jobkix_can_act(i.organization_id,'evaluation.write',v.site_id,v.id)
 and exists(select 1 from public.jobkix_interview_panels p where p.interview_id=i.id and p.member_user_id=auth.uid())
 and not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=i.candidate_user_id and b.organization_id=i.organization_id))))
$$;

create function public.jobkix_file_visible(p_file uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(select 1 from public.jobkix_files f join public.jobkix_accounts account on account.user_id=auth.uid() and account.status='active'
 join auth.users u on u.id=account.user_id and u.email_confirmed_at is not null
 where f.id=p_file and f.state='ready' and (f.owner_user_id=auth.uid() or exists(
 select 1 from public.jobkix_applications a where a.file_id=f.id and a.state<>'withdrawn'
 and (a.snapshot->'file'->>'revision')::integer=f.revision and public.jobkix_application_visible(a.id))
 or exists(select 1 from public.jobkix_messages m join public.jobkix_threads t on t.id=m.thread_id
 where m.attachment_id=f.id and public.jobkix_application_visible(t.application_id))))
$$;

create function public.jobkix_candidate_discoverable(p_candidate uuid,p_org uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
select exists(select 1 from public.jobkix_candidates c join public.jobkix_accounts a on a.user_id=c.user_id and a.status='active'
 join public.jobkix_organizations o on o.id=p_org and o.status='active' and o.identity_reviewed_until>now()
 where c.user_id=p_candidate and c.discoverable and c.discoverability_consented_at is not null
 and public.jobkix_can_act(p_org,'talent.search')
 and not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=c.user_id and b.organization_id=p_org))
$$;

create function public.jobkix_talent_search(p_org uuid,p_query text default '') returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$ begin
 if not public.jobkix_can_act(p_org,'talent.search') then raise exception 'FORBIDDEN'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'userId',c.user_id,'displayName',c.display_name,'headline',c.headline,'summary',c.summary,'country',c.country,'skills',c.skills,'occupations',c.occupations,'languages',c.languages)),'[]')
 from (select * from public.jobkix_candidates candidate where public.jobkix_candidate_discoverable(candidate.user_id,p_org)
 and (candidate.headline||' '||candidate.summary) ilike '%'||left(p_query,240)||'%' order by candidate.updated_at desc,candidate.id limit 50) c);
end $$;

-- No public table contains an exact household address, private contact, evaluation or credential.
create function public.jobkix_pay(p_pay jsonb) returns jsonb
language plpgsql immutable set search_path=pg_catalog as $$
declare lo numeric;hi numeric;begin
 if p_pay is null or p_pay='null'::jsonb then return null;end if;
 if jsonb_typeof(p_pay)<>'object' then raise exception 'INVALID_INPUT';end if;
 if exists(select 1 from jsonb_object_keys(p_pay) k where k not in ('minimum','maximum','currency','unit'))
 or coalesce(p_pay->>'currency','') not in ('AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY','COP','CRC','CUC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SLL','SOS','SRD','SSP','STN','SVC','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XCG','XDR','XOF','XPF','XSU','YER','ZAR','ZMW','ZWG','ZWL') or coalesce(p_pay->>'unit','') not in ('hour','day','week','month','year') then raise exception 'INVALID_INPUT';end if;
 if (p_pay?'minimum' and jsonb_typeof(p_pay->'minimum') not in ('number','null')) or (p_pay?'maximum' and jsonb_typeof(p_pay->'maximum') not in ('number','null')) then raise exception 'INVALID_INPUT';end if;
 lo:=(p_pay->>'minimum')::numeric;hi:=(p_pay->>'maximum')::numeric;
 if lo is null and hi is null or lo is not null and (lo<0 or lo>1000000000) or hi is not null and (hi<0 or hi>1000000000) or lo is not null and hi is not null and hi<lo then raise exception 'INVALID_INPUT';end if;
 return jsonb_build_object('minimum',lo,'maximum',hi,'currency',p_pay->>'currency','unit',p_pay->>'unit');
end $$;
revoke all on function public.jobkix_pay(jsonb) from public,anon,authenticated;

create function public.jobkix_profile_entries(p_entries jsonb) returns jsonb
language plpgsql immutable set search_path=pg_catalog as $$
declare entry jsonb;result jsonb:='[]';entry_id uuid;seen uuid[]:='{}';starts text;ends text;begin
 if p_entries is null or jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries)>40 then raise exception 'INVALID_INPUT';end if;
 for entry in select value from jsonb_array_elements(p_entries) loop
  if jsonb_typeof(entry)<>'object' then raise exception 'INVALID_INPUT';end if;
  if exists(select 1 from jsonb_object_keys(entry) key where key not in ('id','title','organization','start','end','description'))
   or coalesce(jsonb_typeof(entry->'id'),'null')<>'string' or coalesce(jsonb_typeof(entry->'title'),'null')<>'string' or coalesce(jsonb_typeof(entry->'organization'),'null')<>'string' or coalesce(jsonb_typeof(entry->'start'),'null')<>'string'
   or coalesce(length(trim(entry->>'title')),0) not between 1 and 240 or coalesce(length(trim(entry->>'organization')),0) not between 1 and 240 or length(coalesce(entry->>'description',''))>4000 then raise exception 'INVALID_INPUT';end if;
  entry_id:=(entry->>'id')::uuid;if entry_id=any(seen) then raise exception 'INVALID_INPUT';end if;seen:=array_append(seen,entry_id);
  starts:=entry->>'start';ends:=coalesce(entry->>'end','');
  if starts!~'^[0-9]{4}-(0[1-9]|1[0-2])$' or (ends<>'' and (ends!~'^[0-9]{4}-(0[1-9]|1[0-2])$' or ends<starts)) then raise exception 'INVALID_INPUT';end if;
  result:=result||jsonb_build_array(jsonb_build_object('id',entry_id,'title',trim(entry->>'title'),'organization',trim(entry->>'organization'),'start',starts,'end',ends,'description',trim(coalesce(entry->>'description',''))));
 end loop;return result;
end $$;
revoke all on function public.jobkix_profile_entries(jsonb) from public,anon,authenticated;

create function public.jobkix_vacancy_projection(p_vacancy uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare v public.jobkix_vacancies;o public.jobkix_organizations;begin
 select * into v from public.jobkix_vacancies where id=p_vacancy;if not found then return null;end if;
 select * into o from public.jobkix_organizations where id=v.organization_id;
 return jsonb_build_object(
   'id',v.id,'version',v.version,'state','published',
   'title',v.title,'organizationId',o.id,'employerName',o.public_name,'employerKind',o.kind,
   'country',v.country,'region',v.region,'city',v.city,'settingId',v.setting_id,'occupationId',v.occupation_id,
   'originalLocale',v.original_locale,'description',v.description,'duties',to_jsonb(v.duties),'requirements',to_jsonb(v.requirements),'benefits',to_jsonb(v.benefits),
   'workSchedule',v.work_schedule,'contractType',v.contract_type,'workLocation',v.work_location,'liveIn',v.live_in,'hoursPerWeek',v.hours_per_week,
   'languages',to_jsonb(v.languages),'ageCohorts',to_jsonb(v.age_cohorts),
   'compensation',case when v.compensation_min is null and v.compensation_max is null then null else jsonb_build_object('minimum',v.compensation_min,'maximum',v.compensation_max,'currency',v.currency,'unit',v.compensation_unit) end,
   'overseasApplicants',v.overseas_applicants,'sponsorship',v.sponsorship,'relocation',v.relocation,'requiredDocument',v.required_document,
   'questions',(select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'label',q.label,'kind',q.kind,'required',q.required,'maxLength',q.max_length) order by position),'[]') from public.jobkix_screening_questions q where q.vacancy_id=v.id),
   'publishedAt',v.published_at,'expiresAt',v.expires_at,'updatedAt',v.updated_at,
   'identityReview',case when o.identity_reviewed_until>now() then jsonb_build_object('scope','organization_identity','validUntil',o.identity_reviewed_until,'reference',o.identity_review_reference) else null end
 );
end $$;

create function public.jobkix_public_vacancy(p_vacancy uuid,p_allow_closed boolean default false) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare v public.jobkix_vacancies;o public.jobkix_organizations;eligible boolean;begin
 select * into v from public.jobkix_vacancies where id=p_vacancy;
 if not found or v.public_snapshot is null or v.published_version is null then return null;end if;
 select * into o from public.jobkix_organizations where id=v.organization_id;
 if v.state='suspended' or o.status<>'active' or o.public_profile_approved_at is null then
  if p_allow_closed then return jsonb_build_object('id',v.id,'state','unavailable');end if;return null;
 end if;
 eligible:=public.jobkix_job_eligible(v.id);if not eligible and not p_allow_closed then return null;end if;
 -- Never reconstruct public history from a mutable private draft or its screening questions.
 return v.public_snapshot||jsonb_build_object('id',v.id,'version',v.published_version,'state',case when eligible then 'published' else 'closed' end,'organizationId',o.id,'employerName',o.public_name,'employerKind',o.kind,
 'identityReview',case when o.identity_reviewed_until>now() then jsonb_build_object('scope','organization_identity','validUntil',o.identity_reviewed_until,'reference',o.identity_review_reference) else null end);
end $$;

create function public.jobkix_term_matches(p_term text,p_query text) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
declare a text:=lower(trim(p_term));b text:=lower(trim(p_query));i integer:=1;j integer:=1;edits integer:=0;la integer:=length(a);lb integer:=length(b);
begin
 if a=b then return true;end if;
 if least(la,lb)<4 or greatest(la,lb)>100 or abs(la-lb)>1 then return false;end if;
 while i<=la and j<=lb loop
  if substr(a,i,1)=substr(b,j,1) then i:=i+1;j:=j+1;
  else
   edits:=edits+1;if edits>1 then return false;end if;
   if la=lb and i<la and j<lb and substr(a,i,1)=substr(b,j+1,1) and substr(a,i+1,1)=substr(b,j,1) then i:=i+2;j:=j+2;
   elsif la>lb then i:=i+1;elsif lb>la then j:=j+1;else i:=i+1;j:=j+1;end if;
  end if;
 end loop;
 return edits+(la-i+1)+(lb-j+1)<=1;
end $$;
revoke all on function public.jobkix_term_matches(text,text) from public;

create function public.jobkix_search(p_filters jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare q text:=coalesce(p_filters->>'q',''); origin text:=nullif(p_filters->>'origin',''); destination text:=nullif(p_filters->>'destination','');
 reach text:=coalesce(p_filters->>'reach','worldwide'); pg integer:=coalesce((p_filters->>'page')::integer,1);
 page_size integer:=coalesce((p_filters->>'pageSize')::integer,12); result jsonb;
begin
 if p_filters is null or jsonb_typeof(p_filters)<>'object' or octet_length(p_filters::text)>8000 or length(q)>300 or pg is null or pg<1 or pg>10000 or page_size is null or page_size<1 or page_size>48
 or reach not in ('domestic','abroad','worldwide') or (origin is not null and origin!~'^[A-Z]{2}$') or (destination is not null and destination!~'^[A-Z]{2}$') then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from jsonb_each(p_filters) f where f.key not in ('q','origin','destination','reach','city','setting','occupation','organizationId','workSchedule','contractType','workLocation','language','ageCohort','sponsorship','relocation','salaryMinimum','currency','salaryUnit','sort','page','pageSize') or jsonb_typeof(f.value) not in ('string','number'))
 or (p_filters?'sort' and p_filters->>'sort' not in ('newest','relevance'))
 or (p_filters?'salaryMinimum' and ((p_filters->>'salaryMinimum')!~'^[0-9]{1,10}(\.[0-9]{1,2})?$' or (p_filters->>'salaryMinimum')::numeric>1000000000 or coalesce(p_filters->>'currency','')!~'^[A-Z]{3}$' or coalesce(p_filters->>'salaryUnit','') not in ('hour','day','week','month','year'))) then raise exception 'INVALID_INPUT';end if;
 if (nullif(p_filters->>'setting','') is not null and not exists(select 1 from public.jobkix_taxonomy where kind='setting' and key=p_filters->>'setting' and status='published'))
 or (nullif(p_filters->>'occupation','') is not null and not exists(select 1 from public.jobkix_taxonomy where kind='occupation' and key=p_filters->>'occupation' and status='published')) then raise exception 'INVALID_INPUT';end if;
 with matched_professions as (
 select distinct t.key from public.jobkix_taxonomy t,
 lateral unnest(array[t.key,t.source_name_en]||t.synonyms||array(select value from jsonb_each_text(t.localized_names))) term
 where t.kind='occupation' and t.status='published' and q<>'' and public.jobkix_term_matches(term,q)
 ), matches as (
 select v.*,case when q='' then 0 else ts_rank(to_tsvector('simple',v.title||' '||v.description||' '||v.occupation_id),plainto_tsquery('simple',q)) end relevance
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
 ), paged as (
 select * from matches order by case when p_filters->>'sort'='relevance' then relevance end desc nulls last,published_at desc,id
 offset (pg-1)*page_size limit page_size
 ) select jsonb_build_object('items',coalesce((select jsonb_agg(public.jobkix_public_vacancy(id) order by case when p_filters->>'sort'='relevance' then relevance end desc nulls last,published_at desc,id) from paged),'[]'),
 'total',(select count(*) from matches),'page',pg,'pageSize',page_size) into result;
 return result;
end $$;

create function public.jobkix_public_employers(p_country text default null,p_query text default '',p_page integer default 1) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
select jsonb_build_object('items',coalesce(jsonb_agg(jsonb_build_object('id',o.id,'name',o.public_name,'kind',o.kind,'country',o.country,'city',o.city,'description',o.public_description,'media',o.public_media,
 'identityReview',case when o.identity_reviewed_until>now() then jsonb_build_object('scope','organization_identity','validUntil',o.identity_reviewed_until) else null end,
 'liveVacancies',(select count(*) from public.jobkix_vacancies v where v.organization_id=o.id and public.jobkix_job_eligible(v.id)))),'[]'))
from (select * from public.jobkix_organizations where status='active' and public_profile_approved_at is not null and (p_country is null or country=p_country)
and public_name ilike '%'||left(p_query,180)||'%' order by public_name,id offset greatest(0,least(p_page,10000)-1)*24 limit 24) o
$$;

create function public.jobkix_public_editorial(p_slug text,p_locale text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
select jsonb_build_object('id',d.id,'slug',d.slug,'kind',d.kind,'locale',e.locale,'title',e.title,'summary',e.summary,'sections',e.sections,
 'sourceRevision',e.source_revision,'translationRevision',e.version,'sourceHash',e.source_hash,'provenance',e.translator_provenance,'author',e.author_name,'reviewed',e.reviewed_by is not null,'publishedAt',e.published_at,
 'availableLocales',(select coalesce(jsonb_agg(available.locale),'[]') from public.jobkix_editorial_editions available where available.document_id=d.id and available.status='published' and available.reviewed_by is not null and available.reviewed_hash=available.content_hash and available.source_hash=d.source_hash and available.source_revision=d.source_revision))
from public.jobkix_editorial_documents d join public.jobkix_editorial_editions e on e.document_id=d.id
where d.slug=p_slug and e.locale=p_locale and e.status='published' and e.reviewed_by is not null and e.source_hash=d.source_hash and e.source_revision=d.source_revision and e.reviewed_hash=e.content_hash
$$;

-- Direct authenticated reads use row policies. Mutations are allowed only through guarded commands.
create function public.jobkix_account_terms(p_locale text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
with documents as (
 select public.jobkix_public_editorial('account-terms',p_locale) terms,public.jobkix_public_editorial('privacy',p_locale) privacy
) select case when terms is null or privacy is null or terms->>'kind'<>'legal' or privacy->>'kind'<>'legal' then null
else jsonb_build_object('terms',terms,'privacy',privacy,'revision',encode(sha256(convert_to(jsonb_build_array(terms,privacy)::text,'UTF8')),'hex')) end from documents
$$;
revoke all on function public.jobkix_account_terms(text) from public;
grant execute on function public.jobkix_account_terms(text) to anon,authenticated;
grant select on public.jobkix_account_consents to authenticated;
create policy jobkix_account_consents_self on public.jobkix_account_consents for select to authenticated using(user_id=auth.uid());
grant select on public.jobkix_accounts,public.jobkix_candidates,public.jobkix_memberships,public.jobkix_sites,public.jobkix_organizations,public.jobkix_organization_private,
public.jobkix_candidate_blocks,public.jobkix_vacancies,public.jobkix_vacancy_revisions,public.jobkix_screening_questions,public.jobkix_applications,public.jobkix_application_events,
public.jobkix_threads,public.jobkix_messages,public.jobkix_interviews,public.jobkix_interview_panels,public.jobkix_evaluations,public.jobkix_offers,public.jobkix_offer_revisions,public.jobkix_interview_revisions,
public.jobkix_saved_jobs,public.jobkix_saved_searches,public.jobkix_drafts,public.jobkix_talent_pools,public.jobkix_talent_pool_members,public.jobkix_cases,public.jobkix_case_events,public.jobkix_outbox to authenticated;

create policy jobkix_accounts_self on public.jobkix_accounts for select to authenticated using(user_id=auth.uid());
create policy jobkix_candidates_self on public.jobkix_candidates for select to authenticated using(user_id=auth.uid() and exists(select 1 from public.jobkix_accounts a where a.user_id=auth.uid() and a.status='active'));
create policy jobkix_memberships_self on public.jobkix_memberships for select to authenticated using(user_id=auth.uid() or public.jobkix_can_act(organization_id,'team.manage'));
create policy jobkix_organizations_member on public.jobkix_organizations for select to authenticated using(exists(select 1 from public.jobkix_memberships m where m.organization_id=jobkix_organizations.id and m.user_id=auth.uid() and m.active and (m.expires_at is null or m.expires_at>now())));
create policy jobkix_organization_private_managers on public.jobkix_organization_private for select to authenticated using(public.jobkix_can_act(organization_id,'organization.manage'));
create policy jobkix_sites_scoped on public.jobkix_sites for select to authenticated using(public.jobkix_can_act(organization_id,'vacancy.write',id));
create policy jobkix_blocks_self on public.jobkix_candidate_blocks for select to authenticated using(candidate_user_id=auth.uid());
create policy jobkix_vacancies_scoped on public.jobkix_vacancies for select to authenticated using(public.jobkix_can_act(organization_id,'vacancy.write',site_id,id) or public.jobkix_can_act(organization_id,'application.read',site_id,id));
create policy jobkix_vacancy_revisions_scoped on public.jobkix_vacancy_revisions for select to authenticated using(exists(select 1 from public.jobkix_vacancies v where v.id=vacancy_id and public.jobkix_can_act(v.organization_id,'vacancy.write',v.site_id,v.id)));
create policy jobkix_questions_scoped on public.jobkix_screening_questions for select to authenticated using(exists(select 1 from public.jobkix_vacancies v where v.id=vacancy_id and public.jobkix_can_act(v.organization_id,'vacancy.write',v.site_id,v.id)));
create policy jobkix_applications_scoped on public.jobkix_applications for select to authenticated using(public.jobkix_application_visible(id));
create policy jobkix_application_events_scoped on public.jobkix_application_events for select to authenticated using(public.jobkix_application_visible(application_id));
create policy jobkix_threads_scoped on public.jobkix_threads for select to authenticated using(public.jobkix_application_visible(application_id));
create policy jobkix_messages_scoped on public.jobkix_messages for select to authenticated using(exists(select 1 from public.jobkix_threads t where t.id=thread_id and public.jobkix_application_visible(t.application_id)));
create policy jobkix_interviews_scoped on public.jobkix_interviews for select to authenticated using(public.jobkix_interview_visible(id));
create policy jobkix_interview_panels_scoped on public.jobkix_interview_panels for select to authenticated using(public.jobkix_interview_visible(interview_id));
create policy jobkix_evaluations_private on public.jobkix_evaluations for select to authenticated using(exists(select 1 from public.jobkix_interviews i join public.jobkix_applications a on a.id=i.application_id join public.jobkix_vacancies v on v.id=a.vacancy_id where i.id=interview_id and i.candidate_user_id<>auth.uid() and ((evaluator_user_id=auth.uid() and public.jobkix_interview_visible(i.id)) or public.jobkix_can_act(i.organization_id,'application.decide',v.site_id,v.id))));
create policy jobkix_offers_scoped on public.jobkix_offers for select to authenticated using(public.jobkix_application_visible(application_id) and (candidate_user_id<>auth.uid() or state<>'draft'));
create policy jobkix_offer_revisions_scoped on public.jobkix_offer_revisions for select to authenticated using(exists(select 1 from public.jobkix_offers o where o.id=offer_id and public.jobkix_application_visible(o.application_id) and (o.candidate_user_id<>auth.uid() or snapshot->>'state'<>'draft')));
create policy jobkix_interview_revisions_scoped on public.jobkix_interview_revisions for select to authenticated using(public.jobkix_interview_visible(interview_id));
create policy jobkix_saved_jobs_self on public.jobkix_saved_jobs for select to authenticated using(user_id=auth.uid());
create policy jobkix_saved_searches_self on public.jobkix_saved_searches for select to authenticated using(user_id=auth.uid());
create policy jobkix_drafts_self on public.jobkix_drafts for select to authenticated using(user_id=auth.uid());
create policy jobkix_pools_scoped on public.jobkix_talent_pools for select to authenticated using(public.jobkix_can_act(organization_id,'talent.search'));
create policy jobkix_pool_members_consent on public.jobkix_talent_pool_members for select to authenticated using(expires_at>now() and exists(select 1 from public.jobkix_talent_pools p where p.id=pool_id and public.jobkix_candidate_discoverable(candidate_user_id,p.organization_id)));
create policy jobkix_cases_reporter on public.jobkix_cases for select to authenticated using(reporter_user_id=auth.uid());
create policy jobkix_case_events_reporter on public.jobkix_case_events for select to authenticated using(visibility='reporter' and exists(select 1 from public.jobkix_cases c where c.id=case_id and c.reporter_user_id=auth.uid()));
create policy jobkix_notifications_self on public.jobkix_outbox for select to authenticated using(recipient_user_id=auth.uid() and channel='in_app');

-- All helper functions are default-private except those needed by RLS; visitors receive projections only.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'jobkix\_%' escape '\' loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
grant execute on function public.jobkix_can_act(uuid,text,uuid,uuid),public.jobkix_application_visible(uuid),public.jobkix_interview_visible(uuid),public.jobkix_file_visible(uuid) to authenticated;
grant execute on function public.jobkix_candidate_discoverable(uuid,uuid),public.jobkix_talent_search(uuid,text) to authenticated;
grant execute on function public.jobkix_search(jsonb),public.jobkix_public_vacancy(uuid,boolean),public.jobkix_public_employers(text,text,integer),public.jobkix_public_editorial(text,text) to anon,authenticated;
insert into public.jobkix_schema_versions(version) values(2);
commit;
