begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=18) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_public_geography(p_country text default null,p_city text default null,p_query text default '',p_page integer default 1,p_origin text default null,p_abroad boolean default false) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if (p_origin is not null and p_origin!~'^[A-Z]{2}$') or p_page is null or p_page not between 1 and 10000 or length(coalesce(p_query,''))>240 or (p_country is not null and p_country!~'^[A-Z]{2}$') or (p_city is not null and p_city!~'^[a-f0-9]{16}$') then raise exception 'INVALID_INPUT';end if;
 -- Historical published coarse geography is safe; mutable private draft fields are never used.
 with visible as (select public.jobkix_public_vacancy(id,true) as data,(public.jobkix_job_eligible(id) and (not p_abroad or (p_origin is not null and country<>p_origin and overseas_applicants='yes'))) as active from public.jobkix_vacancies where public_snapshot is not null),
 places as (select data->>'country' as country,trim(data->>'city') as city,coalesce(data->>'region','') as region,active from visible where data->>'country' is not null),
 cities as (select country,min(city) as name,min(region) as region,substr(encode(sha256(convert_to(country||':'||lower(trim(city)),'UTF8')),'hex'),1,16) as key,count(*) filter(where active) as opportunity_count from places where city<>'' group by country,lower(trim(city))),
 matched_cities as (select * from cities where (p_country is null or country=p_country) and (p_city is null or key=p_city) and position(lower(coalesce(p_query,'')) in lower(name||' '||region))>0),
 paged_cities as (select * from matched_cities order by opportunity_count desc,name,key offset (p_page-1)*24 limit 24),
 countries as (select country,count(*) filter(where active) as opportunity_count from places group by country)
 select jsonb_build_object('countries',coalesce((select jsonb_agg(jsonb_build_object('code',country,'opportunityCount',opportunity_count) order by opportunity_count desc,country) from countries),'[]'),
 'cities',coalesce((select jsonb_agg(jsonb_build_object('key',key,'name',name,'country',country,'region',region,'opportunityCount',opportunity_count) order by opportunity_count desc,name,key) from paged_cities),'[]'),'cityTotal',(select count(*) from matched_cities),'cityPage',p_page,'cityPageSize',24) into result;return result;
end $$;
create function public.jobkix_employers_page(p_filters jsonb default '{}',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if p_filters is null or jsonb_typeof(p_filters)<>'object' or p_page is null or p_page not between 1 and 10000 or octet_length(p_filters::text)>6000 then raise exception 'INVALID_INPUT';end if;
 if exists(select 1 from jsonb_each(p_filters) f where key not in ('q','country','city','kind','setting','hiring') or jsonb_typeof(value)<>'string' or length(value#>>'{}')>300)
 or (p_filters?'country' and p_filters->>'country'!~'^[A-Z]{2}$') or (p_filters?'kind' and p_filters->>'kind' not in ('household','institution','healthcare','hospitality','ngo','public','multi_site')) or (p_filters?'hiring' and p_filters->>'hiring' not in ('yes','no')) then raise exception 'INVALID_INPUT';end if;
 if p_filters?'setting' and not exists(select 1 from public.jobkix_taxonomy where kind='setting' and key=p_filters->>'setting' and status='published') then raise exception 'INVALID_INPUT';end if;
 with eligible as (select o.* from public.jobkix_organizations o where o.status='active' and o.public_profile_approved_at is not null
 and position(lower(coalesce(p_filters->>'q','')) in lower(o.public_name||' '||o.public_description))>0
 and (not p_filters?'country' or o.country=p_filters->>'country') and (not p_filters?'city' or position(lower(p_filters->>'city') in lower(o.city))>0)
 and (not p_filters?'kind' or o.kind=p_filters->>'kind')
 and (not p_filters?'setting' or exists(select 1 from public.jobkix_vacancies v where v.organization_id=o.id and public.jobkix_job_eligible(v.id) and v.setting_id=p_filters->>'setting'))
 and (not p_filters?'hiring' or exists(select 1 from public.jobkix_vacancies v where v.organization_id=o.id and public.jobkix_job_eligible(v.id))=(p_filters->>'hiring'='yes'))),
 paged as (select * from eligible order by public_name,id offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.public_name,'kind',o.kind,'country',o.country,'city',o.city,'description',o.public_description,'originalLocale',o.original_locale,
 'identityReview',case when o.identity_reviewed_until>now() then jsonb_build_object('scope','organization_identity','validUntil',o.identity_reviewed_until) else null end,
 'liveVacancies',(select count(*) from public.jobkix_vacancies v where v.organization_id=o.id and public.jobkix_job_eligible(v.id))) order by o.public_name,o.id) from paged o),'[]'),'total',(select count(*) from eligible),'page',p_page,'pageSize',24) into result;return result;
end $$;
create or replace function public.jobkix_public_employers(p_country text default null,p_query text default '',p_page integer default 1) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$ select public.jobkix_employers_page(jsonb_build_object('q',coalesce(p_query,''))||case when p_country is null then '{}'::jsonb else jsonb_build_object('country',p_country) end,p_page) $$;
create function public.jobkix_public_employer(p_id uuid) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('id',o.id,'name',o.public_name,'description',o.public_description,'kind',o.kind,'originalLocale',o.original_locale,'country',o.country,'city',o.city,
 'identityReview',case when o.identity_reviewed_until>now() then jsonb_build_object('scope','organization_identity','validUntil',o.identity_reviewed_until) else null end,
 'liveVacancies',(select count(*) from public.jobkix_vacancies v where v.organization_id=o.id and public.jobkix_job_eligible(v.id)))
 from public.jobkix_organizations o where o.id=p_id and o.status='active' and o.public_profile_approved_at is not null
$$;
revoke all on function public.jobkix_public_geography(text,text,text,integer,text,boolean),public.jobkix_employers_page(jsonb,integer),public.jobkix_public_employer(uuid) from public,anon,authenticated;
grant execute on function public.jobkix_public_geography(text,text,text,integer,text,boolean),public.jobkix_employers_page(jsonb,integer),public.jobkix_public_employer(uuid) to anon,authenticated;
insert into public.jobkix_schema_versions(version) values(19);
commit;
