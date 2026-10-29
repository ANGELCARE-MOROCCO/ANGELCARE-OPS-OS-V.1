-- Atomic prerequisite recovery and explicit domain activation.
begin;
do $dependency$begin if to_regprocedure('public.ac_kidflix_home(text,text)')is null then execute $installation$
-- PENDING. Execute separately AFTER the DCE R7 activation; never run by the source installer.
-- No new customer identity, commerce engine, scheduler or media vault.

do $$begin
 if to_regclass('public.ac_dce_editions') is null then raise exception 'DCE_EDITIONS_REQUIRED';end if;
 if to_regclass('public.ac_kidflix_live_host')is not null and obj_description(to_regclass('public.ac_kidflix_live_host'),'pg_class')is distinct from 'ANGELCARE_KIDFLIX_PUBLIC_R1'then raise exception 'UNRELATED_KIDFLIX_INDEX';end if;
 if exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname in('ac_kidflix_home','ac_kidflix_catalogue','ac_kidflix_experience')and obj_description(oid,'pg_proc')is distinct from 'ANGELCARE_KIDFLIX_PUBLIC_R1')then raise exception 'UNRELATED_KIDFLIX_FUNCTION';end if;
end $$;
-- A public hostname is a deliberate operator publication binding, not a caller-supplied tenant.
create unique index if not exists ac_kidflix_live_host on public.ac_dce_records((lower(data->>'liveHost')))where kind='setting'and key='kidflix-homepage'and coalesce(data->>'liveHost','')<>'';
comment on index public.ac_kidflix_live_host is 'ANGELCARE_KIDFLIX_PUBLIC_R1';
create or replace function public.ac_kidflix_home(p_host text,p_locale text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;e jsonb;begin
 if p_locale not in('en','fr','ar')or length(p_host)>253 then raise exception 'INVALID_PUBLIC_REQUEST';end if;
 select *into r from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 if not found then return jsonb_build_object('configured',false);end if;
 e:=r.data->'live'->p_locale;
 if e is null or e->>'publishedAt'is null then return jsonb_build_object('configured',false);end if;
 if coalesce(e->'edition'->>'startsAt','')<>''and (e->'edition'->>'startsAt')::timestamptz>now()or coalesce(e->'edition'->>'endsAt','')<>''and(e->'edition'->>'endsAt')::timestamptz<=now()then return jsonb_build_object('configured',false);end if;
 return jsonb_build_object('configured',true,'locale',p_locale,'revision',e->'revision','edition',e->'edition');
end $$;
create or replace function public.ac_kidflix_catalogue(p_host text,p_locale text,p_filters jsonb default '{}',p_page int default 1,p_home boolean default false)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;answer jsonb;begin
 if p_locale not in('en','fr','ar')or p_page not between 1 and 10000 or octet_length(p_filters::text)>16384 then raise exception 'INVALID_PUBLIC_REQUEST';end if;
 select *into r from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 if r.id is null or public.ac_kidflix_home(p_host,p_locale)->>'configured'<>'true'then return jsonb_build_object('configured',false,'rows','[]'::jsonb,'total',0,'counts','{}'::jsonb,'subjects','[]'::jsonb,'skills','[]'::jsonb,'page',p_page,'pageSize',24);end if;
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
 (coalesce(p_filters->>'format','')=''or exists(select 1 from jsonb_array_elements(coalesce(l.d->'outputs','[]'))o where o->>'enabled'is distinct from'false'and upper(coalesce(case o->>'mime'when'application/pdf'then'PDF'when'image/png'then'PNG'else null end,o->>'format'))=upper(p_filters->>'format'))or upper(p_filters->>'format')=upper(coalesce(l.d->>'format','')))
 ),ranked as(select *,row_number()over(partition by family order by published_at desc nulls last,id)family_rank from filtered),picked as(
 select *from ranked where(not p_home or family_rank<=6)order by case when p_filters->>'sort'='title'then title end,case when coalesce(p_filters->>'sort','new')<>'title'then published_at end desc nulls last,id limit case when p_home then 96 else 24 end offset case when p_home then 0 else(p_page-1)*24 end
 ),cards as(select id,key,family,audience,release_id,published_at,title,jsonb_build_object(
 'locales',d->'locales','coverAssetId',d->'coverAssetId','ageMin',d->'ageMin','ageMax',d->'ageMax','estimatedMinutes',d->'estimatedMinutes','difficulty',d->'difficulty','subject',d->'subject','skillTags',d->'skillTags','format',d->'format','outputs',d->'outputs','discoveryPlacements',d->'discoveryPlacements')definition,
 jsonb_build_object('media',jsonb_build_object(coalesce(d->>'coverAssetId','none'),bindings->'media'->(d->>'coverAssetId')))bindings from picked)
 select jsonb_build_object('configured',true,'rows',coalesce((select jsonb_agg(to_jsonb(c))from cards c),'[]'),'total',(select count(*)from filtered),'counts',coalesce((select jsonb_object_agg(family,n)from(select family,count(*)n from live group by family)a),'{}'),'subjects',coalesce((select jsonb_agg(s)from(select distinct d->>'subject's from live where coalesce(d->>'subject','')<>''order by s limit 100)a),'[]'),'skills',coalesce((select jsonb_agg(s)from(select distinct trim(s)s from live cross join lateral unnest(string_to_array(replace(coalesce(d->>'skillTags',''),E'\r',''),E'\n'))s where trim(s)<>''order by s limit 100)a),'[]'),'page',p_page,'pageSize',24)into answer;return answer;
end $$;
create or replace function public.ac_kidflix_experience(p_host text,p_locale text,p_key text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;answer jsonb;begin
 if length(p_key)>120 or p_locale not in('en','fr','ar')then raise exception 'INVALID_PUBLIC_REQUEST';end if;
 select *into r from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 if r.id is null or ac_kidflix_home(p_host,p_locale)->>'configured'<>'true'then return null;end if;
 select jsonb_build_object('releaseId',z.id,'publishedAt',z.published_at,'manifest',z.manifest)into answer from ac_dce_records x join ac_dce_editions e on e.record_id=x.id and e.locale=p_locale and e.tenant_id is not distinct from r.tenant_id and e.territory_id is not distinct from r.territory_id join ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id and z.state='published'and z.manifest->>'editionLocale'=p_locale and z.tenant_id is not distinct from r.tenant_id and z.territory_id is not distinct from r.territory_id where x.key=p_key and x.kind in('experience','bundle')and x.lifecycle<>'archived'and x.tenant_id is not distinct from r.tenant_id and x.territory_id is not distinct from r.territory_id and coalesce(z.manifest->'definition'->>'visibility','free')='free';
 return answer;
end $$;
do $$declare f record;begin for f in select oid::regprocedure sig from pg_proc where pronamespace='public'::regnamespace and proname in('ac_kidflix_home','ac_kidflix_catalogue','ac_kidflix_experience')loop execute format('comment on function %s is %L',f.sig,'ANGELCARE_KIDFLIX_PUBLIC_R1');execute format('revoke all on function %s from public,anon,authenticated',f.sig);execute format('grant execute on function %s to service_role',f.sig);end loop;end $$;
notify pgrst,'reload schema';


$installation$;end if;end $dependency$;
do $dependency$begin if to_regprocedure('public.ac_kidflix_storefront(text,text,text,jsonb,integer)')is null then execute $installation$
-- PENDING: apply separately after DCE SQL15/16 and KidFlix SQL17/18. No seed content.

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
notify pgrst,'reload schema';


$installation$;end if;end $dependency$;
do $dependency$begin if to_regprocedure('public.ac_kidflix_reference_discovery_r1(text,text,text,jsonb,integer)')is null then execute $installation$
-- ADDITIVE KidFlix category discovery. No catalogue records, content, or classification seeds.
-- Apply before deploying the matching application. Existing discovery functions are retained.

do $$begin
 if to_regprocedure('public.ac_kidflix_home(text,text)')is null then raise exception 'KIDFLIX_PUBLIC_DISCOVERY_REQUIRED';end if;
 if to_regclass('public.angelcare_marketplace_media_assets')is null then raise exception 'NATIVE_MEDIA_REQUIRED';end if;
 if exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname in('ac_kidflix_reference_discovery_r1','ac_kidflix_reference_fold_r1') and obj_description(oid,'pg_proc')is distinct from 'ANGELCARE_KIDFLIX_CATEGORIES_REFERENCE_R1')then raise exception 'UNRELATED_REFERENCE_DISCOVERY_FUNCTION';end if;
end $$;
create or replace function public.ac_kidflix_reference_fold_r1(p_value text)returns text language sql immutable parallel safe set search_path=pg_catalog as $$select lower(regexp_replace(translate(coalesce(p_value,''),'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñأإآٱى٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnااااي01234567890123456789'),'[̀-ًͯ-ٰٟـ]','','g'))$$;
comment on function public.ac_kidflix_reference_fold_r1(text)is 'ANGELCARE_KIDFLIX_CATEGORIES_REFERENCE_R1';
revoke all on function public.ac_kidflix_reference_fold_r1(text)from public,anon,authenticated;
grant execute on function public.ac_kidflix_reference_fold_r1(text)to service_role;
create or replace function public.ac_kidflix_reference_discovery_r1(p_host text,p_locale text,p_family text,p_filters jsonb default '{}',p_page integer default 1)returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare root ac_dce_records;ed jsonb;answer jsonb;begin
 if p_locale not in('en','fr','ar')or p_family not in('printables','stories','learning','video','audio','visual-cards','presentations','assessments','activities','tools','planners','forms','community','commerce','bundles')or p_page not between 1 and 10000 or jsonb_typeof(p_filters)<>'object'or octet_length(p_filters::text)>16384 then raise exception 'INVALID_REFERENCE_DISCOVERY';end if;
 if coalesce(p_filters->>'sort','new')not in('new','title')then raise exception 'INVALID_SORT';end if;
 select * into root from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 if root.id is null or public.ac_kidflix_home(p_host,p_locale)->>'configured'is distinct from'true'then return jsonb_build_object('catalogue',jsonb_build_object('configured',false,'rows','[]','total',0,'page',p_page,'pageSize',12),'facets','{}');end if;
 select data->'live'->p_locale->'edition'into ed from ac_dce_records where kind='setting'and key='kidflix-storefront-'||p_family and lifecycle<>'archived'and tenant_id is not distinct from root.tenant_id and territory_id is not distinct from root.territory_id and data->'live'->p_locale->>'publishedAt'is not null;
 if(coalesce(ed->>'startsAt','')<>''and(ed->>'startsAt')::timestamptz>now())or(coalesce(ed->>'endsAt','')<>''and(ed->>'endsAt')::timestamptz<=now())then ed:=null;end if;
 with live as materialized(
 select x.id,x.key,x.family,x.audience,z.id release_id,z.published_at,z.manifest->>'title'title,z.manifest->'definition'd,z.manifest->'bindings'b
 from ac_dce_records x join ac_dce_editions e on e.record_id=x.id and e.locale=p_locale and e.tenant_id is not distinct from root.tenant_id and e.territory_id is not distinct from root.territory_id
 join ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id and z.state='published'and z.manifest->>'editionLocale'=p_locale and z.manifest->>'family'=x.family and z.tenant_id is not distinct from root.tenant_id and z.territory_id is not distinct from root.territory_id
 where x.kind in('experience','bundle')and x.lifecycle<>'archived'and x.tenant_id is not distinct from root.tenant_id and x.territory_id is not distinct from root.territory_id and coalesce(z.manifest->'definition'->>'visibility','free')='free'
 ),family_live as materialized(
 select l.*,
 string_to_array(replace(coalesce(d->>'storefrontFocus',''),E'\r',''),E'\n')focus,
 string_to_array(replace(coalesce(d->>'storefrontThemes',''),E'\r',''),E'\n')themes,
 string_to_array(replace(coalesce(d->>'storefrontNeeds',''),E'\r',''),E'\n')needs,
 string_to_array(replace(coalesce(d->>'storefrontQuick',''),E'\r',''),E'\n')quick,
 coalesce((select jsonb_agg(o)from jsonb_array_elements(case when jsonb_typeof(d->'outputs')='array'then d->'outputs'else'[]'::jsonb end)o
 join angelcare_marketplace_media_assets m on m.id::text=o->>'assetId'and m.status='active'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and((to_jsonb(m)->>'tenant_id') is null or (to_jsonb(m)->>'tenant_id') is not distinct from root.tenant_id)and((to_jsonb(m)->>'territory_id') is null or (to_jsonb(m)->>'territory_id') is not distinct from root.territory_id)
 where d->>'downloadAllowed'='true'and o->>'enabled'is distinct from'false'and coalesce(o->>'id','')<>''and coalesce(o->>'label','')<>''and o->>'mime'in('application/pdf','image/png')and m.mime_type=o->>'mime'and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'and coalesce(o->>'scope','whole')in('whole','page','set')and(select count(*)from jsonb_array_elements(d->'outputs')q where q->>'id'=o->>'id')=1),'[]'::jsonb)ready_outputs,
 coalesce((select jsonb_object_agg(m.id::text,jsonb_build_object('url',coalesce(m.public_url,m.desktop_url),'mime',m.mime_type,'alt',coalesce(d->'locales'->p_locale->>'coverAlt',l.title)))from angelcare_marketplace_media_assets m
 where m.status='active'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and((to_jsonb(m)->>'tenant_id') is null or (to_jsonb(m)->>'tenant_id') is not distinct from root.tenant_id)and((to_jsonb(m)->>'territory_id') is null or (to_jsonb(m)->>'territory_id') is not distinct from root.territory_id)and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'
 and(m.id::text=d->>'coverAssetId'or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(d->'outputs')='array'then d->'outputs'else'[]'::jsonb end)o where o->>'assetId'=m.id::text))),'{}'::jsonb)active_media
 from live l where family=p_family
 ),filtered as(
 select *from family_live l where
 (coalesce(p_filters->>'keys','')=''or key=any(string_to_array(p_filters->>'keys',',')))and
 (coalesce(p_filters->>'q','')=''or position(public.ac_kidflix_reference_fold_r1(left(p_filters->>'q',100))in public.ac_kidflix_reference_fold_r1(coalesce(title,'')||' '||coalesce(d->'locales'->p_locale->>'summary','')||' '||coalesce(d->'locales'->p_locale->>'kidflixAliases',d->>'kidflixAliases','')||' '||coalesce(d->>'subject','')||' '||coalesce(d->>'skillTags','')))>0
 or focus && string_to_array(coalesce(p_filters->>'qFocus',''),',') or themes && string_to_array(coalesce(p_filters->>'qTheme',''),',') or d->>'subtype'=any(string_to_array(coalesce(p_filters->>'qSubtype',''),',')))and
 (coalesce(p_filters->>'subtype','')=''or d->>'subtype'=p_filters->>'subtype')and
 (coalesce(p_filters->>'subject','')=''or d->>'subject'=p_filters->>'subject')and
 (coalesce(p_filters->>'skill','')=''or p_filters->>'skill'=any(string_to_array(replace(coalesce(d->>'skillTags',''),E'\r',''),E'\n')))and
 (coalesce(p_filters->>'focus','')=''or p_filters->>'focus'=any(focus))and
 (coalesce(p_filters->>'theme','')=''or p_filters->>'theme'=any(themes))and
 (coalesce(p_filters->>'need','')=''or p_filters->>'need'=any(needs))and
 (coalesce(p_filters->>'quick','')=''or p_filters->>'quick'=any(quick))and
 (coalesce(p_filters->>'paper','')=''or d->>'paper'=p_filters->>'paper')and
 (coalesce(p_filters->>'orientation','')=''or d->>'orientation'=p_filters->>'orientation')and
 (coalesce(p_filters->>'colourMode','')=''or d->>'colourMode'=p_filters->>'colourMode')and
 (coalesce(p_filters->>'audience','')=''or audience=p_filters->>'audience')and
 (coalesce(p_filters->>'difficulty','')=''or d->>'difficulty'=p_filters->>'difficulty')and
 (coalesce(p_filters->>'age','')=''or case when p_filters->>'age'~'^\d+$'and d->>'ageMin'~'^\d+(\.\d+)?$'and d->>'ageMax'~'^\d+(\.\d+)?$'then(d->>'ageMin')::numeric<=(p_filters->>'age')::numeric and(d->>'ageMax')::numeric>=(p_filters->>'age')::numeric else false end)and
 (coalesce(p_filters->>'stage','')=''or case when d->>'ageMin'~'^\d+(\.\d+)?$'and d->>'ageMax'~'^\d+(\.\d+)?$'then
 (d->>'ageMin')::numeric<=case p_filters->>'stage'when'toddler'then 3 when'preschool'then 5 when'early-primary'then 7 when'primary'then 9 when'upper-primary'then 11 when'middle-school'then 14 when'high-school'then 18 else -1 end and
 (d->>'ageMax')::numeric>=case p_filters->>'stage'when'toddler'then 2 when'preschool'then 3 when'early-primary'then 5 when'primary'then 7 when'upper-primary'then 9 when'middle-school'then 11 when'high-school'then 14 else 121 end else false end)and
 (coalesce(p_filters->>'duration','')=''or case when p_filters->>'duration'~'^\d+$'and d->>'estimatedMinutes'~'^\d+(\.\d+)?$'then(d->>'estimatedMinutes')::numeric<=(p_filters->>'duration')::numeric else false end)and
 (coalesce(p_filters->>'format','')=''or exists(select 1 from jsonb_array_elements(ready_outputs)o where upper(p_filters->>'format')=case o->>'mime'when'application/pdf'then'PDF'else'PNG'end))and
 (coalesce(p_filters->>'collection','')=''or exists(select 1 from jsonb_array_elements(coalesce(ed->'collections','[]'::jsonb))c where c->>'id'=p_filters->>'collection'and c->'keys'?l.key))
 ),picked as(select *from filtered order by case when p_filters->>'sort'='title'then title end,published_at desc nulls last,id limit 12 offset(p_page-1)*12),cards as(
 select jsonb_build_object('id',id,'key',key,'family',family,'audience',audience,'release_id',release_id,'published_at',published_at,'title',title,
 'definition',jsonb_build_object('locales',jsonb_build_object(p_locale,jsonb_build_object('summary',d->'locales'->p_locale->>'summary')),'coverAssetId',d->'coverAssetId','ageMin',d->'ageMin','ageMax',d->'ageMax','estimatedMinutes',d->'estimatedMinutes','difficulty',d->'difficulty','subject',d->'subject','skillTags',d->'skillTags','discoveryPlacements',d->'discoveryPlacements'),
 'bindings',jsonb_build_object('media',jsonb_build_object(coalesce(d->>'coverAssetId','none'),active_media->(d->>'coverAssetId'))),
 'discovery',jsonb_build_object('contentLocale',p_locale,'subtype',d->>'subtype','paper',d->>'paper','orientation',d->>'orientation','colourMode',d->>'colourMode','focus',focus,'themes',themes,'needs',needs,'quick',quick,'printAllowed',d->'printAllowed'),
 'previewImages',case when ed->>'preview'='images'then coalesce((select jsonb_agg(img)from(select jsonb_build_object('url',coalesce(m.public_url,m.desktop_url),'alt',coalesce(u->>'alt',title))img from jsonb_array_elements(case when jsonb_typeof(d->'units')='array'then d->'units'else'[]'::jsonb end)with ordinality units(u,ordinal) join angelcare_marketplace_media_assets m on m.id::text=u->>'assetId'where m.status='active'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and((to_jsonb(m)->>'tenant_id') is null or (to_jsonb(m)->>'tenant_id') is not distinct from root.tenant_id)and((to_jsonb(m)->>'territory_id') is null or (to_jsonb(m)->>'territory_id') is not distinct from root.territory_id)and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'and m.mime_type like'image/%'order by ordinal limit 3)a),'[]'::jsonb)else'[]'::jsonb end,
 'factsSource',jsonb_build_object('definition',jsonb_build_object('counts',jsonb_build_object(
 'units',case when jsonb_typeof(d->'units')='array'then jsonb_array_length(d->'units')else 0 end,
 'cards',case when jsonb_typeof(d->'cards')='array'then jsonb_array_length(d->'cards')else 0 end,
 'questions',case when jsonb_typeof(d->'questions')='array'then jsonb_array_length(d->'questions')else 0 end,
 'frames',case when jsonb_typeof(d->'frames')='array'then jsonb_array_length(d->'frames')else 0 end,
 'steps',case when jsonb_typeof(d->'steps')='array'then jsonb_array_length(d->'steps')else 0 end,
 'items',case when jsonb_typeof(d->'items')='array'then jsonb_array_length(d->'items')else 0 end,
 'modules',case when jsonb_typeof(d->'modules')='array'then jsonb_array_length(d->'modules')else 0 end,'fields',case when jsonb_typeof(d->'fields')='array'then jsonb_array_length(d->'fields')else 0 end),
 'downloadAllowed',d->'downloadAllowed','outputs',ready_outputs,'editable',d->'editable','certificatePolicy',d->'certificatePolicy'),
 'bindings',jsonb_build_object('media',active_media),
 'flags',jsonb_build_object('transcript',coalesce(nullif(d->>'transcript',''),'')<>''or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(d->'units')='array'then d->'units'else'[]'::jsonb end)u where coalesce(u->>'transcript','')<>''),
 'narration',family='stories'and d->>'mode'in('Read-aloud story mode','Slideshow story mode','read_aloud','slideshow')and exists(select 1 from angelcare_marketplace_media_assets m where m.status='active'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and((to_jsonb(m)->>'tenant_id') is null or (to_jsonb(m)->>'tenant_id') is not distinct from root.tenant_id)and((to_jsonb(m)->>'territory_id') is null or (to_jsonb(m)->>'territory_id') is not distinct from root.territory_id)and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'and m.mime_type like'audio/%'and(m.id::text=d->>'narrationAssetId'or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(d->'units')='array'then d->'units'else'[]'::jsonb end)u where m.id::text=u->>'narrationAssetId'))),
 'captions',family='video'and exists(select 1 from angelcare_marketplace_media_assets m where m.status='active'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and((to_jsonb(m)->>'tenant_id') is null or (to_jsonb(m)->>'tenant_id') is not distinct from root.tenant_id)and((to_jsonb(m)->>'territory_id') is null or (to_jsonb(m)->>'territory_id') is not distinct from root.territory_id)and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'and m.mime_type like'text/%'and(m.id::text=d->>'captionAssetId'or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(d->'captions')='array'then d->'captions'else'[]'::jsonb end)c where m.id::text=c->>'captionAssetId'))))))card from picked
 ),facet_values as(
 select 'subtype'k,d->>'subtype'v from family_live union all select 'subject',d->>'subject'from family_live union all select 'skill',unnest(string_to_array(replace(coalesce(d->>'skillTags',''),E'\r',''),E'\n'))from family_live union all
 select 'focus',unnest(focus)from family_live union all select'theme',unnest(themes)from family_live union all select'need',unnest(needs)from family_live union all select'quick',unnest(quick)from family_live union all
 select'paper',d->>'paper'from family_live union all select'orientation',d->>'orientation'from family_live union all select'colourMode',d->>'colourMode'from family_live union all select'audience',audience from family_live union all select'difficulty',d->>'difficulty'from family_live union all
 select'age',d->>'ageMin'from family_live union all select'age',d->>'ageMax'from family_live union all select'duration',d->>'estimatedMinutes'from family_live union all select'format',case o->>'mime'when'application/pdf'then'PDF'else'PNG'end from family_live cross join lateral jsonb_array_elements(ready_outputs)o
 )select jsonb_build_object('configured',ed is not null,'edition',ed,'facets',coalesce((select jsonb_object_agg(k,vals)from(select k,jsonb_agg(v order by v)vals from(select distinct k,v from facet_values where coalesce(v,'')<>'')a group by k)b),'{}'::jsonb),
 'catalogue',jsonb_build_object('configured',true,'rows',coalesce((select jsonb_agg(card)from cards),'[]'::jsonb),'total',(select count(*)from filtered),'page',p_page,'pageSize',12,'counts',coalesce((select jsonb_object_agg(family,n)from(select family,count(*)n from live group by family)a),'{}'::jsonb),'subjects',coalesce((select jsonb_agg(v)from(select distinct v from facet_values where k='subject'and coalesce(v,'')<>'')a),'[]'::jsonb),'skills',coalesce((select jsonb_agg(v)from(select distinct v from facet_values where k='skill'and coalesce(v,'')<>'')a),'[]'::jsonb)))into answer;
 return answer;
end $$;
comment on function public.ac_kidflix_reference_discovery_r1(text,text,text,jsonb,integer)is 'ANGELCARE_KIDFLIX_CATEGORIES_REFERENCE_R1';
revoke all on function public.ac_kidflix_reference_discovery_r1(text,text,text,jsonb,integer)from public,anon,authenticated;
grant execute on function public.ac_kidflix_reference_discovery_r1(text,text,text,jsonb,integer)to service_role;
notify pgrst,'reload schema';

$installation$;end if;end $dependency$;
do $dependency$begin if to_regprocedure('public.ac_kidflix_documents_r1(text,text,jsonb,integer)')is null then execute $installation$
-- KidFlix Documents Reference R1. ADDITIVE; no content/resource seeds.
-- Apply in Marketplace Supabase SQL editor before releasing the application.

do $$declare t text;begin
 foreach t in array array['ac_kidflix_documents_deliveries','ac_kidflix_documents_subscriptions','ac_kidflix_documents_request_budgets']loop if to_regclass('public.'||t)is not null and obj_description(to_regclass('public.'||t),'pg_class')is distinct from 'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1'then raise exception 'UNRELATED_DOCUMENTS_TABLE: %',t;end if;end loop;
 if exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname in('ac_kidflix_documents_budget','ac_kidflix_documents_subscribe','ac_kidflix_documents_unsubscribe','ac_kidflix_documents_delivery','ac_kidflix_documents_r1','ac_kidflix_documents_fold')and obj_description(oid,'pg_proc')is distinct from 'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1')then raise exception 'UNRELATED_DOCUMENTS_FUNCTION';end if;
 if to_regprocedure('public.ac_kidflix_home(text,text)') is null or to_regprocedure('public.ac_kidflix_experience(text,text,text)') is null then raise exception 'KIDFLIX_PUBLIC_DISCOVERY_REQUIRED'; end if;
 if to_regclass('public.angelcare_marketplace_media_assets') is null then raise exception 'NATIVE_MEDIA_REQUIRED';end if;
 if to_regclass('public.ac_kidflix_documents_deliveries') is not null and obj_description(to_regclass('public.ac_kidflix_documents_deliveries'),'pg_class') is distinct from 'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1' then raise exception 'UNRELATED_DOCUMENTS_TABLE';end if;
end $$;
create table if not exists public.ac_kidflix_documents_deliveries(
 id uuid primary key, home_id uuid not null references public.ac_dce_records(id),record_id uuid not null references public.ac_dce_records(id),release_id uuid not null references public.ac_dce_releases(id),locale text not null check(locale in('en','fr','ar')),occurred_at timestamptz not null default now()
);
comment on table public.ac_kidflix_documents_deliveries is 'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1';
create index if not exists ac_kidflix_documents_deliveries_scope on public.ac_kidflix_documents_deliveries(home_id,record_id,occurred_at);
create table if not exists public.ac_kidflix_documents_subscriptions(
 id uuid primary key,home_id uuid not null references public.ac_dce_records(id),email text not null check(length(email)<=254),locale text not null check(locale in('en','fr','ar')),status text not null check(status in('subscribed','unsubscribed')),consent_version text not null,consented_at timestamptz not null default now(),unsubscribe_hash text not null check(unsubscribe_hash~'^[a-f0-9]{64}$'),updated_at timestamptz not null default now(),unique(home_id,email)
);
comment on table public.ac_kidflix_documents_subscriptions is 'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1';
create table if not exists public.ac_kidflix_documents_request_budgets(
 home_id uuid not null references public.ac_dce_records(id),rate_key text not null check(rate_key~'^[a-f0-9]{64}$'),kind text not null check(kind in('newsletter','delivery')),bucket timestamptz not null,requests integer not null,primary key(home_id,rate_key,kind,bucket)
);
comment on table public.ac_kidflix_documents_request_budgets is 'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1';
alter table public.ac_kidflix_documents_deliveries enable row level security;
alter table public.ac_kidflix_documents_subscriptions enable row level security;
alter table public.ac_kidflix_documents_request_budgets enable row level security;
revoke all on public.ac_kidflix_documents_deliveries,public.ac_kidflix_documents_subscriptions,public.ac_kidflix_documents_request_budgets from public,anon,authenticated;
grant all on public.ac_kidflix_documents_deliveries,public.ac_kidflix_documents_subscriptions,public.ac_kidflix_documents_request_budgets to service_role;

create or replace function public.ac_kidflix_documents_budget(p_host text,p_locale text,p_rate_key text,p_kind text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare h uuid;b timestamptz; n integer;begin
 if p_locale not in('en','fr','ar') or p_kind not in('newsletter','delivery') or p_rate_key!~'^[a-f0-9]{64}$' then raise exception 'INVALID_BUDGET';end if;
 if public.ac_kidflix_home(p_host,p_locale)->>'configured' is distinct from 'true' then return false;end if;
 select id into h from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 if h is null then return false;end if;
 b:=to_timestamp(floor(extract(epoch from now())/600)*600);
 insert into ac_kidflix_documents_request_budgets values(h,p_rate_key,p_kind,b,1)on conflict(home_id,rate_key,kind,bucket)do update set requests=ac_kidflix_documents_request_budgets.requests+1 returning requests into n;
 delete from ac_kidflix_documents_request_budgets where home_id=h and bucket<now()-interval '1 day';
 return n<=case when p_kind='newsletter' then 5 else 30 end;
end $$;

create or replace function public.ac_kidflix_documents_subscribe(p_host text,p_locale text,p_email text,p_id uuid,p_unsubscribe_hash text,p_consent boolean) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare h uuid;prior ac_kidflix_documents_subscriptions;begin
 if p_locale not in('en','fr','ar') or p_consent is distinct from true or length(p_email)>254 or p_email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_unsubscribe_hash!~'^[a-f0-9]{64}$' then raise exception 'INVALID_SUBSCRIPTION';end if;
 if public.ac_kidflix_home(p_host,p_locale)->>'configured' is distinct from 'true' then raise exception 'UNAVAILABLE';end if;
 select id into h from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 perform pg_advisory_xact_lock(hashtext(h::text||lower(trim(p_email))));
 select * into prior from ac_kidflix_documents_subscriptions where home_id=h and email=lower(trim(p_email));
 -- An unauthenticated duplicate cannot rotate the unsubscribe secret or reactivate an opt-out.
 if found then return jsonb_build_object('recorded',true,'new',false);end if;
 insert into ac_kidflix_documents_subscriptions(id,home_id,email,locale,status,consent_version,unsubscribe_hash)values(p_id,h,lower(trim(p_email)),p_locale,'subscribed','documents-r1-explicit-email-opt-in',p_unsubscribe_hash);
 return jsonb_build_object('recorded',true,'new',true);
end $$;
create or replace function public.ac_kidflix_documents_unsubscribe(p_host text,p_hash text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare h uuid;begin
 if p_hash!~'^[a-f0-9]{64}$' then return false;end if;
 select id into h from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 update ac_kidflix_documents_subscriptions set status='unsubscribed',updated_at=now()where home_id=h and unsubscribe_hash=p_hash;
 return true;
end $$;
create or replace function public.ac_kidflix_documents_delivery(p_host text,p_locale text,p_key text,p_release uuid,p_receipt uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare h uuid;v jsonb;rid uuid;begin
 v:=public.ac_kidflix_experience(p_host,p_locale,p_key);
 if v is null or v->'manifest'->>'family' is distinct from 'documents' or v->>'releaseId' is distinct from p_release::text or v->'manifest'->'definition'->>'downloadAllowed' is distinct from 'true' then return false;end if;
 select id into h from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 select record_id into rid from ac_dce_releases where id=p_release and state='published';
 if h is null or rid is null then return false;end if;
 insert into ac_kidflix_documents_deliveries(id,home_id,record_id,release_id,locale)values(p_receipt,h,rid,p_release,p_locale)on conflict(id)do nothing;
 return true;
end $$;

create or replace function public.ac_kidflix_documents_fold(p_value text)returns text language sql immutable parallel safe set search_path=pg_catalog as $$select lower(regexp_replace(translate(coalesce(p_value,''),'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñأإآٱى٠١٢٣٤٥٦٧٨٩','AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnااااي0123456789'),'[̀-ًͯ-ٰٟـ]','','g'))$$;

create or replace function public.ac_kidflix_documents_r1(p_host text,p_locale text,p_filters jsonb default '{}',p_page integer default 1) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare root ac_dce_records;ed jsonb:='{}';answer jsonb;begin
 if p_locale not in('en','fr','ar') or p_page not between 1 and 10000 or octet_length(p_filters::text)>8192 or jsonb_typeof(p_filters)<>'object' then raise exception 'INVALID_DOCUMENT_DISCOVERY';end if;
 if coalesce(p_filters->>'language','')not in('','all','en','fr','ar')or coalesce(p_filters->>'sort','downloads')not in('downloads','new','title','rating')then raise exception 'INVALID_DOCUMENT_FILTER';end if;
 select * into root from ac_dce_records where kind='setting'and key='kidflix-homepage'and lifecycle<>'archived'and lower(data->>'liveHost')=lower(p_host);
 if root.id is null or public.ac_kidflix_home(p_host,p_locale)->>'configured' is distinct from 'true' then return jsonb_build_object('configured',false,'rows','[]'::jsonb,'total',0);end if;
 select data->'live'->p_locale->'edition' into ed from ac_dce_records where kind='setting'and key='kidflix-storefront-documents'and lifecycle<>'archived'and tenant_id is not distinct from root.tenant_id and territory_id is not distinct from root.territory_id and data->'live'->p_locale->>'publishedAt' is not null;
 if (coalesce(ed->>'startsAt','')<>''and(ed->>'startsAt')::timestamptz>now())or(coalesce(ed->>'endsAt','')<>''and(ed->>'endsAt')::timestamptz<=now())then ed:=null;end if;ed:=coalesce(ed,'{}');
 with allowed_locales as materialized(select l from unnest(array['en','fr','ar'])l where public.ac_kidflix_home(p_host,l)->>'configured'='true'),live_all as(
 select x.id,x.key,x.audience,z.id release_id,z.published_at,z.manifest->>'title'title,z.manifest->'definition'd,e.locale content_locale,z.manifest->'bindings'b
 from ac_dce_records x join ac_dce_editions e on e.record_id=x.id and e.locale in('en','fr','ar')and e.tenant_id is not distinct from root.tenant_id and e.territory_id is not distinct from root.territory_id
 join ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id and z.state='published'and z.manifest->>'editionLocale'=e.locale and z.tenant_id is not distinct from root.tenant_id and z.territory_id is not distinct from root.territory_id
 where x.family='documents'and x.kind='experience'and x.lifecycle<>'archived'and x.tenant_id is not distinct from root.tenant_id and x.territory_id is not distinct from root.territory_id and coalesce(z.manifest->'definition'->>'visibility','free')='free'and e.locale in(select l from allowed_locales)
 ),live as(
 select a.*,string_to_array(replace(coalesce(d->>'documentUses',''),E'\r',''),E'\n')uses,string_to_array(replace(coalesce(d->>'documentGrades',''),E'\r',''),E'\n')grades,string_to_array(replace(coalesce(d->>'documentThemes',''),E'\r',''),E'\n')themes,string_to_array(replace(coalesce(d->>'documentNeeds',''),E'\r',''),E'\n')needs,
 (select count(*)from ac_kidflix_documents_deliveries s where s.home_id=root.id and s.record_id=a.id and s.locale=a.content_locale)downloads,
 (select count(*)from ac_kidflix_documents_deliveries s where s.home_id=root.id and s.record_id=a.id and s.locale=a.content_locale and s.occurred_at>=date_trunc('day',now()at time zone'UTC')at time zone'UTC')today_downloads,
 (select coalesce(jsonb_agg(jsonb_build_object('id',o->>'id','label',o->>'label','mime',o->>'mime')),'[]')from jsonb_array_elements(case when jsonb_typeof(d->'outputs')='array'then d->'outputs'else'[]'::jsonb end)o join angelcare_marketplace_media_assets m on m.id::text=o->>'assetId'and m.status='active'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and((to_jsonb(m)->>'tenant_id') is null or (to_jsonb(m)->>'tenant_id') is not distinct from root.tenant_id)and((to_jsonb(m)->>'territory_id') is null or (to_jsonb(m)->>'territory_id') is not distinct from root.territory_id)
 where d->>'downloadAllowed'='true'and o->>'enabled'is distinct from'false'and coalesce(o->>'id','')<>''and coalesce(o->>'label','')<>''and o->>'mime'in('application/pdf','image/png')and m.mime_type=o->>'mime'and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'and coalesce(o->>'scope','whole')in('whole','page','set')and(select count(*)from jsonb_array_elements(d->'outputs')p where p->>'id'=o->>'id')=1)outputs,
 (select jsonb_build_object(coalesce(d->>'coverAssetId','none'),jsonb_build_object('url',coalesce(m.public_url,m.desktop_url),'mime',m.mime_type,'alt',coalesce(d->'locales'->a.content_locale->>'coverAlt',a.title)))from angelcare_marketplace_media_assets m where m.id::text=d->>'coverAssetId'and m.status='active'and m.mime_type like'image/%'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and((to_jsonb(m)->>'tenant_id') is null or (to_jsonb(m)->>'tenant_id') is not distinct from root.tenant_id)and((to_jsonb(m)->>'territory_id') is null or (to_jsonb(m)->>'territory_id') is not distinct from root.territory_id)and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])')cover
 from live_all a where p_filters->>'language'='all' or content_locale=coalesce(nullif(p_filters->>'language',''),p_locale)
 ),testimonials as(
 select t from jsonb_array_elements(case when jsonb_typeof(ed->'documentsTestimonials')='array'then ed->'documentsTestimonials'else'[]'::jsonb end)t
 where t->>'publicationPermission'='true'and coalesce(t->>'name','')<>''and coalesce(t->>'body','')<>''and t->>'sourceUrl'~'^https://'and t->>'rating'~'^[1-5]$'and(coalesce(t->>'resourceKey','')=''or exists(select 1 from live where key=t->>'resourceKey'))
 ),rated as(select l.*,(select avg((t->>'rating')::numeric)from testimonials where t->>'resourceKey'=l.key)rating,(select count(*)from testimonials where t->>'resourceKey'=l.key)rating_count from live l),
 filtered as(select * from rated l where
 (coalesce(p_filters->>'q','')=''or position(public.ac_kidflix_documents_fold(left(p_filters->>'q',100))in public.ac_kidflix_documents_fold(coalesce(title,'')||' '||coalesce(d->'locales'->content_locale->>'summary','')||' '||coalesce(d->'locales'->content_locale->>'kidflixAliases',d->>'kidflixAliases','')))>0)and
 (coalesce(p_filters->>'subtype','')=''or d->>'subtype'=p_filters->>'subtype')and
 (coalesce(p_filters->>'use','')=''or p_filters->>'use'=any(uses))and
 (coalesce(p_filters->>'need','')=''or p_filters->>'need'=any(needs))and
 (coalesce(p_filters->>'grade','')=''or p_filters->>'grade'=any(grades))and
 (coalesce(p_filters->>'theme','')=''or p_filters->>'theme'=any(themes))and
 (coalesce(p_filters->>'subject','')=''or d->>'documentSubject'=p_filters->>'subject'or public.ac_kidflix_documents_fold(d->>'subject')=public.ac_kidflix_documents_fold(p_filters->>'subject'))and
 (coalesce(p_filters->>'audience','')=''or audience=p_filters->>'audience')and
 (coalesce(p_filters->>'age','')=''or(case when p_filters->>'age'~'^\d+(\.\d+)?$'and d->>'ageMin'~'^\d+(\.\d+)?$'and d->>'ageMax'~'^\d+(\.\d+)?$'then(d->>'ageMin')::numeric<=(p_filters->>'age')::numeric and(d->>'ageMax')::numeric>=(p_filters->>'age')::numeric else false end))and
 (coalesce(p_filters->>'format','')=''or exists(select 1 from jsonb_array_elements(outputs)o where(o->>'mime'='application/pdf'and p_filters->>'format'='PDF')or(o->>'mime'='image/png'and p_filters->>'format'='PNG')))and
 (coalesce(p_filters->>'collection','')=''or exists(select 1 from jsonb_array_elements(coalesce(ed->'collections','[]'))c where c->>'id'=p_filters->>'collection'and c->'keys'?l.key))
 ),projected as(select l.*,jsonb_build_object('id',id,'key',key,'family','documents','audience',audience,'release_id',release_id,'published_at',published_at,'title',title,'contentLocale',content_locale,'definition',jsonb_build_object('locales',jsonb_build_object(content_locale,jsonb_build_object('summary',d->'locales'->content_locale->>'summary')),'coverAssetId',d->'coverAssetId','ageMin',d->'ageMin','ageMax',d->'ageMax','estimatedMinutes',d->'estimatedMinutes','subject',d->'subject','skillTags',d->'skillTags'),'bindings',jsonb_build_object('media',coalesce(cover,'{}')),'subtype',d->>'subtype','documentUses',uses,'grades',grades,'themes',themes,'needs',needs,'documentSubject',d->>'documentSubject','downloadTotal',downloads,'todayDownloads',today_downloads,'rating',rating,'ratingCount',rating_count,'outputs',outputs)card from rated l),
 selected as(select p.card,p.title,p.id,p.published_at,p.downloads,p.rating from projected p join filtered f on f.id=p.id and f.content_locale=p.content_locale order by case when coalesce(p_filters->>'sort','downloads')='downloads'then p.downloads end desc,case when p_filters->>'sort'='rating'then p.rating end desc nulls last,case when p_filters->>'sort'='title'then p.title end,p.published_at desc nulls last,p.id,p.content_locale limit 10 offset(p_page-1)*10),
 facets as(select 'subtype'k,d->>'subtype'v from live union all select'use',unnest(uses)from live union all select'grade',unnest(grades)from live union all select'theme',unnest(themes)from live union all select'need',unnest(needs)from live union all select'subject',coalesce(nullif(d->>'documentSubject',''),d->>'subject')from live union all select'audience',audience from live union all select'language',content_locale from live_all union all select'format',case o->>'mime'when'application/pdf'then'PDF'else'PNG'end from live cross join lateral jsonb_array_elements(outputs)o)
 select jsonb_build_object('configured',true,'rows',coalesce((select jsonb_agg(card)from selected),'[]'),'total',(select count(*)from filtered),'page',p_page,'pageSize',10,'inventoryTotal',(select count(*)from live),'downloadTotal',(select coalesce(sum(downloads),0)from live),'todayTotal',(select coalesce(sum(today_downloads),0)from live),'facets',coalesce((select jsonb_object_agg(k,vals)from(select k,jsonb_agg(v order by v)vals from(select distinct k,v from facets where coalesce(v,'')<>'')a group by k)b),'{}'),'ranked',coalesce((select jsonb_agg(card)from(select card from projected where downloads>0 order by downloads desc,published_at desc nulls last,id limit 5)a),'[]'),'today',coalesce((select jsonb_agg(card)from(select card from projected where today_downloads>0 order by today_downloads desc,id limit 4)a),'[]'),'collections',coalesce((select jsonb_agg(jsonb_build_object('id',c->>'id','title',c->>'title','description',c->>'description','rows',coalesce((select jsonb_agg(card)from projected where c->'keys'?key),'[]')))from jsonb_array_elements(coalesce(ed->'collections','[]'))c where exists(select 1 from projected where c->'keys'?key)),'[]'),'testimonials',coalesce((select jsonb_agg(jsonb_build_object('id',t->>'id','name',t->>'name','role',t->>'role','body',t->>'body','rating',(t->>'rating')::integer,'resourceKey',t->>'resourceKey','sourceUrl',t->>'sourceUrl','portrait',coalesce((select coalesce(m.public_url,m.desktop_url)from angelcare_marketplace_media_assets m where m.id::text=t->>'portraitAssetId'and m.status='active'and coalesce(m.metadata->>'status','')<>'failed'and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'and m.mime_type like'image/%'and(m.rights_expires_at is null or m.rights_expires_at>now())and((to_jsonb(m)->>'tenant_id') is null or (to_jsonb(m)->>'tenant_id') is not distinct from root.tenant_id)and((to_jsonb(m)->>'territory_id') is null or (to_jsonb(m)->>'territory_id') is not distinct from root.territory_id)),'')))from testimonials),'[]'),'edition',jsonb_build_object('headline',ed->>'headline','description',ed->>'description','documentsSocialLinks',ed->'documentsSocialLinks','mediaBindings',ed->'mediaBindings'),'updatedAt',now(),'reportingTimezone','UTC') into answer;
 return answer;
end $$;

do $$declare f record;begin for f in select oid::regprocedure sig from pg_proc where pronamespace='public'::regnamespace and proname in('ac_kidflix_documents_budget','ac_kidflix_documents_subscribe','ac_kidflix_documents_unsubscribe','ac_kidflix_documents_delivery','ac_kidflix_documents_r1','ac_kidflix_documents_fold')loop execute format('comment on function %s is %L',f.sig,'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1');execute format('revoke all on function %s from public,anon,authenticated',f.sig);execute format('grant execute on function %s to service_role',f.sig);end loop;end $$;
notify pgrst,'reload schema';

$installation$;end if;end $dependency$;
-- Explicit operator recovery for the reported production incident.
-- No resource is created, republished, translated or moved between scopes.

do $recovery$
declare document public.ac_dce_records; home public.ac_dce_records;
  proposed jsonb; live jsonb; lang text; total integer; before_data jsonb;
  actor text; created boolean:=false;
begin
  perform pg_advisory_xact_lock(hashtextextended('kidflix-public-recovery-my.angelcarehub.com',0));
  if exists(select 1 from public.ac_dce_events where channel='admin' and action='kidflix_public_recovery_r1' and data->>'host'='my.angelcarehub.com') then
    raise notice 'Recovery already recorded; no activation repeated. Use the verification query.';
    return;
  end if;
  select count(*) into total from public.ac_dce_records x
    join public.ac_dce_editions e on e.record_id=x.id and e.locale='fr'
    join public.ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id
    where x.key='kf-dg-dev-01' and x.kind='experience' and x.family='documents'
      and x.lifecycle<>'archived' and z.state='published' and z.manifest->>'editionLocale'='fr'
      and e.tenant_id is not distinct from x.tenant_id and e.territory_id is not distinct from x.territory_id
      and z.tenant_id is not distinct from x.tenant_id and z.territory_id is not distinct from x.territory_id
      and coalesce(z.manifest->'definition'->>'visibility','free')='free';
  if total<>1 then raise exception 'RECOVERY_REQUIRES_ONE_CONFIRMED_PUBLIC_FR_DOCUMENT: found %',total;end if;
  select x.* into document from public.ac_dce_records x
    join public.ac_dce_editions e on e.record_id=x.id and e.locale='fr'
    join public.ac_dce_releases z on z.id=e.active_release_id and z.record_id=x.id
    where x.key='kf-dg-dev-01' and x.kind='experience' and x.family='documents'
      and x.lifecycle<>'archived' and z.state='published' and z.manifest->>'editionLocale'='fr'
      and e.tenant_id is not distinct from x.tenant_id and e.territory_id is not distinct from x.territory_id
      and z.tenant_id is not distinct from x.tenant_id and z.territory_id is not distinct from x.territory_id
      and coalesce(z.manifest->'definition'->>'visibility','free')='free';
  if exists(select 1 from public.ac_dce_records where kind='setting' and key='kidflix-homepage'
    and lower(data->>'liveHost')='my.angelcarehub.com' and
    (tenant_id is distinct from document.tenant_id or territory_id is distinct from document.territory_id))
    then raise exception 'PUBLIC_HOST_BELONGS_TO_ANOTHER_SCOPE';end if;
  select * into home from public.ac_dce_records where kind='setting' and key='kidflix-homepage'
    and tenant_id is not distinct from document.tenant_id and territory_id is not distinct from document.territory_id for update;
  if home.lifecycle='archived' then raise exception 'ARCHIVED_HOMEPAGE_REQUIRES_EXPLICIT_RESTORE';end if;
  if coalesce(home.data->>'liveHost','') not in('','my.angelcarehub.com') then raise exception 'EXISTING_DOMAIN_BINDING_PROTECTED';end if;
  actor:='sql:public-journey-recovery-r1';
  before_data:=coalesce(home.data,'{}'::jsonb);
  proposed:=before_data||jsonb_build_object('liveHost','my.angelcarehub.com');
  live:=coalesce(nullif(proposed->'live','null'::jsonb),'{}'::jsonb);
  if jsonb_typeof(live)<>'object' then raise exception 'INVALID_HOMEPAGE_LIVE_DATA';end if;
  foreach lang in array array['fr','en','ar'] loop
    if live ? lang then
      if jsonb_typeof(live->lang)<>'object' or live->lang->>'publishedAt' is null then raise exception 'EXISTING_LIVE_EDITION_REQUIRES_REVIEW: %',lang;end if;
      if (coalesce(live->lang->'edition'->>'startsAt','')<>'' and (live->lang->'edition'->>'startsAt')::timestamptz>now()) or
         (coalesce(live->lang->'edition'->>'endsAt','')<>'' and (live->lang->'edition'->>'endsAt')::timestamptz<=now()) then raise exception 'EXISTING_PUBLICATION_WINDOW_PROTECTED: %',lang;end if;
    else
      -- An empty edition resolves to the shipped native homepage defaults.
      -- Never publish a saved/unreviewed homepage draft during incident recovery.
      live:=live||jsonb_build_object(lang,jsonb_build_object('edition','{}'::jsonb,'revision',coalesce(home.revision,0)+1,'publishedAt',now()));
    end if;
  end loop;
  proposed:=proposed||jsonb_build_object('live',live);
  if home.id is null then
    insert into public.ac_dce_records(kind,key,title,audience,data,created_by,updated_by,tenant_id,territory_id)
      values('setting','kidflix-homepage','KidFlix · public homepage','parent',proposed,actor,actor,document.tenant_id,document.territory_id) returning * into home;
    created:=true;
  else
    insert into public.ac_dce_versions(record_id,revision,snapshot,actor_id)values(home.id,home.revision,to_jsonb(home),actor)on conflict(record_id,revision)do nothing;
    update public.ac_dce_records set data=proposed,revision=revision+1,updated_at=now(),updated_by=actor where id=home.id returning * into home;
  end if;
  insert into public.ac_dce_events(channel,action,record_id,actor_id,tenant_id,territory_id,data)
    values('admin','kidflix_public_recovery_r1',home.id,actor,home.tenant_id,home.territory_id,
      jsonb_build_object('host','my.angelcarehub.com','documentId',document.id,'created',created,'beforeData',before_data,'afterData',proposed,'reason','Operator-requested recovery of published resource discovery'));
  foreach lang in array array['fr','en','ar'] loop
    if public.ac_kidflix_home('my.angelcarehub.com',lang)->>'configured' is distinct from 'true' then raise exception 'POST_RECOVERY_CONFIGURATION_FAILED: %',lang;end if;
  end loop;
  if public.ac_kidflix_experience('my.angelcarehub.com','fr','kf-dg-dev-01') is null then raise exception 'POST_RECOVERY_DOCUMENT_NOT_PUBLIC';end if;
end $recovery$;

-- Last result is an immediately usable release verification, not an empty success.
select lang as locale, public.ac_kidflix_home('my.angelcarehub.com',lang)->>'configured' as configured,
  public.ac_kidflix_catalogue('my.angelcarehub.com',lang,'{}'::jsonb,1,false)->>'total' as public_resources
from unnest(array['fr','en','ar'])lang;

notify pgrst,'reload schema';
commit;