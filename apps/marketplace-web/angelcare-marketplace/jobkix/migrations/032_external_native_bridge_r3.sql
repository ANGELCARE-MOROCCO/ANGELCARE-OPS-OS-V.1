-- JOBKIX R3 · external vacancies in the EXISTING native search/detail experience.
-- ADDITIVE: no employer accounts, no changes to native vacancy rows, no production execution.
-- PREREQUISITES: migration 030 + 031; authorized sources, complete mapping, publication mode.
-- IMPORTANT: review on staging before applying to production. Rollback is supplied separately.
begin;

do $$ begin
 if to_regclass('public.jobkix_supply_vacancies') is null
    or to_regclass('public.jobkix_supply_sources') is null
    or to_regprocedure('public.jobkix_matching_vacancies(jsonb)') is null
    or to_regprocedure('public.jobkix_public_vacancy(uuid,boolean)') is null
 then raise exception 'JOBKIX_R3_PREREQUISITES_MISSING';end if;
end $$;

create index if not exists jobkix_supply_source_url_lookup_r3
 on public.jobkix_supply_vacancies(source_id,canonical_url);
create index if not exists jobkix_supply_published_freshness_r3
 on public.jobkix_supply_vacancies(state,last_seen desc,published_at desc) where state='published';

create function public.jobkix_r3_https_url(p_url text) returns boolean
language sql immutable strict set search_path=pg_catalog as $$
 select length(p_url) between 13 and 1400
 and p_url ~* '^https://([a-z0-9]([-a-z0-9]*[a-z0-9])?\.)+[a-z]{2,63}(:443)?([/?][^[:space:]#]*)?$'
 and p_url !~ '[[:cntrl:]]'
 and p_url !~* '^https://[^/?#]*\.(local|internal|test|invalid|example)(:443)?([/?]|$)'
$$;
revoke all on function public.jobkix_r3_https_url(text) from public,anon,authenticated;

-- Fail-closed exact official application host match. Source config is approved by a privileged editorial operator;
-- a source-provided destination alone is never sufficient proof of employer authorization.
create function public.jobkix_r3_verified_apply_url(p_url text,p_hosts jsonb) returns boolean
language sql immutable set search_path=pg_catalog,public as $$
 select coalesce(public.jobkix_r3_https_url(p_url),false)
 and case when jsonb_typeof(p_hosts)='array' then exists(
  select 1 from jsonb_array_elements_text(p_hosts) as approved(host)
  where lower(approved.host)=lower(split_part(split_part(substring(p_url from '^https://[^/?#]+'),'://',2),':',1))
 ) else false end
$$;
revoke all on function public.jobkix_r3_verified_apply_url(text,jsonb) from public,anon,authenticated;


-- A verified source is not a verified employer: no fictitious organization or identity review.
-- Metadata permission DOES NOT authorize the full native rich vacancy experience; it stays unpublished.
-- Public functions require approved FULL rights and a source-configured exact official application host.
-- Country must be explicitly reported by the source, rather than guessed from the search target.
create function public.jobkix_r3_external_visible(p_vacancy uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(
  select 1 from public.jobkix_supply_vacancies v
  join public.jobkix_supply_sources s on s.id=v.source_id
  where v.id=p_vacancy and v.state='published' and s.enabled and s.approved
   and s.archived_at is null and s.publication_mode='full'
   and v.quality_score>=80 and v.published_at is not null
   and v.last_seen >= now()-interval '60 days' and v.last_seen<=now()+interval '5 minutes'
   and length(trim(v.title))>=3 and length(trim(v.company))>=2
   and v.country ~ '^[A-Z]{2}$'
   and v.normalized->>'countryEvidence'='source'
   and public.jobkix_r3_https_url(v.canonical_url)
   and public.jobkix_r3_verified_apply_url(v.normalized->>'applicationUrl',s.config->'officialApplyHosts')
   and not exists(select 1 from public.jobkix_vacancies native where native.id=v.id)
   and length(trim(v.description))>=120
   and (jsonb_array_length(case when jsonb_typeof(v.normalized->'duties')='array' then v.normalized->'duties' else '[]'::jsonb end)>0
      or jsonb_array_length(case when jsonb_typeof(v.normalized->'requirements')='array' then v.normalized->'requirements' else '[]'::jsonb end)>0)
   -- Normalized expiration dates are validated UTC timestamps. Bad dates are not admitted.
   and (case when nullif(v.normalized->>'expiresAt','') is null then true
        when v.normalized->>'expiresAt' ~ '^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$'
        then v.normalized->>'expiresAt' > to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        else false end)
 )
$$;
revoke all on function public.jobkix_r3_external_visible(uuid) from public,anon,authenticated;

create function public.jobkix_r3_external_public_vacancy(p_vacancy uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare v public.jobkix_supply_vacancies;s public.jobkix_supply_sources;
 n jsonb;rights_full boolean;pay jsonb;begin
 if not public.jobkix_r3_external_visible(p_vacancy) then return null;end if;
 select * into v from public.jobkix_supply_vacancies where id=p_vacancy;
 select * into s from public.jobkix_supply_sources where id=v.source_id;
 n:=v.normalized;rights_full:=s.publication_mode='full';
 pay:=case when jsonb_typeof(n->'compensation')='object' then n->'compensation' else null end;
 return jsonb_build_object(
  'id',v.id,'version',v.version,'state','published','title',v.title,
  'sourceOrigin','external','jobkixSponsored',true,'sponsoredBy','JOBKIX',
  'externalApplyUrl',n->>'applicationUrl','originalSourceUrl',v.canonical_url,
  'originalSourceName',s.name,'sourceRightsMode',s.publication_mode,
  'organizationId',null,'employerName',v.company,'employerKind','external',
  'country',v.country,'region',n->>'region','city',v.city,
  'settingId',case when exists(select 1 from public.jobkix_taxonomy t where t.kind='setting' and t.key=n->>'settingId' and t.status='published') then n->>'settingId' else null end,
  'occupationId',case when exists(select 1 from public.jobkix_taxonomy t where t.kind='occupation' and t.key=n->>'occupationId' and t.status='published') then n->>'occupationId' else null end,
  'originalLocale',n->>'originalLocale',
  'description',case when rights_full then v.description else '' end,
  'duties',case when rights_full and jsonb_typeof(n->'duties')='array' then n->'duties' else '[]'::jsonb end,
  'requirements',case when rights_full and jsonb_typeof(n->'requirements')='array' then n->'requirements' else '[]'::jsonb end,
  'benefits',case when rights_full and jsonb_typeof(n->'benefits')='array' then n->'benefits' else '[]'::jsonb end,
  'languages',case when jsonb_typeof(n->'languages')='array' then n->'languages' else '[]'::jsonb end,
  'ageCohorts',case when jsonb_typeof(n->'ageCohorts')='array' then n->'ageCohorts' else '[]'::jsonb end,
  'workSchedule',n->>'workSchedule','contractType',n->>'contractType','workLocation',n->>'workLocation',
  'liveIn',case when n->>'liveIn'='yes' then true else null end,
  'hoursPerWeek',case when jsonb_typeof(n->'hoursPerWeek')='number' then (n->>'hoursPerWeek')::numeric else null end,
  'compensation',pay,'salaryText',v.salary_text,
  'overseasApplicants',coalesce(n->>'overseasApplicants','unknown'),
  'sponsorship',coalesce(n->>'sponsorship','unknown'),
  'relocation',coalesce(n->>'relocation','unknown'),
  'requiredDocument',false,'questions','[]'::jsonb,
  'publishedAt',v.published_at,'expiresAt',n->>'expiresAt','updatedAt',v.updated_at,
  'identityReview',null
 );
end $$;
revoke all on function public.jobkix_r3_external_public_vacancy(uuid) from public,anon,authenticated;
grant execute on function public.jobkix_r3_external_public_vacancy(uuid) to anon,authenticated;

create function public.jobkix_r3_external_matches(p_filters jsonb)
returns table(id uuid,published_at timestamptz,relevance real)
language sql stable security definer set search_path=pg_catalog,public as $$
 with matched_professions as (
  select distinct t.key from public.jobkix_taxonomy t,
  lateral unnest(array[t.key,t.source_name_en]||t.synonyms||array(select value from jsonb_each_text(t.localized_names))) term
  where t.kind='occupation' and t.status='published' and coalesce(p_filters->>'q','')<>''
   and public.jobkix_term_matches(term,p_filters->>'q')
 ), eligible as (
  select v.*,s.publication_mode,
   case when s.publication_mode='full' then v.description else '' end as public_description,
   v.normalized n
  from public.jobkix_supply_vacancies v join public.jobkix_supply_sources s on s.id=v.source_id
  where public.jobkix_r3_external_visible(v.id)
 )
 select v.id,v.published_at,
  (case when coalesce(p_filters->>'q','')='' then 0 else
   ts_rank(to_tsvector('simple',v.title||' '||v.company||' '||v.public_description),plainto_tsquery('simple',p_filters->>'q')) end)::real relevance
 from eligible v
 where (
   coalesce(p_filters->>'q','')=''
   or to_tsvector('simple',v.title||' '||v.company||' '||v.public_description)@@plainto_tsquery('simple',p_filters->>'q')
   or position(lower(p_filters->>'q') in lower(v.title))>0
   or v.n->>'occupationId' in (select key from matched_professions)
 )
 and (coalesce(p_filters->>'reach','worldwide')='domestic' or nullif(p_filters->>'destination','') is null or v.country=p_filters->>'destination')
 and (coalesce(p_filters->>'reach','worldwide')<>'domestic' or (nullif(p_filters->>'origin','') is not null and v.country=p_filters->>'origin'))
 and (coalesce(p_filters->>'reach','worldwide')<>'abroad' or (nullif(p_filters->>'origin','') is not null and v.country<>p_filters->>'origin' and v.n->>'overseasApplicants'='yes'))
 and (nullif(p_filters->>'city','') is null or position(lower(p_filters->>'city') in lower(v.city))>0)
 and (nullif(p_filters->>'setting','') is null or v.n->>'settingId'=p_filters->>'setting')
 and (nullif(p_filters->>'occupation','') is null or v.n->>'occupationId'=p_filters->>'occupation')
 and nullif(p_filters->>'organizationId','') is null
 and (nullif(p_filters->>'workSchedule','') is null or v.n->>'workSchedule'=p_filters->>'workSchedule')
 and (nullif(p_filters->>'contractType','') is null or v.n->>'contractType'=p_filters->>'contractType')
 and (nullif(p_filters->>'workLocation','') is null or v.n->>'workLocation'=p_filters->>'workLocation')
 and (nullif(p_filters->>'language','') is null or (case when jsonb_typeof(v.n->'languages')='array' then v.n->'languages' else '[]'::jsonb end) ? (p_filters->>'language'))
 and (nullif(p_filters->>'ageCohort','') is null or (case when jsonb_typeof(v.n->'ageCohorts')='array' then v.n->'ageCohorts' else '[]'::jsonb end) ? (p_filters->>'ageCohort'))
 and (nullif(p_filters->>'sponsorship','') is null or v.n->>'sponsorship'=p_filters->>'sponsorship')
 and (nullif(p_filters->>'relocation','') is null or v.n->>'relocation'=p_filters->>'relocation')
 and (nullif(p_filters->>'salaryMinimum','') is null or (
   v.n#>>'{compensation,currency}'=p_filters->>'currency'
   and v.n#>>'{compensation,unit}'=p_filters->>'salaryUnit'
   and (case when (v.n#>>'{compensation,minimum}') ~ '^\d{1,10}(\.\d{1,2})?$'
        then (v.n#>>'{compensation,minimum}')::numeric else null end)
    >=(p_filters->>'salaryMinimum')::numeric))
$$;
revoke all on function public.jobkix_r3_external_matches(jsonb) from public,anon,authenticated;

-- Preserve the EXACT existing native matching function; join before sorting/page boundaries.
create or replace function public.jobkix_search(p_filters jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare pg integer:=coalesce((p_filters->>'page')::integer,1);
 page_size integer:=coalesce((p_filters->>'pageSize')::integer,12);result jsonb;
begin
 if pg not between 1 and 10000 or page_size not between 1 and 48 then raise exception 'INVALID_INPUT';end if;
 with matches as materialized(
  select n.id,n.published_at,n.relevance,'native'::text origin from public.jobkix_matching_vacancies(p_filters) n
  union all
  select e.id,e.published_at,e.relevance,'external'::text origin from public.jobkix_r3_external_matches(p_filters) e
 ),paged as (
  select * from matches
  order by case when p_filters->>'sort'='relevance' then relevance end desc nulls last,published_at desc,id
  offset (pg-1)*page_size limit page_size
 )
 select jsonb_build_object(
  'items',coalesce((select jsonb_agg(
   case when origin='external' then public.jobkix_r3_external_public_vacancy(id)
    else public.jobkix_public_vacancy(id) end
   order by case when p_filters->>'sort'='relevance' then relevance end desc nulls last,published_at desc,id
  ) from paged),'[]'::jsonb),
  'total',(select count(*) from matches),'page',pg,'pageSize',page_size
 ) into result;return result;
end $$;
revoke all on function public.jobkix_search(jsonb) from public,anon,authenticated;
grant execute on function public.jobkix_search(jsonb) to anon,authenticated;

-- Separate external bookmark storage: native FK and candidate workflows stay untouched.
create table public.jobkix_r3_external_saved (
 user_id uuid not null references auth.users(id) on delete cascade,
 vacancy_id uuid not null references public.jobkix_supply_vacancies(id) on delete cascade,
 collection text not null default 'default' check(length(collection) between 1 and 180),
 saved boolean not null default true,
 version integer not null default 1 check(version>0),
 saved_at timestamptz not null default now(),
 title_snapshot text not null default '',
 primary key(user_id,vacancy_id)
);
alter table public.jobkix_r3_external_saved enable row level security;
revoke all on public.jobkix_r3_external_saved from public,anon,authenticated;
create policy jobkix_r3_external_saved_read on public.jobkix_r3_external_saved
 for select to authenticated using(public.jobkix_own_active_account(user_id));
grant select on public.jobkix_r3_external_saved to authenticated;

create table public.jobkix_r3_external_save_receipts(
 user_id uuid not null references auth.users(id) on delete cascade,
 request_key text not null check(length(request_key) between 16 and 180),
 intent_hash text not null,
 result jsonb not null,
 created_at timestamptz not null default now(),
 primary key(user_id,request_key)
);
alter table public.jobkix_r3_external_save_receipts enable row level security;
revoke all on public.jobkix_r3_external_save_receipts from public,anon,authenticated;

create function public.jobkix_r3_external_saved_row(p_vacancy uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();r public.jobkix_r3_external_saved;begin
 select * into r from public.jobkix_r3_external_saved where user_id=actor and vacancy_id=p_vacancy;
 if not found then return jsonb_build_object('saved',false,'version',0,'collection','default');end if;
 return jsonb_build_object('saved',r.saved,'version',r.version,'collection',r.collection);
end $$;
revoke all on function public.jobkix_r3_external_saved_row(uuid) from public,anon,authenticated;
grant execute on function public.jobkix_r3_external_saved_row(uuid) to authenticated;

create function public.jobkix_r3_external_save(p_vacancy uuid,p_saved boolean,p_collection text,p_expected_version integer,p_key text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();stored public.jobkix_r3_external_saved;
 receipt public.jobkix_r3_external_save_receipts;body_hash text;answer jsonb;begin
 if p_vacancy is null or p_saved is null or p_expected_version is null or p_expected_version<0 or p_expected_version>1000000
  or p_collection is null or length(p_collection) not between 1 and 180 or p_key is null or length(p_key) not between 16 and 180
 then raise exception 'INVALID_INPUT';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':external-job:'||p_vacancy::text,0));
 body_hash:=encode(digest(p_vacancy::text||':'||p_saved::text||':'||p_collection||':'||p_expected_version::text,'sha256'),'hex');
 select * into receipt from public.jobkix_r3_external_save_receipts where user_id=actor and request_key=p_key;
 if found then
  if receipt.intent_hash<>body_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
  return receipt.result;
 end if;
 if p_saved and not public.jobkix_r3_external_visible(p_vacancy) then raise exception 'VACANCY_UNAVAILABLE';end if;
 select * into stored from public.jobkix_r3_external_saved where user_id=actor and vacancy_id=p_vacancy for update;
 if found then
  if stored.version<>p_expected_version then raise exception 'VERSION_CONFLICT';end if;
  update public.jobkix_r3_external_saved set saved=p_saved,collection=p_collection,
   saved_at=now(),version=version+1 where user_id=actor and vacancy_id=p_vacancy returning * into stored;
 else
  if p_expected_version<>0 or not p_saved then raise exception 'VERSION_CONFLICT';end if;
  insert into public.jobkix_r3_external_saved(user_id,vacancy_id,collection,saved,title_snapshot)
  select actor,v.id,p_collection,true,v.title from public.jobkix_supply_vacancies v where v.id=p_vacancy
  returning * into stored;
 end if;
 answer:=jsonb_build_object('version',stored.version,'saved',stored.saved,'collection',stored.collection);
 insert into public.jobkix_r3_external_save_receipts(user_id,request_key,intent_hash,result)
 values(actor,p_key,body_hash,answer);
 return answer;
end $$;
revoke all on function public.jobkix_r3_external_save(uuid,boolean,text,integer,text) from public,anon,authenticated;
grant execute on function public.jobkix_r3_external_save(uuid,boolean,text,integer,text) to authenticated;

-- Native/resource bookmarks and new external bookmarks share the existing saved collection.
create or replace function public.jobkix_saved_collection(p_locale text,p_kind text default 'all',p_collection text default '',p_query text default '',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();result jsonb;begin
 if p_locale is null or p_locale not in ('en','fr','es','hi','tl','id','ar') or p_kind is null or p_kind not in ('all','job','resource') or p_collection is null or length(p_collection)>180 or p_query is null or length(p_query)>240 or p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 with bookmarks as (
  select s.vacancy_id id,'job' kind,s.collection,s.saved_at,s.version,'native'::text origin,
   public.jobkix_public_vacancy(s.vacancy_id,true) target,null::text slug,''::text saved_title
   from public.jobkix_saved_jobs s where s.user_id=actor and s.saved
  union all
  select s.document_id,'resource',s.collection,s.updated_at,s.version,'native'::text origin,
   public.jobkix_public_editorial(d.slug,p_locale),d.slug,s.title_snapshot
   from public.jobkix_saved_resources s join public.jobkix_editorial_documents d on d.id=s.document_id
   where s.user_id=actor and s.saved
  union all
  select s.vacancy_id,'job',s.collection,s.saved_at,s.version,'external'::text origin,
   public.jobkix_r3_external_public_vacancy(s.vacancy_id),null::text,s.title_snapshot
   from public.jobkix_r3_external_saved s where s.user_id=actor and s.saved
 ),matches as (select * from bookmarks where (p_kind='all' or kind=p_kind)
  and (p_collection='' or collection=p_collection)
  and (p_query='' or position(lower(p_query) in lower(coalesce(target->>'title',saved_title)))>0)),
 paged as (select * from matches order by saved_at desc,id offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object(
  'id',id,'kind',kind,'collection',collection,'savedAt',saved_at,'version',version,
  'target',target,'slug',slug,'title',coalesce(target->>'title',saved_title),
  'sourceOrigin',origin
 ) order by saved_at desc,id) from paged),'[]'::jsonb),
 'total',(select count(*) from matches),'page',p_page,'pageSize',24,
 'collections',(select coalesce(jsonb_agg(collection order by collection),'[]'::jsonb)
   from (select distinct collection from bookmarks) names)) into result;
 return result;
end $$;
revoke all on function public.jobkix_saved_collection(text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.jobkix_saved_collection(text,text,text,text,integer) to authenticated;

-- R3 geography counts include only rights-authorized PUBLIC external vacancies; employer directories remain native-only.
create or replace function public.jobkix_public_geography(p_country text default null,p_city text default null,p_query text default '',p_page integer default 1,p_origin text default null,p_abroad boolean default false) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if (p_origin is not null and p_origin!~'^[A-Z]{2}$') or p_page is null or p_page not between 1 and 10000 or length(coalesce(p_query,''))>240 or (p_country is not null and p_country!~'^[A-Z]{2}$') or (p_city is not null and p_city!~'^[a-f0-9]{16}$') then raise exception 'INVALID_INPUT';end if;
 -- Historical published coarse geography is safe; mutable private draft fields are never used.
 with visible as (
 select public.jobkix_public_vacancy(id,true) as data,(public.jobkix_job_eligible(id) and (not p_abroad or (p_origin is not null and country<>p_origin and overseas_applicants='yes'))) as active
 from public.jobkix_vacancies where public_snapshot is not null
 union all
 select public.jobkix_r3_external_public_vacancy(v.id) as data,true as active
 from public.jobkix_supply_vacancies v
 where public.jobkix_r3_external_visible(v.id)
 and (not p_abroad or (p_origin is not null and v.country<>p_origin and v.normalized->>'overseasApplicants'='yes'))
),
 places as (select data->>'country' as country,trim(data->>'city') as city,coalesce(data->>'region','') as region,active from visible where data->>'country' is not null),
 cities as (select country,min(city) as name,min(region) as region,substr(encode(sha256(convert_to(country||':'||lower(trim(city)),'UTF8')),'hex'),1,16) as key,count(*) filter(where active) as opportunity_count from places where city<>'' group by country,lower(trim(city))),
 matched_cities as (select * from cities where (p_country is null or country=p_country) and (p_city is null or key=p_city) and position(lower(coalesce(p_query,'')) in lower(name||' '||region))>0),
 paged_cities as (select * from matched_cities order by opportunity_count desc,name,key offset (p_page-1)*24 limit 24),
 countries as (select country,count(*) filter(where active) as opportunity_count from places group by country)
 select jsonb_build_object('countries',coalesce((select jsonb_agg(jsonb_build_object('code',country,'opportunityCount',opportunity_count) order by opportunity_count desc,country) from countries),'[]'),
 'cities',coalesce((select jsonb_agg(jsonb_build_object('key',key,'name',name,'country',country,'region',region,'opportunityCount',opportunity_count) order by opportunity_count desc,name,key) from paged_cities),'[]'),'cityTotal',(select count(*) from matched_cities),'cityPage',p_page,'cityPageSize',24) into result;return result;
end $$;

revoke all on function public.jobkix_public_geography(text,text,text,integer,text,boolean) from public,anon,authenticated;
grant execute on function public.jobkix_public_geography(text,text,text,integer,text,boolean) to anon,authenticated;

-- R3 saved-search fanout: separate external match ledger because original native match table
-- carries a foreign key to native vacancies; it can NEVER hold supply vacancy IDs.
create table public.jobkix_r3_external_search_matches(
 search_id uuid not null references public.jobkix_saved_searches(id) on delete cascade,
 search_version integer not null,
 vacancy_id uuid not null references public.jobkix_supply_vacancies(id) on delete restrict,
 publication_key text not null check(length(publication_key)=64),
 event_id uuid references public.jobkix_events(id),
 created_at timestamptz not null default now(),
 primary key(search_id,search_version,vacancy_id,publication_key)
);
create index jobkix_r3_external_alert_event_idx on public.jobkix_r3_external_search_matches(event_id) where event_id is not null;
create table public.jobkix_r3_external_alert_scans(
 search_id uuid primary key references public.jobkix_saved_searches(id) on delete cascade,
 search_version integer not null,last_run_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.jobkix_r3_external_search_matches enable row level security;
alter table public.jobkix_r3_external_alert_scans enable row level security;
revoke all on public.jobkix_r3_external_search_matches,public.jobkix_r3_external_alert_scans from public,anon,authenticated;

create function public.jobkix_r3_process_external_search_alerts() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare saved public.jobkix_saved_searches;found_match record;event uuid;ids uuid[];
 found_count integer:=0;search_count integer:=0;has_more boolean;last_scan timestamptz;
begin
 for saved in select s.* from public.jobkix_saved_searches s
 join public.jobkix_accounts a on a.user_id=s.user_id and a.status='active'
 join auth.users u on u.id=s.user_id and u.email_confirmed_at is not null
 left join public.jobkix_r3_external_alert_scans scan on scan.search_id=s.id and scan.search_version=s.version
 where s.enabled and s.frequency in ('daily','weekly')
 and (scan.last_run_at is null or scan.last_run_at<=now()-case s.frequency when 'daily' then interval '1 day' else interval '7 days' end)
 order by scan.last_run_at nulls first,s.created_at,s.id for update of s skip locked limit 20 loop
  search_count:=search_count+1;ids:='{}';
  select last_run_at into last_scan from public.jobkix_r3_external_alert_scans
   where search_id=saved.id and search_version=saved.version;
  -- A publication key stays stable across source refreshes; no repeated alert for a re-fetched unchanged job.
  for found_match in select e.id,encode(digest(v.fingerprint||':'||coalesce(v.published_at::text,''),'sha256'),'hex') publication_key
    from public.jobkix_r3_external_matches(saved.filters) e
    join public.jobkix_supply_vacancies v on v.id=e.id
    where not exists (select 1 from public.jobkix_r3_external_search_matches seen
     where seen.search_id=saved.id and seen.search_version=saved.version and seen.vacancy_id=e.id
       and seen.publication_key=encode(digest(v.fingerprint||':'||coalesce(v.published_at::text,''),'sha256'),'hex'))
    order by e.published_at desc,e.id limit 20 loop
   insert into public.jobkix_r3_external_search_matches(search_id,search_version,vacancy_id,publication_key)
   values(saved.id,saved.version,found_match.id,found_match.publication_key) on conflict do nothing;
   if found then ids:=array_append(ids,found_match.id);end if;
  end loop;
  if cardinality(ids)>0 then
   event:=public.jobkix_emit('search.match',saved.id,null,array[saved.user_id],
     jsonb_build_object('savedSearchId',saved.id,'searchVersion',saved.version,'vacancyIds',to_jsonb(ids)));
   update public.jobkix_r3_external_search_matches set event_id=event
    where search_id=saved.id and search_version=saved.version and vacancy_id=any(ids) and event_id is null;
   found_count:=found_count+cardinality(ids);
  end if;
  select exists(select 1 from public.jobkix_r3_external_matches(saved.filters) e
    join public.jobkix_supply_vacancies v on v.id=e.id
    where not exists(select 1 from public.jobkix_r3_external_search_matches seen
     where seen.search_id=saved.id and seen.search_version=saved.version and seen.vacancy_id=e.id
       and seen.publication_key=encode(digest(v.fingerprint||':'||coalesce(v.published_at::text,''),'sha256'),'hex')))
   into has_more;
  insert into public.jobkix_r3_external_alert_scans(search_id,search_version,last_run_at,updated_at)
   values(saved.id,saved.version,case when has_more then last_scan else now() end,now())
   on conflict(search_id) do update set search_version=excluded.search_version,
     last_run_at=excluded.last_run_at,updated_at=now();
 end loop;
 return jsonb_build_object('searches',search_count,'matches',found_count);
end $$;
revoke all on function public.jobkix_r3_process_external_search_alerts() from public,anon,authenticated;
grant execute on function public.jobkix_r3_process_external_search_alerts() to service_role;

-- Extend only the notification context's search.match branch; recruitment notification types stay unchanged.
create or replace function public.jobkix_notification_context(p_row public.jobkix_outbox,p_delivery boolean default false) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare invitation public.jobkix_invitations;application public.jobkix_applications;meeting public.jobkix_interviews;offer public.jobkix_offers;saved public.jobkix_saved_searches;matches uuid[];loc text;recipient text;path text;begin
 if p_row.template_key='team.invited' then
  if not p_delivery or p_row.channel<>'email' then return null;end if;
  select * into invitation from public.jobkix_invitations where id=(p_row.data->>'invitationId')::uuid;
  if not found or invitation.revoked_at is not null or invitation.accepted_at is not null or invitation.expires_at<=now() or lower(invitation.email) is distinct from lower(p_row.recipient_email)
   or invitation.token_hash is distinct from encode(sha256(convert_to(coalesce(p_row.data->>'token',''),'UTF8')),'hex') or not public.jobkix_member_can_act(invitation.invited_by,invitation.organization_id,'team.manage') then return null;end if;
  return jsonb_build_object('recipient',invitation.email,'locale',p_row.locale,'type',p_row.template_key,'path','onboarding','invitationId',invitation.id,'token',p_row.data->>'token');
 end if;
 if p_row.recipient_user_id is null then return null;end if;
 select a.preferred_locale,u.email into loc,recipient from public.jobkix_accounts a join auth.users u on u.id=a.user_id and u.email_confirmed_at is not null
 where a.user_id=p_row.recipient_user_id and a.status='active' and (not p_delivery or a.notifications_email);
 if not found or recipient is null then return null;end if;
 if p_row.template_key='search.match' then
  select * into saved from public.jobkix_saved_searches where id=(p_row.data->>'savedSearchId')::uuid and user_id=p_row.recipient_user_id and version=(p_row.data->>'searchVersion')::integer and enabled and frequency<>'off';
  if not found then return null;end if;
  select array_agg(hit.id) into matches from (
    -- Preserve existing native alert authorization and candidate-block predicates.
    select m.id from public.jobkix_matching_vacancies(saved.filters) m
    join public.jobkix_vacancies v on v.id=m.id
    join public.jobkix_search_matches seen on seen.vacancy_id=v.id and seen.published_version=v.published_version
      and seen.search_id=saved.id and seen.search_version=saved.version and seen.event_id=p_row.event_id
    where not exists(select 1 from public.jobkix_candidate_blocks b where b.candidate_user_id=saved.user_id and b.organization_id=v.organization_id)
    union all
    -- External results must still be eligible at DELIVERY time (permissions/expiry can change).
    select e.id from public.jobkix_r3_external_matches(saved.filters) e
    join public.jobkix_supply_vacancies v on v.id=e.id
    join public.jobkix_r3_external_search_matches seen on seen.vacancy_id=v.id
      and seen.search_id=saved.id and seen.search_version=saved.version and seen.event_id=p_row.event_id
    where public.jobkix_r3_external_visible(v.id)
  ) hit;
  if coalesce(cardinality(matches),0)=0 then return null;end if;
  return jsonb_build_object('recipient',recipient,'locale',loc,'type',p_row.template_key,'savedSearchId',saved.id,'filters',saved.filters,'matchCount',cardinality(matches));
 end if;
 if p_row.template_key not in ('application.submitted','application.stage_changed','message.recorded','interview.proposed','interview.updated','interview.panel_responded','offer.sent','offer.accepted','offer.declined','offer.withdrawn','offer.expired','interview.reminder') or nullif(p_row.data->>'applicationId','') is null then return null;end if;
 select * into application from public.jobkix_applications where id=(p_row.data->>'applicationId')::uuid;
 if not found or not public.jobkix_member_application_visible(p_row.recipient_user_id,application.id) then return null;end if;
 if p_delivery and exists(select 1 from public.jobkix_candidate_blocks where candidate_user_id=application.candidate_user_id and organization_id=application.organization_id) then return null;end if;
 if p_row.template_key like 'offer.%' then
  select * into offer from public.jobkix_offers where id=(p_row.data->>'offerId')::uuid and application_id=application.id;
  if not found or offer.state='draft' or (p_delivery and (p_row.data->>'version')::integer is distinct from offer.version) then return null;end if;
 elsif p_row.template_key like 'interview.%' then
  select * into meeting from public.jobkix_interviews where id=(p_row.data->>'interviewId')::uuid and application_id=application.id;
  if not found or (p_delivery and (p_row.data->>'version')::integer is distinct from meeting.version) then return null;end if;
  if p_row.template_key='interview.reminder' and (meeting.state not in ('proposed','scheduled') or meeting.candidate_response not in ('pending','accepted') or meeting.starts_at<=now()
   or (meeting.candidate_user_id<>p_row.recipient_user_id and not exists(select 1 from public.jobkix_interview_panels where interview_id=meeting.id and member_user_id=p_row.recipient_user_id and response<>'declined'))) then return null;end if;
 end if;
 path:=case when application.candidate_user_id=p_row.recipient_user_id then 'career/applications/'||application.id::text else 'hiring/applications' end;
 return jsonb_build_object('recipient',recipient,'locale',loc,'type',p_row.template_key,'path',path,'applicationId',application.id,'organizationId',application.organization_id,'candidate',application.candidate_user_id=p_row.recipient_user_id);
end $$;

revoke all on function public.jobkix_notification_context(public.jobkix_outbox,boolean) from public,anon,authenticated;

commit;