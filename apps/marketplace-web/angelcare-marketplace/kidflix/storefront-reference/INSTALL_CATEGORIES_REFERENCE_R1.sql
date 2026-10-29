-- ADDITIVE KidFlix category discovery. No catalogue records, content, or classification seeds.
-- Apply before deploying the matching application. Existing discovery functions are retained.
begin;
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
commit;
