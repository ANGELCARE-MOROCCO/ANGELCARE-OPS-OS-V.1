begin;
create extension if not exists pgcrypto;

alter table public.angelcare_marketplace_modules drop constraint if exists angelcare_marketplace_modules_introduced_by_mega_zip_check;
alter table public.angelcare_marketplace_modules add constraint angelcare_marketplace_modules_introduced_by_mega_zip_check check (introduced_by_mega_zip >= 1);

insert into public.angelcare_marketplace_modules(
 module_key,name,description,route_prefix,module_type,audience,navigation_group,navigation_order,status,enabled,
 required_permissions,required_dependencies,territory_aware,tenant_aware,locale_aware,health_status,owner_role,introduced_by_mega_zip,version
) values (
 'category-native-adaptive-customer-experience-mz2','Category-Native Adaptive Customer Experience · Mega ZIP 2',
 'Adaptive public experiences, self-service conversion and canonical operational continuity for every Experience Schema.',
 '/angelcare-marketplace','category_native_customer_experience',array['public','customer','organization','admin']::text[],
 'Marketplace Experience',36,'enabled',true,
 array['marketplace.category_native_experience.view','marketplace.category_native_experience.manage','marketplace.category_native_evidence.view']::text[],
 array['category-native-commerce-control-plane-mz1','conversion-universe','journey-control-universe','operations-reconciliation-universe']::text[],
 true,true,true,'healthy','marketplace_experience_manager',29,1
) on conflict(module_key) do update set
 name=excluded.name,description=excluded.description,route_prefix=excluded.route_prefix,module_type=excluded.module_type,audience=excluded.audience,
 navigation_group=excluded.navigation_group,navigation_order=excluded.navigation_order,status='enabled',enabled=true,
 required_permissions=excluded.required_permissions,required_dependencies=excluded.required_dependencies,territory_aware=true,tenant_aware=true,
 locale_aware=true,health_status='healthy',owner_role=excluded.owner_role,introduced_by_mega_zip=excluded.introduced_by_mega_zip,
 version=greatest(public.angelcare_marketplace_modules.version,excluded.version),updated_at=now();

insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive,description) values
 ('marketplace.category_native_experience.view','Voir les expériences category-native','Category-Native Experience',false,'Consulter les contrats publics et leur continuité.'),
 ('marketplace.category_native_experience.manage','Gérer les expériences category-native','Category-Native Experience',true,'Administrer les projections, configurateurs et handovers.'),
 ('marketplace.category_native_evidence.view','Voir les preuves category-native','Category-Native Experience',true,'Consulter sessions, résultats de prix, disponibilité et handovers.')
on conflict(permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive,description=excluded.description;

insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key from public.angelcare_marketplace_roles r cross join public.angelcare_marketplace_permissions p
where r.role_key in('marketplace_super_admin','marketplace_executive','marketplace_admin','marketplace_manager','marketplace_product_admin')
and p.permission_key in('marketplace.category_native_experience.view','marketplace.category_native_experience.manage','marketplace.category_native_evidence.view')
on conflict do nothing;

insert into public.angelcare_marketplace_feature_flags(flag_key,name,description,enabled,scope_type,status,version)
values('marketplace.category_native.mz2','Category-Native Customer Experience MZ2','Active le resolver public, les configurateurs, la conversion et le handover category-native.',true,'global','active',1)
on conflict(flag_key) do update set name=excluded.name,description=excluded.description,enabled=true,status='active',version=greatest(public.angelcare_marketplace_feature_flags.version,excluded.version),updated_at=now();

create table if not exists public.angelcare_marketplace_experience_sessions(
 id uuid primary key default gen_random_uuid(), session_key uuid unique not null, public_reference text unique default ('ACX-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 visitor_reference_hash text not null, schema_key text not null references public.angelcare_marketplace_experience_schemas(schema_key) on update cascade,
 schema_version integer not null check(schema_version>0), catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id),
 conversion_session_id uuid references public.angelcare_marketplace_conversion_sessions(id) on delete set null, conversion_session_key uuid,
 locale text not null check(locale in('fr','en','ar')), territory_id uuid, tenant_id uuid, family_account_id uuid, crm_account_id uuid,
 status text not null default 'configuring' check(status in('configuring','configuration_invalid','configuration_valid','availability_pending','unavailable','ready_for_review','committed','expired','cancelled','failed')),
 configuration jsonb not null default '{}'::jsonb, validation_result jsonb not null default '{}'::jsonb, source_route text,
 idempotency_key text not null, outcome_id uuid, expires_at timestamptz, committed_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(visitor_reference_hash,idempotency_key)
);
create index if not exists angelcare_marketplace_experience_sessions_schema_status_idx on public.angelcare_marketplace_experience_sessions(schema_key,status,created_at desc);
create index if not exists angelcare_marketplace_experience_sessions_conversion_idx on public.angelcare_marketplace_experience_sessions(conversion_session_id,conversion_session_key);

create table if not exists public.angelcare_marketplace_experience_configuration_snapshots(
 id uuid primary key default gen_random_uuid(),experience_session_id uuid not null references public.angelcare_marketplace_experience_sessions(id) on delete cascade,
 schema_key text not null,schema_version integer not null,configuration jsonb not null,validation_result jsonb not null default '{}'::jsonb,
 snapshot_hash text not null,created_at timestamptz not null default now(),unique(experience_session_id,snapshot_hash)
);
create table if not exists public.angelcare_marketplace_experience_price_results(
 id uuid primary key default gen_random_uuid(),experience_session_id uuid not null references public.angelcare_marketplace_experience_sessions(id) on delete cascade,
 conversion_price_snapshot_id uuid,status text not null,amount numeric(18,2),currency_label text not null default 'Dh',source text not null,
 evidence jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_experience_availability_results(
 id uuid primary key default gen_random_uuid(),experience_session_id uuid not null references public.angelcare_marketplace_experience_sessions(id) on delete cascade,
 status text not null,authority text not null,available_quantity integer,source_id text,starts_at timestamptz,ends_at timestamptz,reason text,
 evidence jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_experience_handover_events(
 id uuid primary key default gen_random_uuid(),experience_session_id uuid not null references public.angelcare_marketplace_experience_sessions(id) on delete cascade,
 conversion_outcome_id uuid,handover_type text not null,canonical_object_type text not null,canonical_object_id uuid,status text not null,
 payload jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create index if not exists angelcare_marketplace_experience_handover_canonical_idx on public.angelcare_marketplace_experience_handover_events(canonical_object_type,canonical_object_id,created_at desc);
create table if not exists public.angelcare_marketplace_experience_render_events(
 id uuid primary key default gen_random_uuid(),schema_key text not null,schema_version integer not null,catalog_item_id uuid,
 locale text not null,territory_id uuid,route text not null,device_class text,audience_key text,render_status text not null default 'rendered',
 duration_ms integer,evidence jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_experience_errors(
 id uuid primary key default gen_random_uuid(),experience_session_id uuid,session_key uuid,schema_key text,catalog_item_id uuid,
 error_code text not null,error_message text not null,severity text not null default 'error',source_route text,request_id text,
 context jsonb not null default '{}'::jsonb,resolved_at timestamptz,created_at timestamptz not null default now()
);

alter table public.angelcare_marketplace_conversion_sessions add column if not exists experience_schema_key text;
alter table public.angelcare_marketplace_conversion_sessions add column if not exists experience_schema_version integer;
alter table public.angelcare_marketplace_conversion_sessions add column if not exists operations_handover_type text;
alter table public.angelcare_marketplace_conversion_outcomes add column if not exists experience_configuration_snapshot jsonb not null default '{}'::jsonb;


create or replace view public.angelcare_marketplace_catalog_discovery_v with (security_invoker=true) as
select i.id,i.public_reference,i.item_key,i.slug,i.kind,i.name_fr,i.name_en,i.name_ar,i.short_description_fr,i.short_description_en,i.short_description_ar,
 i.description_fr,null::text description_en,null::text description_ar,i.source_locale,i.status,i.territory_id,i.currency_label,i.price_mode,i.price_amount,
 i.featured,i.availability_status,i.owner_id,i.created_by,i.updated_by,i.created_at,i.updated_at,p.category_key,cat.category_title_fr,cat.category_title_en,
 cat.category_title_ar,media.media_url,coalesce(trust.trust_labels,'{}'::text[]) trust_labels,territory.territory_code,
 coalesce((p.commercial_metadata->>'merchandising_priority')::integer,0) merchandising_priority,i.updated_at published_at,
 coalesce(i.commercial_metadata,'{}'::jsonb)||coalesce(p.commercial_metadata,'{}'::jsonb)||jsonb_build_object('experience_schema_key',i.experience_schema_key,'experience_schema_version',i.experience_schema_version,'experience_configuration',coalesce(i.experience_configuration,'{}'::jsonb)) commercial_metadata,
 i.experience_schema_key,i.experience_schema_version,coalesce(i.experience_configuration,'{}'::jsonb) experience_configuration
from public.angelcare_marketplace_catalog_items i
left join public.angelcare_marketplace_item_commercial_profiles p on p.catalog_item_id=i.id
left join public.angelcare_marketplace_territories territory on territory.id=i.territory_id
left join lateral (select max(c.title) filter(where c.locale='fr') category_title_fr,max(c.title) filter(where c.locale='en') category_title_en,max(c.title) filter(where c.locale='ar') category_title_ar from public.angelcare_marketplace_catalog_categories c where c.category_key=p.category_key and c.status='published' and(c.territory_id=i.territory_id or c.territory_id is null)) cat on true
left join lateral (select m.asset_url media_url from public.angelcare_marketplace_catalog_item_media m where m.catalog_item_id=i.id and m.status='active' order by(m.media_key='primary') desc,m.sort_order,m.created_at limit 1) media on true
left join lateral (select array_agg(distinct coalesce(d.name_fr,issuance.badge_key)) trust_labels from public.angelcare_marketplace_trust_badge_issuances issuance left join public.angelcare_marketplace_trust_badge_definitions d on d.id=issuance.badge_definition_id where issuance.object_id=i.id and issuance.status='active' and(issuance.object_type ilike '%catalog%' or issuance.object_type ilike '%item%')) trust on true;

create or replace view public.angelcare_marketplace_category_native_experience_sessions_v with (security_invoker=true) as
select s.id,s.public_reference,s.schema_key,s.schema_version,s.catalog_item_id,s.locale,s.territory_id,s.status,s.source_route,s.expires_at,s.committed_at,s.created_at,s.updated_at,
 c.item_key,c.slug,c.name_fr,c.kind,es.name_fr schema_name_fr,es.public_experience_template,es.conversion_template,es.operations_handover_type
from public.angelcare_marketplace_experience_sessions s
join public.angelcare_marketplace_catalog_items c on c.id=s.catalog_item_id
join public.angelcare_marketplace_experience_schemas es on es.schema_key=s.schema_key;

create or replace view public.angelcare_marketplace_category_native_handover_v with (security_invoker=true) as
select h.*,s.public_reference experience_reference,s.schema_key,s.schema_version,s.catalog_item_id,s.locale,s.territory_id
from public.angelcare_marketplace_experience_handover_events h join public.angelcare_marketplace_experience_sessions s on s.id=h.experience_session_id;

do $$ declare t text; begin
 foreach t in array array['angelcare_marketplace_experience_sessions','angelcare_marketplace_experience_configuration_snapshots','angelcare_marketplace_experience_price_results','angelcare_marketplace_experience_availability_results','angelcare_marketplace_experience_handover_events','angelcare_marketplace_experience_render_events','angelcare_marketplace_experience_errors'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
revoke all on public.angelcare_marketplace_category_native_experience_sessions_v from anon,authenticated;
revoke all on public.angelcare_marketplace_category_native_handover_v from anon,authenticated;
grant select on public.angelcare_marketplace_category_native_experience_sessions_v to service_role;
grant select on public.angelcare_marketplace_category_native_handover_v to service_role;

commit;
select 'category_native_adaptive_customer_experience_mz2_applied' result,
 (select count(*) from public.angelcare_marketplace_experience_schemas where status='active') active_schemas,
 (select count(*) from public.angelcare_marketplace_experience_sessions) experience_sessions,
 (select count(*) from public.angelcare_marketplace_experience_handover_events) handover_events;
