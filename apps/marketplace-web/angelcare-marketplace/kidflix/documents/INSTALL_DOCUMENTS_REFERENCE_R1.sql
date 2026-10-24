-- KidFlix Documents Reference R1. ADDITIVE; no content/resource seeds.
-- Apply in Marketplace Supabase SQL editor before releasing the application.
begin;
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
 (select coalesce(jsonb_agg(jsonb_build_object('id',o->>'id','label',o->>'label','mime',o->>'mime')),'[]')from jsonb_array_elements(case when jsonb_typeof(d->'outputs')='array'then d->'outputs'else'[]'::jsonb end)o join angelcare_marketplace_media_assets m on m.id::text=o->>'assetId'and m.status='active'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and(m.tenant_id is null or m.tenant_id is not distinct from root.tenant_id)and(m.territory_id is null or m.territory_id is not distinct from root.territory_id)
 where d->>'downloadAllowed'='true'and o->>'enabled'is distinct from'false'and coalesce(o->>'id','')<>''and coalesce(o->>'label','')<>''and o->>'mime'in('application/pdf','image/png')and m.mime_type=o->>'mime'and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'and coalesce(o->>'scope','whole')in('whole','page','set')and(select count(*)from jsonb_array_elements(d->'outputs')p where p->>'id'=o->>'id')=1)outputs,
 (select jsonb_build_object(coalesce(d->>'coverAssetId','none'),jsonb_build_object('url',coalesce(m.public_url,m.desktop_url),'mime',m.mime_type,'alt',coalesce(d->'locales'->a.content_locale->>'coverAlt',a.title)))from angelcare_marketplace_media_assets m where m.id::text=d->>'coverAssetId'and m.status='active'and m.mime_type like'image/%'and(m.rights_expires_at is null or m.rights_expires_at>now())and coalesce(m.metadata->>'status','')<>'failed'and(m.tenant_id is null or m.tenant_id is not distinct from root.tenant_id)and(m.territory_id is null or m.territory_id is not distinct from root.territory_id)and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])')cover
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
 select jsonb_build_object('configured',true,'rows',coalesce((select jsonb_agg(card)from selected),'[]'),'total',(select count(*)from filtered),'page',p_page,'pageSize',10,'inventoryTotal',(select count(*)from live),'downloadTotal',(select coalesce(sum(downloads),0)from live),'todayTotal',(select coalesce(sum(today_downloads),0)from live),'facets',coalesce((select jsonb_object_agg(k,vals)from(select k,jsonb_agg(v order by v)vals from(select distinct k,v from facets where coalesce(v,'')<>'')a group by k)b),'{}'),'ranked',coalesce((select jsonb_agg(card)from(select card from projected where downloads>0 order by downloads desc,published_at desc nulls last,id limit 5)a),'[]'),'today',coalesce((select jsonb_agg(card)from(select card from projected where today_downloads>0 order by today_downloads desc,id limit 4)a),'[]'),'collections',coalesce((select jsonb_agg(jsonb_build_object('id',c->>'id','title',c->>'title','description',c->>'description','rows',coalesce((select jsonb_agg(card)from projected where c->'keys'?key),'[]')))from jsonb_array_elements(coalesce(ed->'collections','[]'))c where exists(select 1 from projected where c->'keys'?key)),'[]'),'testimonials',coalesce((select jsonb_agg(jsonb_build_object('id',t->>'id','name',t->>'name','role',t->>'role','body',t->>'body','rating',(t->>'rating')::integer,'resourceKey',t->>'resourceKey','sourceUrl',t->>'sourceUrl','portrait',coalesce((select coalesce(m.public_url,m.desktop_url)from angelcare_marketplace_media_assets m where m.id::text=t->>'portraitAssetId'and m.status='active'and coalesce(m.metadata->>'status','')<>'failed'and coalesce(m.public_url,m.desktop_url,'')~'^(https://|/[^/])'and m.mime_type like'image/%'and(m.rights_expires_at is null or m.rights_expires_at>now())and(m.tenant_id is null or m.tenant_id is not distinct from root.tenant_id)and(m.territory_id is null or m.territory_id is not distinct from root.territory_id)),'')))from testimonials),'[]'),'edition',jsonb_build_object('headline',ed->>'headline','description',ed->>'description','documentsSocialLinks',ed->'documentsSocialLinks','mediaBindings',ed->'mediaBindings'),'updatedAt',now(),'reportingTimezone','UTC') into answer;
 return answer;
end $$;

do $$declare f record;begin for f in select oid::regprocedure sig from pg_proc where pronamespace='public'::regnamespace and proname in('ac_kidflix_documents_budget','ac_kidflix_documents_subscribe','ac_kidflix_documents_unsubscribe','ac_kidflix_documents_delivery','ac_kidflix_documents_r1','ac_kidflix_documents_fold')loop execute format('comment on function %s is %L',f.sig,'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1');execute format('revoke all on function %s from public,anon,authenticated',f.sig);execute format('grant execute on function %s to service_role',f.sig);end loop;end $$;
notify pgrst,'reload schema';
commit;
