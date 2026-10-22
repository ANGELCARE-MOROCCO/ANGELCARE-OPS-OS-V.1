-- Public, publication-checked projections. No private candidate or employer fields.
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=7) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_public_taxonomy(p_kind text,p_locale text,p_query text default '',p_letter text default '',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if p_kind not in ('setting','occupation','skill','age_cohort','collection') or p_locale not in ('en','fr','es','hi','tl','id','ar') or p_query is null or length(p_query)>240 or p_letter is null or length(p_letter)>4 or p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 with published as (
  select t.*,t.localized_names->>p_locale name from public.jobkix_taxonomy t where kind=p_kind and status='published' and length(trim(coalesce(t.localized_names->>p_locale,'')))>0
 ), matches as (
  select t.* from published t where (p_query='' or position(lower(p_query) in lower(t.name||' '||t.source_name_en||' '||array_to_string(t.synonyms,' ')))>0)
  and (p_letter='' or upper(left(t.name,1))=upper(p_letter))
 ), paged as (select * from matches order by case when p_kind='setting' then sort_order end,lower(name),key offset (p_page-1)*24 limit 24)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('key',t.key,'kind',t.kind,'name',t.name,'sortOrder',t.sort_order,'opportunityCount',
  (select count(*) from public.jobkix_vacancies v where public.jobkix_job_eligible(v.id) and (p_kind='setting' and v.setting_id=t.key or p_kind='occupation' and v.occupation_id=t.key))) order by case when p_kind='setting' then t.sort_order end,lower(t.name),t.key) from paged t),'[]'),
  'total',(select count(*) from matches),'page',p_page,'pageSize',24,'letters',(select coalesce(jsonb_agg(letter order by letter),'[]') from (select distinct upper(left(name,1)) letter from published) letters)) into result;
 return result;
end $$;

create function public.jobkix_public_taxon(p_kind text,p_key text,p_locale text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('key',t.key,'kind',t.kind,'name',t.localized_names->>p_locale,'sortOrder',t.sort_order,'opportunityCount',
  (select count(*) from public.jobkix_vacancies v where public.jobkix_job_eligible(v.id) and (p_kind='setting' and v.setting_id=t.key or p_kind='occupation' and v.occupation_id=t.key)))
 from public.jobkix_taxonomy t where t.kind=p_kind and t.key=p_key and t.status='published' and p_locale in ('en','fr','es','hi','tl','id','ar') and length(trim(coalesce(t.localized_names->>p_locale,'')))>0
$$;

create function public.jobkix_public_editorial_list(p_kind text,p_locale text,p_prefix text default '',p_query text default '',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare result jsonb;begin
 if p_kind not in ('front','guide','help','legal','sector','profession','country','city','trust') or p_locale not in ('en','fr','es','hi','tl','id','ar') or p_prefix is null or length(p_prefix)>180 or p_query is null or length(p_query)>240 or p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_INPUT';end if;
 with matches as (
  select d.id,d.slug,e.title,e.summary,e.author_name,e.published_at,e.version,e.sections from public.jobkix_editorial_documents d join public.jobkix_editorial_editions e on e.document_id=d.id
  where d.kind=p_kind and e.locale=p_locale and e.status='published' and e.reviewed_by is not null and e.reviewed_hash=e.content_hash and e.source_hash=d.source_hash and e.source_revision=d.source_revision
  and starts_with(d.slug,p_prefix) and (p_query='' or position(lower(p_query) in lower(e.title||' '||e.summary))>0)
 ), paged as (select * from matches order by published_at desc,id offset (p_page-1)*12 limit 12)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'slug',slug,'title',title,'summary',summary,'author',author_name,'publishedAt',published_at,'revision',version,'openingMedia',(select section->'media' from jsonb_array_elements(sections) section where section->>'id'='opening' limit 1)) order by published_at desc,id) from paged),'[]'),'total',(select count(*) from matches),'page',p_page,'pageSize',12) into result;
 return result;
end $$;
create function public.jobkix_related_taxonomy(p_kind text,p_key text,p_locale text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(jsonb_agg(jsonb_build_object('key',key,'kind',kind,'name',name,'opportunityCount',opportunities) order by opportunities desc,key),'[]') from (
  select t.key,t.kind,t.localized_names->>p_locale name,count(*) opportunities from public.jobkix_vacancies v join public.jobkix_taxonomy t
   on (p_kind='setting' and t.kind='occupation' and t.key=v.occupation_id or p_kind='occupation' and t.kind='setting' and t.key=v.setting_id)
  where public.jobkix_job_eligible(v.id) and (p_kind='setting' and v.setting_id=p_key or p_kind='occupation' and v.occupation_id=p_key)
   and t.status='published' and p_locale in ('en','fr','es','hi','tl','id','ar') and length(trim(coalesce(t.localized_names->>p_locale,'')))>0
  group by t.kind,t.key,t.localized_names order by opportunities desc,t.key limit 24
 ) related
$$;
revoke all on function public.jobkix_public_taxonomy(text,text,text,text,integer),public.jobkix_public_taxon(text,text,text),public.jobkix_public_editorial_list(text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.jobkix_public_taxonomy(text,text,text,text,integer),public.jobkix_public_taxon(text,text,text),public.jobkix_public_editorial_list(text,text,text,text,integer) to anon,authenticated;
revoke all on function public.jobkix_related_taxonomy(text,text,text) from public,anon,authenticated;
grant execute on function public.jobkix_related_taxonomy(text,text,text) to anon,authenticated;
insert into public.jobkix_schema_versions(version) values(8);
commit;
