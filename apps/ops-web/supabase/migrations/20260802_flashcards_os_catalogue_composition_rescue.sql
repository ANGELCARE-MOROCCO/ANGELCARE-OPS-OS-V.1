-- ANGELCARE Flashcards OS — Catalogue Composition Rescue Patch
-- Corrects the operating centre: registered local categories and collections become
-- the sole composition truth for packages and learning programmes.
begin;
select pg_advisory_xact_lock(84747001);
create extension if not exists pgcrypto;
create schema if not exists flashcards_os;

do $$ begin
 if to_regclass('flashcards_os.collections') is null or to_regclass('flashcards_os.categories') is null then
  raise exception 'Flashcards catalogue baseline missing: collections/categories are required.';
 end if;
 if to_regclass('flashcards_os.solution_requests') is null or to_regclass('flashcards_os.journey_requests') is null then
  raise exception 'Flashcards UMZ4 solution baseline missing.';
 end if;
end $$;

-- Collection-level commercial truth. This is independent from Product Vault and production releases.
create table if not exists flashcards_os.catalogue_collection_commercials (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
 universe text not null check (universe in ('b2c','b2b')),
 base_price_dh numeric(14,2) null check (base_price_dh is null or base_price_dh >= 0),
 unit_cost_dh numeric(14,2) null check (unit_cost_dh is null or unit_cost_dh >= 0),
 minimum_quantity integer not null default 1 check (minimum_quantity > 0),
 status text not null default 'draft' check (status in ('draft','active','inactive')),
 effective_from date not null default current_date,
 effective_until date null,
 metadata jsonb not null default '{}'::jsonb,
 created_by text null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (tenant_key, collection_id, universe)
);

insert into flashcards_os.catalogue_collection_commercials
 (tenant_key,collection_id,universe,base_price_dh,status,metadata)
select c.tenant_key,c.id,u.universe,c.historical_price_dh,
 case when coalesce(c.historical_price_dh,0)>0 then 'active' else 'draft' end,
 jsonb_build_object('seed_source','collections.historical_price_dh','source_doctrine','local_catalogue_only')
from flashcards_os.collections c
cross join (values ('b2c'),('b2b')) as u(universe)
on conflict (tenant_key,collection_id,universe) do nothing;

-- Existing request/scenario tables gain an additive catalogue composition path.
alter table flashcards_os.solution_requests add column if not exists composition_source text not null default 'release';
alter table flashcards_os.solution_requests add column if not exists catalogue_collection_ids text[] not null default '{}';
alter table flashcards_os.solution_scenarios add column if not exists composition_source text not null default 'release';
alter table flashcards_os.solution_scenarios add column if not exists collection_ids text[] not null default '{}';
alter table flashcards_os.solution_scenarios add column if not exists collection_version_ids uuid[] not null default '{}';

alter table flashcards_os.journey_requests add column if not exists composition_source text not null default 'release';
alter table flashcards_os.journey_requests add column if not exists available_collection_ids text[] not null default '{}';
alter table flashcards_os.journey_requests add column if not exists required_collection_ids text[] not null default '{}';
alter table flashcards_os.journey_requests add column if not exists excluded_collection_ids text[] not null default '{}';
alter table flashcards_os.journey_requests drop constraint if exists journey_requests_maximum_collections_check;
alter table flashcards_os.journey_requests add constraint journey_requests_maximum_collections_check check (maximum_collections between 1 and 24);
alter table flashcards_os.journey_scenarios add column if not exists composition_source text not null default 'release';
alter table flashcards_os.journey_scenarios add column if not exists collection_ids text[] not null default '{}';
alter table flashcards_os.journey_scenarios add column if not exists collection_version_ids uuid[] not null default '{}';
alter table flashcards_os.ready_learning_plans add column if not exists collection_ids text[] not null default '{}';
alter table flashcards_os.ready_learning_plans add column if not exists collection_version_ids uuid[] not null default '{}';
alter table flashcards_os.ready_learning_plans add column if not exists catalogue_snapshot jsonb not null default '{}'::jsonb;

-- A journey can now be published directly into the governed B2C/B2B vitrine.
alter table flashcards_os.b2c_sellables alter column scenario_id drop not null;
alter table flashcards_os.b2b_sellables alter column scenario_id drop not null;
alter table flashcards_os.b2c_sellables add column if not exists journey_scenario_id uuid null references flashcards_os.journey_scenarios(id) on delete restrict;
alter table flashcards_os.b2b_sellables add column if not exists journey_scenario_id uuid null references flashcards_os.journey_scenarios(id) on delete restrict;
alter table flashcards_os.b2c_sellables add column if not exists collection_ids text[] not null default '{}';
alter table flashcards_os.b2b_sellables add column if not exists collection_ids text[] not null default '{}';
alter table flashcards_os.b2c_sellables add column if not exists collection_version_ids uuid[] not null default '{}';
alter table flashcards_os.b2b_sellables add column if not exists collection_version_ids uuid[] not null default '{}';

do $$ begin
 if not exists(select 1 from pg_constraint where conname='b2c_sellables_one_composition_source_check') then
  alter table flashcards_os.b2c_sellables add constraint b2c_sellables_one_composition_source_check
  check ((scenario_id is not null and journey_scenario_id is null) or (scenario_id is null and journey_scenario_id is not null));
 end if;
 if not exists(select 1 from pg_constraint where conname='b2b_sellables_one_composition_source_check') then
  alter table flashcards_os.b2b_sellables add constraint b2b_sellables_one_composition_source_check
  check ((scenario_id is not null and journey_scenario_id is null) or (scenario_id is null and journey_scenario_id is not null));
 end if;
end $$;
create unique index if not exists uq_fc_b2c_sellable_journey_version on flashcards_os.b2c_sellables(tenant_key,journey_scenario_id,version_no) where journey_scenario_id is not null;
create unique index if not exists uq_fc_b2b_sellable_journey_version on flashcards_os.b2b_sellables(tenant_key,journey_scenario_id,version_no) where journey_scenario_id is not null;

-- Exact local catalogue lineage for every proposal and published sellable.
create table if not exists flashcards_os.catalogue_solution_items (
 id uuid primary key default gen_random_uuid(), tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.solution_scenarios(id) on delete restrict,
 collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
 collection_version_id uuid null references flashcards_os.collection_versions(id) on delete restrict,
 collection_version_label text not null,
 quantity integer not null default 1 check(quantity>0), format text not null default 'physical',
 rationale text not null, usage_order integer not null default 1, sort_order integer not null default 1,
 created_at timestamptz not null default now(), unique(tenant_key,scenario_id,collection_id)
);
create table if not exists flashcards_os.catalogue_journey_items (
 id uuid primary key default gen_random_uuid(), tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict,
 collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
 collection_version_id uuid null references flashcards_os.collection_versions(id) on delete restrict,
 collection_version_label text not null, sort_order integer not null default 1,
 created_at timestamptz not null default now(), unique(tenant_key,scenario_id,collection_id)
);
create table if not exists flashcards_os.catalogue_journey_activity_links (
 id uuid primary key default gen_random_uuid(), tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict,
 day_number integer not null check(day_number>0), session_number integer not null check(session_number>0), activity_order integer not null check(activity_order>0),
 collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
 collection_version_id uuid null references flashcards_os.collection_versions(id) on delete restrict,
 collection_version_label text not null, card_reference text not null default '',
 created_at timestamptz not null default now(), unique(tenant_key,scenario_id,day_number,session_number,activity_order)
);
create table if not exists flashcards_os.catalogue_sellable_items (
 id uuid primary key default gen_random_uuid(), tenant_key text not null default 'angelcare-internal',
 b2c_sellable_id uuid null references flashcards_os.b2c_sellables(id) on delete restrict,
 b2b_sellable_id uuid null references flashcards_os.b2b_sellables(id) on delete restrict,
 collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
 collection_version_id uuid null references flashcards_os.collection_versions(id) on delete restrict,
 collection_version_label text not null, quantity integer not null default 1 check(quantity>0), sort_order integer not null default 1,
 created_at timestamptz not null default now(),
 constraint catalogue_sellable_items_one_owner_check check ((b2c_sellable_id is not null and b2b_sellable_id is null) or (b2c_sellable_id is null and b2b_sellable_id is not null))
);
create unique index if not exists uq_fc_catalogue_sellable_b2c_item on flashcards_os.catalogue_sellable_items(tenant_key,b2c_sellable_id,collection_id) where b2c_sellable_id is not null;
create unique index if not exists uq_fc_catalogue_sellable_b2b_item on flashcards_os.catalogue_sellable_items(tenant_key,b2b_sellable_id,collection_id) where b2b_sellable_id is not null;

-- Updated-at and immutable publication rules now include catalogue lineage.
drop trigger if exists trg_fc_catalogue_collection_commercials_updated_at on flashcards_os.catalogue_collection_commercials;
create trigger trg_fc_catalogue_collection_commercials_updated_at before update on flashcards_os.catalogue_collection_commercials for each row execute function flashcards_os.touch_updated_at();

create or replace function flashcards_os.guard_published_solution_mutation() returns trigger language plpgsql as $$
begin
 if old.status='published' and (
   new.scenario_id is distinct from old.scenario_id or
   new.journey_scenario_id is distinct from old.journey_scenario_id or
   new.release_ids is distinct from old.release_ids or
   new.collection_ids is distinct from old.collection_ids or
   new.collection_version_ids is distinct from old.collection_version_ids or
   new.price_dh is distinct from old.price_dh or
   new.snapshot is distinct from old.snapshot
 ) then raise exception 'Published sellables are immutable; create a new version.'; end if;
 return new;
end $$;

create or replace function flashcards_os.guard_published_plan_mutation() returns trigger language plpgsql as $$
begin
 if old.status='published' and (
   new.scenario_id is distinct from old.scenario_id or
   new.release_ids is distinct from old.release_ids or
   new.collection_ids is distinct from old.collection_ids or
   new.collection_version_ids is distinct from old.collection_version_ids or
   new.catalogue_snapshot is distinct from old.catalogue_snapshot or
   new.price_dh is distinct from old.price_dh or
   new.objectives is distinct from old.objectives
 ) then raise exception 'Published learning plans are immutable; create a new version.'; end if;
 return new;
end $$;

-- Tenant isolation.
do $$ declare t text; begin
 foreach t in array array['catalogue_collection_commercials','catalogue_solution_items','catalogue_journey_items','catalogue_journey_activity_links','catalogue_sellable_items'] loop
  execute format('alter table flashcards_os.%I enable row level security',t);
  execute format('drop policy if exists tenant_read on flashcards_os.%I',t);
  execute format('create policy tenant_read on flashcards_os.%I for select to authenticated using (tenant_key=coalesce(auth.jwt()->>''tenant_key'',''''))',t);
 end loop;
end $$;

-- Recreate established public views so additive catalogue columns are visible to the server repository.
create or replace view public.fc_os_solution_requests as select * from flashcards_os.solution_requests;
create or replace view public.fc_os_solution_scenarios as select * from flashcards_os.solution_scenarios;
create or replace view public.fc_os_journey_requests as select * from flashcards_os.journey_requests;
create or replace view public.fc_os_journey_scenarios as select * from flashcards_os.journey_scenarios;
create or replace view public.fc_os_ready_learning_plans as select * from flashcards_os.ready_learning_plans;
create or replace view public.fc_os_b2c_sellables as select * from flashcards_os.b2c_sellables;
create or replace view public.fc_os_b2b_sellables as select * from flashcards_os.b2b_sellables;

-- Simple public operational views preserve the established server repository contract.
create or replace view public.fc_os_catalogue_collection_commercials as select * from flashcards_os.catalogue_collection_commercials;
create or replace view public.fc_os_catalogue_solution_items as select * from flashcards_os.catalogue_solution_items;
create or replace view public.fc_os_catalogue_journey_items as select * from flashcards_os.catalogue_journey_items;
create or replace view public.fc_os_catalogue_journey_activity_links as select * from flashcards_os.catalogue_journey_activity_links;
create or replace view public.fc_os_catalogue_sellable_items as select * from flashcards_os.catalogue_sellable_items;

revoke all on public.fc_os_catalogue_collection_commercials, public.fc_os_catalogue_solution_items, public.fc_os_catalogue_journey_items, public.fc_os_catalogue_journey_activity_links, public.fc_os_catalogue_sellable_items from authenticated, anon;
grant all on public.fc_os_catalogue_collection_commercials, public.fc_os_catalogue_solution_items, public.fc_os_catalogue_journey_items, public.fc_os_catalogue_journey_activity_links, public.fc_os_catalogue_sellable_items to service_role;
grant all on flashcards_os.catalogue_collection_commercials, flashcards_os.catalogue_solution_items, flashcards_os.catalogue_journey_items, flashcards_os.catalogue_journey_activity_links, flashcards_os.catalogue_sellable_items to service_role;

-- Align the visible AI profiles to the corrected catalogue doctrine.
update flashcards_os.model_profiles set
 purpose='Composition de packages B2C/B2B exclusivement à partir des catégories, collections, versions et prix du catalogue local.',
 allowed_data_classes=array['local_catalogue_categories','local_catalogue_collections','local_collection_versions','commercial_rules'],
 updated_at=now()
where tenant_key='angelcare-internal' and profile_key='flashcards_solution_composer';
update flashcards_os.model_profiles set
 purpose='Architecture détaillée de programmes jour/session exclusivement à partir des collections et versions du catalogue local.',
 allowed_data_classes=array['local_catalogue_collections','local_collection_versions','learning_objectives'],
 updated_at=now()
where tenant_key='angelcare-internal' and profile_key='flashcards_learning_journey_architect';

commit;
