-- PENDING. Execute separately AFTER the DCE R7 activation; never run by the source installer.
-- No new customer identity, commerce engine, scheduler or media vault.
begin;
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
notify pgrst,'reload schema';commit;
