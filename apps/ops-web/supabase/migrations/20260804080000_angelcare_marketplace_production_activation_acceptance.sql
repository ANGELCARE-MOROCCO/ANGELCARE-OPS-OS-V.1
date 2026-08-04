begin;

alter table public.angelcare_marketplace_modules
  drop constraint if exists angelcare_marketplace_modules_introduced_by_mega_zip_check;
alter table public.angelcare_marketplace_modules
  add constraint angelcare_marketplace_modules_introduced_by_mega_zip_check
  check (introduced_by_mega_zip >= 1);

insert into public.angelcare_marketplace_modules(
  module_key,name,description,route_prefix,module_type,audience,navigation_group,navigation_order,
  status,enabled,required_permissions,required_dependencies,territory_aware,tenant_aware,locale_aware,
  health_status,owner_role,introduced_by_mega_zip
) values(
  'production-activation-acceptance','Production Activation & Acceptance',
  'Real content activation, persistent readiness, end-to-end evidence and controlled go-live command.',
  '/angelcare-marketplace/admin/activation','activation_authority',array['admin','executive']::text[],
  'Intelligence & Launch',270,'enabled',true,
  array['marketplace.commerce.view','marketplace.publication.manage']::text[],
  array['complete-commerce-administration-universe','final-launch-authority-universe']::text[],
  true,true,true,'healthy','marketplace_release_manager',27
) on conflict(module_key) do update set
  name=excluded.name,description=excluded.description,route_prefix=excluded.route_prefix,module_type=excluded.module_type,
  audience=excluded.audience,navigation_group=excluded.navigation_group,navigation_order=excluded.navigation_order,
  status='enabled',enabled=true,required_permissions=excluded.required_permissions,required_dependencies=excluded.required_dependencies,
  territory_aware=true,tenant_aware=true,locale_aware=true,health_status='healthy',owner_role=excluded.owner_role,
  introduced_by_mega_zip=excluded.introduced_by_mega_zip,updated_at=now();

create table if not exists public.angelcare_marketplace_activation_runs(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('ACT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  status text not null default 'not_run' check(status in('not_run','running','passed','blocked','failed')),
  score integer not null default 0 check(score between 0 and 100),
  actor_id uuid,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_activation_checks(
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.angelcare_marketplace_activation_runs(id) on delete cascade,
  check_key text not null,
  group_key text not null,
  label_fr text not null,
  status text not null check(status in('passed','warning','blocked')),
  required boolean not null default true,
  measured_value numeric,
  expected_value numeric,
  message text not null,
  evidence jsonb not null default '{}',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique(run_id,check_key)
);

create table if not exists public.angelcare_marketplace_activation_evidence(
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.angelcare_marketplace_activation_runs(id) on delete cascade,
  evidence_key text not null,
  evidence_type text not null,
  storage_reference text,
  source_authority text,
  metadata jsonb not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now()
);

create or replace view public.angelcare_marketplace_activation_readiness_v
with (security_invoker=true) as
with item_readiness as (
  select
    i.id,
    exists(select 1 from public.angelcare_marketplace_catalog_item_media m where m.catalog_item_id=i.id and m.status='active') as has_media,
    exists(select 1 from public.angelcare_marketplace_catalog_item_categories c where c.catalog_item_id=i.id) as has_category,
    (i.price_mode='quote_only' or i.price_amount is not null or exists(select 1 from public.angelcare_marketplace_finance_price_rules p where p.catalog_item_id=i.id and p.status='active')) as has_price,
    (i.availability_status in('available','configuration_required') or exists(select 1 from public.angelcare_marketplace_catalog_availability a where a.catalog_item_id=i.id and a.available=true)) as has_availability
  from public.angelcare_marketplace_catalog_items i
  where i.status='published'
)
select
  (select count(*)::int from item_readiness) as published_items,
  (select count(*)::int from item_readiness where has_media) as items_with_media,
  (select count(*)::int from item_readiness where has_category) as items_with_category,
  (select count(*)::int from item_readiness where has_price) as items_with_price,
  (select count(*)::int from item_readiness where has_availability) as items_with_availability,
  (select count(*)::int from public.angelcare_marketplace_homepage_sections where status in('active','published','scheduled') and visible=true) as active_homepage_sections,
  (select count(*)::int from public.angelcare_marketplace_cms_menu_items where status='active') as active_navigation_items,
  (select count(*)::int from public.angelcare_marketplace_homepage_placements where status='active') as active_merchandising_placements,
  (select count(*)::int from public.angelcare_marketplace_media_assets where status='active') as active_media_assets,
  (select count(*)::int from public.angelcare_marketplace_catalog_categories where status='published' and visible=true) as published_categories,
  (select count(*)::int from public.angelcare_marketplace_homepage_collections where status in('active','scheduled')) as active_collections,
  ((select count(*) from item_readiness) > 0
    and not exists(select 1 from item_readiness where not(has_media and has_category and has_price and has_availability))
    and exists(select 1 from public.angelcare_marketplace_homepage_sections where status in('active','published','scheduled') and visible=true)
    and exists(select 1 from public.angelcare_marketplace_cms_menu_items where status='active')
    and exists(select 1 from public.angelcare_marketplace_media_assets where status='active')
  ) as ready_for_activation;

alter table public.angelcare_marketplace_activation_runs enable row level security;
alter table public.angelcare_marketplace_activation_checks enable row level security;
alter table public.angelcare_marketplace_activation_evidence enable row level security;
revoke all on public.angelcare_marketplace_activation_runs from anon,authenticated;
revoke all on public.angelcare_marketplace_activation_checks from anon,authenticated;
revoke all on public.angelcare_marketplace_activation_evidence from anon,authenticated;
grant all on public.angelcare_marketplace_activation_runs to service_role;
grant all on public.angelcare_marketplace_activation_checks to service_role;
grant all on public.angelcare_marketplace_activation_evidence to service_role;
grant select on public.angelcare_marketplace_activation_readiness_v to service_role;

commit;
select 'production_activation_acceptance_applied' as result,
  (select count(*) from public.angelcare_marketplace_activation_runs) as activation_runs;
