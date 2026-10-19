-- PENDING: apply separately after DCE SQL15/16 and KidFlix SQL17/18. No seed content.
begin;
do $$begin
 if to_regprocedure('public.ac_kidflix_catalogue(text,text,jsonb,integer,boolean)') is null then raise exception 'KIDFLIX_R1_REQUIRED';end if;
 if obj_description(to_regprocedure('public.ac_kidflix_catalogue(text,text,jsonb,integer,boolean)'),'pg_proc')is distinct from 'ANGELCARE_KIDFLIX_PUBLIC_R1' then raise exception 'OWNED_KIDFLIX_R1_REQUIRED';end if;
 if exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname in('ac_kidflix_storefront')and obj_description(oid,'pg_proc')is distinct from 'ANGELCARE_KIDFLIX_STOREFRONTS_R2')then raise exception 'UNRELATED_STOREFRONT_FUNCTION';end if;
end $$;
create or replace function public.ac_kidflix_storefront(p_host text,p_locale text,p_family text,p_filters jsonb default '{}',p_page integer default 1)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;storefront_setting ac_dce_records;cat jsonb;facets jsonb;enriched jsonb;edition jsonb;p_home boolean:=false;begin
 if p_family not in('documents','printables','stories','learning','video','audio','visual-cards','presentations','assessments','activities','tools','planners','forms','community','commerce','bundles')or p_locale not in('en','fr','ar')or p_page not between 1 and 10000 or octet_length(p_filters::text)>16384 then raise exception 'INVALID_STOREFRONT';end if;
 p_filters:=p_filters||jsonb_build_object('family',p_family);
 cat:=jsonb_build_object('configured',coalesce(ac_kidflix_home(p_host,p_locale)->>'configured','false')::boolean,'rows','[]'::jsonb,'total',0,'counts','{}'::jsonb,'subjects','[]'::jsonb,'skills','[]'::jsonb,'page',p_page,'pageSize',24);
 if cat->>'configured' is distinct from 'true' then return jsonb_build_object('catalogue',cat,'facets','{}'::jsonb);end if;
 select * into r from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 with live as(
 select x.id,x.key,x.family,x.audience,z.id release_id,z.published_at,z.manifest->>'title'title,z.manifest->'definition'd,z.manifest->'bindings'bindings
 from ac_dce_records x join ac_dce_editions e on e.record_id=x.id and e.locale=p_locale and e.tenant_id is not distinct from r.tenant_id and e.territory_id is not distinct from r.territory_id
 join ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id and z.state='published'and z.manifest->>'editionLocale'=p_locale and z.tenant_id is not distinct from r.tenant_id and z.territory_id is not distinct from r.territory_id
 where x.tenant_id is not distinct from r.tenant_id and x.territory_id is not distinct from r.territory_id and x.kind in('experience','bundle')and x.lifecycle<>'archived'and coalesce(z.manifest->'definition'->>'visibility','free')='free'
 ),filtered as(select *from live l where
 (coalesce(p_filters->>'keys','')=''or l.key=any(string_to_array(p_filters->>'keys',',')))and
 (coalesce(p_filters->>'family','')=''or l.family=p_filters->>'family')and
 (coalesce(p_filters->>'intent','')=''or l.family=any(case p_filters->>'intent' when'read'then array['documents','stories','community']when'listen'then array['audio','stories']when'watch'then array['video','presentations']when'play'then array['assessments','activities','tools']when'learn'then array['learning','visual-cards','presentations','assessments','tools','bundles']when'print'then array['printables','visual-cards','planners']when'organise'then array['planners','forms']when'grownups'then array['documents','learning','presentations','planners','forms','community','commerce','bundles']else array[]::text[]end))and
 (coalesce(p_filters->>'q','')=''or l.title ilike '%'||replace(replace(left(p_filters->>'q',100),'%','\%'),'_','\_')||'%'or l.d->'locales'->p_locale->>'summary'ilike '%'||replace(replace(left(p_filters->>'q',100),'%','\%'),'_','\_')||'%')and
 (coalesce(p_filters->>'subject','')=''or l.d->>'subject'=p_filters->>'subject')and
 (coalesce(p_filters->>'skill','')=''or p_filters->>'skill'=any(string_to_array(replace(coalesce(l.d->>'skillTags',''),E'\r',''),E'\n')))and
 (coalesce(p_filters->>'difficulty','')=''or l.d->>'difficulty'=p_filters->>'difficulty')and
 (coalesce(p_filters->>'audience','')=''or l.audience=p_filters->>'audience')and
 (coalesce(p_filters->>'age','')=''or (l.d->>'ageMin'~'^\d+(\.\d+)?$'and l.d->>'ageMax'~'^\d+(\.\d+)?$'and(l.d->>'ageMin')::numeric<=(p_filters->>'age')::numeric and(l.d->>'ageMax')::numeric>=(p_filters->>'age')::numeric))and
 (coalesce(p_filters->>'duration','')=''or (l.d->>'estimatedMinutes'~'^\d+(\.\d+)?$'and(l.d->>'estimatedMinutes')::numeric<=(p_filters->>'duration')::numeric))and
 (coalesce(p_filters->>'format','')=''or exists(select 1 from jsonb_array_elements(coalesce(l.d->'outputs','[]'))o where l.d->>'downloadAllowed'='true'and o->>'enabled'is distinct from'false'and coalesce(o->>'id','')<>''and coalesce(o->>'label','')<>''and o->>'mime'in('application/pdf','image/png')and upper(case o->>'mime'when'application/pdf'then'PDF'when'image/png'then'PNG'end)=upper(p_filters->>'format')and (coalesce(o->>'scope','')=''or o->>'scope'in('whole','page','set'))and l.bindings->'media'->(o->>'assetId')->>'mime'=o->>'mime'and l.bindings->'media'->(o->>'assetId')->>'url'~'^(https://|/[^/])'and(select count(*)from jsonb_array_elements(coalesce(l.d->'outputs','[]'))q where q->>'id'=o->>'id')=1))
 ),ranked as(select *,row_number()over(partition by family order by published_at desc nulls last,id)family_rank from filtered),picked as(
 select *from ranked where(not p_home or family_rank<=6)order by case when p_filters->>'sort'='title'then title end,case when coalesce(p_filters->>'sort','new')<>'title'then published_at end desc nulls last,id limit case when p_home then 96 else 24 end offset case when p_home then 0 else(p_page-1)*24 end
 ),cards as(select id,key,family,audience,release_id,published_at,title,jsonb_build_object(
 'locales',d->'locales','coverAssetId',d->'coverAssetId','ageMin',d->'ageMin','ageMax',d->'ageMax','estimatedMinutes',d->'estimatedMinutes','difficulty',d->'difficulty','subject',d->'subject','skillTags',d->'skillTags','format',d->'format','outputs',d->'outputs','discoveryPlacements',d->'discoveryPlacements')definition,
 jsonb_build_object('media',jsonb_build_object(coalesce(d->>'coverAssetId','none'),bindings->'media'->(d->>'coverAssetId')))bindings from picked)
 select jsonb_build_object('configured',true,'rows',coalesce((select jsonb_agg(to_jsonb(c))from cards c),'[]'),'total',(select count(*)from filtered),'counts',coalesce((select jsonb_object_agg(family,n)from(select family,count(*)n from live group by family)a),'{}'),'subjects',coalesce((select jsonb_agg(s)from(select distinct d->>'subject's from live where coalesce(d->>'subject','')<>''order by s limit 100)a),'[]'),'skills',coalesce((select jsonb_agg(s)from(select distinct trim(s)s from live cross join lateral unnest(string_to_array(replace(coalesce(d->>'skillTags',''),E'\r',''),E'\n'))s where trim(s)<>''order by s limit 100)a),'[]'),'page',p_page,'pageSize',24)into cat;
 select * into storefront_setting from ac_dce_records where kind='setting'and key='kidflix-storefront-'||p_family and lifecycle<>'archived'and tenant_id is not distinct from r.tenant_id and territory_id is not distinct from r.territory_id;
 edition:=storefront_setting.data->'live'->p_locale->'edition';
 if storefront_setting.data->'live'->p_locale->>'publishedAt'is null or(coalesce(edition->>'startsAt','')<>''and(edition->>'startsAt')::timestamptz>now())or(coalesce(edition->>'endsAt','')<>''and(edition->>'endsAt')::timestamptz<=now())then edition:=null;end if;
 select coalesce(jsonb_agg(v.value||jsonb_build_object('factsSource',jsonb_build_object('definition',jsonb_build_object(
 'counts',jsonb_build_object('units',case when jsonb_typeof(z.manifest->'definition'->'units')='array' then jsonb_array_length(z.manifest->'definition'->'units')else 0 end,'cards',case when jsonb_typeof(z.manifest->'definition'->'cards')='array' then jsonb_array_length(z.manifest->'definition'->'cards')else 0 end,'questions',case when jsonb_typeof(z.manifest->'definition'->'questions')='array' then jsonb_array_length(z.manifest->'definition'->'questions')else 0 end,'frames',case when jsonb_typeof(z.manifest->'definition'->'frames')='array' then jsonb_array_length(z.manifest->'definition'->'frames')else 0 end,'steps',case when jsonb_typeof(z.manifest->'definition'->'steps')='array' then jsonb_array_length(z.manifest->'definition'->'steps')else 0 end,'items',case when jsonb_typeof(z.manifest->'definition'->'items')='array' then jsonb_array_length(z.manifest->'definition'->'items')else 0 end,'modules',case when jsonb_typeof(z.manifest->'definition'->'modules')='array' then jsonb_array_length(z.manifest->'definition'->'modules')else 0 end),
 'downloadAllowed',z.manifest->'definition'->'downloadAllowed','outputs',z.manifest->'definition'->'outputs','narrationAssetId',z.manifest->'definition'->'narrationAssetId','captionAssetId',z.manifest->'definition'->'captionAssetId','transcript',z.manifest->'definition'->'transcript','editable',z.manifest->'definition'->'editable','certificatePolicy',z.manifest->'definition'->'certificatePolicy'),
 'bindings',jsonb_build_object('media',z.manifest->'bindings'->'media')))order by v.n),'[]'::jsonb)into enriched from jsonb_array_elements(cat->'rows')with ordinality v(value,n) join ac_dce_releases z on z.id::text=v.value->>'release_id';
 with live as(select x.id,x.key,x.family,x.audience,z.id release_id,z.published_at,z.manifest->>'title' title,z.manifest->'definition' d,z.manifest->'bindings' bindings
from ac_dce_records x join ac_dce_editions e on e.record_id=x.id and e.locale=p_locale
join ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id and z.state='published' and z.manifest->>'editionLocale'=p_locale
where x.tenant_id is not distinct from r.tenant_id and x.territory_id is not distinct from r.territory_id and e.tenant_id is not distinct from r.tenant_id and e.territory_id is not distinct from r.territory_id and z.tenant_id is not distinct from r.tenant_id and z.territory_id is not distinct from r.territory_id
and x.kind in('experience','bundle') and x.lifecycle<>'archived' and coalesce(z.manifest->'definition'->>'visibility','free')='free' ),f as(select * from live where family=p_family),facet_values as(
 select 'subject'k,d->>'subject'v from f union all
 select 'skill',trim(v) from f cross join lateral unnest(string_to_array(replace(coalesce(d->>'skillTags',''),E'\r',''),E'\n'))v union all
 select 'format',case o->>'mime'when 'application/pdf'then 'PDF'when 'image/png'then 'PNG'end from f cross join lateral jsonb_array_elements(case when jsonb_typeof(d->'outputs')='array'then d->'outputs'else '[]'::jsonb end)o where d->>'downloadAllowed'='true'and o->>'enabled'is distinct from 'false'and coalesce(o->>'id','')<>''and coalesce(o->>'label','')<>''and o->>'mime'in('application/pdf','image/png')and bindings->'media'->(o->>'assetId')->>'mime'=o->>'mime'and bindings->'media'->(o->>'assetId')->>'url'~'^(https://|/[^/])' union all
 select 'audience',audience from f union all select 'difficulty',d->>'difficulty'from f union all
 select 'age',d->>'ageMin'from f union all select 'age',d->>'ageMax'from f union all
 select 'duration',d->>'estimatedMinutes'from f
 ),grouped as(select k,jsonb_agg(v order by v)vals from(select distinct k,v from facet_values where coalesce(v,'')<>'' )q group by k)
 select coalesce(jsonb_object_agg(k,vals),'{}')into facets from grouped;
 return jsonb_build_object('catalogue',jsonb_set(cat,'{rows}',enriched),'facets',facets,'edition',edition,'configured',edition is not null);
end $$;
comment on function public.ac_kidflix_storefront(text,text,text,jsonb,integer)is 'ANGELCARE_KIDFLIX_STOREFRONTS_R2';
revoke all on function public.ac_kidflix_storefront(text,text,text,jsonb,integer)from public,anon,authenticated;
grant execute on function public.ac_kidflix_storefront(text,text,text,jsonb,integer)to service_role;
notify pgrst,'reload schema';commit;
