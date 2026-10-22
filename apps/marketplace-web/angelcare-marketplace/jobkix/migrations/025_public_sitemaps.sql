begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=24) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_sitemap_page(p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if p_page is null or p_page not between 1 and 50000 then raise exception 'INVALID_INPUT';end if;
 with languages as (select unnest(array['en','fr','es','hi','tl','id','ar']) as locale),
 reviewed as (select d.slug,d.kind,e.locale,e.published_at from public.jobkix_editorial_documents d join public.jobkix_editorial_editions e on e.document_id=d.id
  where e.status='published' and e.source_revision=d.source_revision and e.source_hash=d.source_hash and e.reviewed_hash=e.content_hash and e.reviewed_by is not null),
 documents as (select locale,case
  when kind='legal' and slug~'^[a-z0-9][a-z0-9-]{1,100}$' then 'legal/'||slug
  when kind='guide' and slug~'^[a-z0-9][a-z0-9-]{1,179}$' then 'resources/'||slug
  when kind='help' and slug='contact' then 'contact'
  when kind='help' and slug~'^[a-z0-9][a-z0-9-]{1,179}$' then 'help/'||slug
  when kind='sector' and slug~'^sectors/[a-z0-9-]+$' and exists(select 1 from public.jobkix_taxonomy where kind='setting' and key=split_part(slug,'/',2) and status='published') then slug
  when kind='profession' and slug~'^professions/[a-z0-9-]+$' and exists(select 1 from public.jobkix_taxonomy where kind='occupation' and key=split_part(slug,'/',2) and status='published') then slug
  when kind='country' and slug~'^country/[a-z]{2}$' then 'countries/'||split_part(slug,'/',2)
  when kind='city' and slug~'^city/[a-z]{2}/[a-f0-9]{16}$' and exists(select 1 from public.jobkix_vacancies v where v.public_snapshot->>'country'=upper(split_part(slug,'/',2)) and substr(encode(sha256(convert_to((v.public_snapshot->>'country')||':'||lower(trim(v.public_snapshot->>'city')),'UTF8')),'hex'),1,16)=split_part(slug,'/',3)) then 'countries/'||split_part(slug,'/',2)||'/'||split_part(slug,'/',3)
  when kind='front' and slug='home' then '' when kind='front' and slug='careers-abroad' then 'abroad'
  when kind='front' and slug in ('for-jobseekers','for-employers','how-it-works','about','contact') then slug
  when kind='trust' and slug='trust-safety' then 'trust'
  when kind='front' and slug~'^employer/[0-9a-f-]{36}$' and exists(select 1 from public.jobkix_organizations o where o.id::text=split_part(slug,'/',2) and o.status='active' and o.public_profile_approved_at is not null) then 'employers/'||split_part(slug,'/',2)
  end as path,published_at as modified from reviewed),
 static as (select l.locale,p.path,null::timestamptz as modified from languages l cross join unnest(array['','for-jobseekers','for-employers','how-it-works','report']) p(path)),
 directories as (select l.locale,p.path,null::timestamptz as modified from languages l cross join lateral (
  select 'jobs' as path where exists(select 1 from public.jobkix_vacancies v where public.jobkix_job_eligible(v.id))
  union all select 'sectors' where exists(select 1 from public.jobkix_taxonomy where kind='setting' and status='published')
  union all select 'professions' where exists(select 1 from public.jobkix_taxonomy where kind='occupation' and status='published')
  union all select 'countries' where exists(select 1 from public.jobkix_vacancies where public_snapshot is not null)
  union all select 'employers' where exists(select 1 from public.jobkix_organizations where status='active' and public_profile_approved_at is not null)
  union all select 'resources' where exists(select 1 from reviewed where kind='guide' and locale=l.locale)
  union all select 'help' where exists(select 1 from reviewed where kind='help' and locale=l.locale)
  union all select 'reviews' where (public.jobkix_public_reputation('review',l.locale,'{}',1)->>'total')::integer>0
  union all select 'salaries' where (public.jobkix_public_reputation('salary',l.locale,'{}',1)->>'total')::integer>0
 )p),
 jobs as (select l.locale,'jobs/'||v.id::text as path,v.updated_at as modified from public.jobkix_vacancies v cross join languages l where public.jobkix_job_eligible(v.id)),
 combined as (select * from documents where path is not null union all select * from static union all select * from directories union all select * from jobs),
 entries as (select '/jobkix/'||locale||case when path='' then '' else '/'||path end as path,max(modified) as modified from combined group by locale,path),
 paged as (select * from entries order by path offset (p_page-1)*1000 limit 1000)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('path',path,'modified',modified) order by path) from paged),'[]'),'total',(select count(*) from entries),'page',p_page,'pageSize',1000) into result;return result;
end $$;
revoke all on function public.jobkix_sitemap_page(integer) from public,anon,authenticated;
grant execute on function public.jobkix_sitemap_page(integer) to anon,authenticated,service_role;
insert into public.jobkix_schema_versions(version) values(25);
commit;
