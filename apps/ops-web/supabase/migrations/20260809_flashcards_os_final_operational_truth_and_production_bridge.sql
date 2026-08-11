-- ANGELCARE Flashcards OS 2030
-- Mega Final Operational Truth, Production Bridge, Vault & Commercial Excellence
-- Additive / idempotent / no destructive table drop.
begin;
select pg_advisory_xact_lock(84747009);

create extension if not exists pgcrypto;
create schema if not exists flashcards_os;

do $$ begin
 if to_regclass('flashcards_os.catalogue_collection_commercials') is null then raise exception 'Flashcards catalogue commercial baseline missing.'; end if;
 if to_regclass('flashcards_os.b2c_sellables') is null or to_regclass('flashcards_os.b2b_sellables') is null then raise exception 'Flashcards sellable baseline missing.'; end if;
 if to_regclass('flashcards_os.production_commands') is null or to_regclass('flashcards_os.product_releases') is null then raise exception 'Flashcards production baseline missing.'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Commercial truth: historical catalogue evidence is never active authority
-- ---------------------------------------------------------------------------
alter table flashcards_os.catalogue_collection_commercials add column if not exists tax_percent numeric(8,3) not null default 0 check(tax_percent>=0 and tax_percent<=100);
alter table flashcards_os.catalogue_collection_commercials add column if not exists volume_tiers jsonb not null default '[]'::jsonb;
alter table flashcards_os.catalogue_collection_commercials add column if not exists authority_source text not null default 'operator_confirmed';
alter table flashcards_os.catalogue_collection_commercials add column if not exists confirmed_at timestamptz null;
alter table flashcards_os.catalogue_collection_commercials add column if not exists confirmed_by text null;

do $$ begin
 if not exists(select 1 from pg_constraint where conname='catalogue_collection_commercials_authority_source_check') then
  alter table flashcards_os.catalogue_collection_commercials add constraint catalogue_collection_commercials_authority_source_check
   check(authority_source in('operator_confirmed','historical_seed','imported_confirmed','system_migration'));
 end if;
end $$;

-- Rows seeded by the 20260802 rescue remain preserved but are demoted to draft
-- unless an operator has explicitly confirmed them since.
update flashcards_os.catalogue_collection_commercials
set status='draft',
    authority_source='historical_seed',
    confirmed_at=null,
    confirmed_by=null,
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('commercial_authority','historical_reference_only'),
    updated_at=now()
where coalesce(metadata->>'seed_source','')='collections.historical_price_dh'
  and confirmed_at is null
  and coalesce(confirmed_by,'')='';

-- ---------------------------------------------------------------------------
-- 2. Direct collection sellables become a first-class composition source
-- ---------------------------------------------------------------------------
alter table flashcards_os.b2c_sellables add column if not exists direct_collection_id text null references flashcards_os.collections(id) on update cascade on delete restrict;
alter table flashcards_os.b2b_sellables add column if not exists direct_collection_id text null references flashcards_os.collections(id) on update cascade on delete restrict;
alter table flashcards_os.b2c_sellables add column if not exists direct_collection_version_id uuid null references flashcards_os.collection_versions(id) on update cascade on delete restrict;
alter table flashcards_os.b2b_sellables add column if not exists direct_collection_version_id uuid null references flashcards_os.collection_versions(id) on update cascade on delete restrict;

alter table flashcards_os.b2c_sellables drop constraint if exists b2c_sellables_one_composition_source_check;
alter table flashcards_os.b2b_sellables drop constraint if exists b2b_sellables_one_composition_source_check;

do $$ begin
 if not exists(select 1 from pg_constraint where conname='b2c_sellables_one_composition_source_v2_check') then
  alter table flashcards_os.b2c_sellables add constraint b2c_sellables_one_composition_source_v2_check check(
   (case when scenario_id is not null then 1 else 0 end)+
   (case when journey_scenario_id is not null then 1 else 0 end)+
   (case when direct_collection_id is not null then 1 else 0 end)=1
  );
 end if;
 if not exists(select 1 from pg_constraint where conname='b2b_sellables_one_composition_source_v2_check') then
  alter table flashcards_os.b2b_sellables add constraint b2b_sellables_one_composition_source_v2_check check(
   (case when scenario_id is not null then 1 else 0 end)+
   (case when journey_scenario_id is not null then 1 else 0 end)+
   (case when direct_collection_id is not null then 1 else 0 end)=1
  );
 end if;
end $$;

create unique index if not exists uq_fc_b2c_direct_collection_version on flashcards_os.b2c_sellables(tenant_key,direct_collection_id,version_no) where direct_collection_id is not null;
create unique index if not exists uq_fc_b2b_direct_collection_version on flashcards_os.b2b_sellables(tenant_key,direct_collection_id,version_no) where direct_collection_id is not null;

-- Published sellables keep immutable composition/commercial truth, while an
-- authoritative release may be appended later without rewriting the product.
create or replace function flashcards_os.guard_published_solution_mutation() returns trigger language plpgsql as $$
begin
 if old.status='published' and (
   new.scenario_id is distinct from old.scenario_id or
   new.journey_scenario_id is distinct from old.journey_scenario_id or
   new.direct_collection_id is distinct from old.direct_collection_id or
   new.direct_collection_version_id is distinct from old.direct_collection_version_id or
   new.collection_ids is distinct from old.collection_ids or
   new.collection_version_ids is distinct from old.collection_version_ids or
   new.price_dh is distinct from old.price_dh or
   new.snapshot is distinct from old.snapshot
 ) then raise exception 'Published sellable composition is immutable; create a new version.'; end if;
 if old.status='published' and not (coalesce(new.release_ids,'{}'::uuid[]) @> coalesce(old.release_ids,'{}'::uuid[])) then
   raise exception 'Published sellable release lineage may only append releases; it cannot remove historical release references.';
 end if;
 return new;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Universal production source lineage
-- ---------------------------------------------------------------------------
alter table flashcards_os.production_commands alter column collection_id drop not null;
alter table flashcards_os.production_commands alter column design_id drop not null;
alter table flashcards_os.production_commands add column if not exists source_type text;
alter table flashcards_os.production_commands add column if not exists source_id text;
alter table flashcards_os.production_commands add column if not exists source_label text not null default '';
alter table flashcards_os.production_commands add column if not exists source_snapshot jsonb not null default '{}'::jsonb;
alter table flashcards_os.production_commands add column if not exists collection_ids text[] not null default '{}';
alter table flashcards_os.production_commands add column if not exists collection_version_ids uuid[] not null default '{}';

update flashcards_os.production_commands
set source_type=coalesce(source_type,'product_design'),
    source_id=coalesce(source_id,design_id::text,collection_id),
    source_label=case when source_label='' then coalesce(title,code) else source_label end,
    collection_ids=case when coalesce(array_length(collection_ids,1),0)=0 and collection_id is not null then array[collection_id] else collection_ids end
where source_type is null or source_id is null or source_label='' or coalesce(array_length(collection_ids,1),0)=0;

alter table flashcards_os.production_commands alter column source_type set not null;
alter table flashcards_os.production_commands alter column source_id set not null;

do $$ begin
 if not exists(select 1 from pg_constraint where conname='production_commands_source_type_check') then
  alter table flashcards_os.production_commands add constraint production_commands_source_type_check check(source_type in('collection','package_scenario','journey_scenario','ready_learning_plan','b2c_sellable','b2b_sellable','product_design'));
 end if;
 if not exists(select 1 from pg_constraint where conname='production_commands_design_source_check') then
  alter table flashcards_os.production_commands add constraint production_commands_design_source_check check((source_type='product_design' and design_id is not null) or source_type<>'product_design');
 end if;
end $$;
create index if not exists idx_fc_production_commands_source on flashcards_os.production_commands(tenant_key,source_type,source_id);
create index if not exists idx_fc_production_commands_collection_ids on flashcards_os.production_commands using gin(collection_ids);

-- Jobs, uploads and asset entities inherit generic source lineage while keeping
-- existing collection-centric rows valid.
alter table flashcards_os.external_production_jobs alter column collection_id drop not null;
alter table flashcards_os.external_production_jobs add column if not exists source_type text;
alter table flashcards_os.external_production_jobs add column if not exists source_id text;
alter table flashcards_os.external_production_jobs add column if not exists source_snapshot jsonb not null default '{}'::jsonb;

alter table flashcards_os.upload_sessions add column if not exists source_type text;
alter table flashcards_os.upload_sessions add column if not exists source_id text;
alter table flashcards_os.upload_sessions add column if not exists source_snapshot jsonb not null default '{}'::jsonb;

alter table flashcards_os.storage_objects add column if not exists source_type text;
alter table flashcards_os.storage_objects add column if not exists source_id text;
alter table flashcards_os.storage_objects add column if not exists source_snapshot jsonb not null default '{}'::jsonb;

alter table flashcards_os.source_packages alter column collection_id drop not null;
alter table flashcards_os.source_packages add column if not exists source_type text;
alter table flashcards_os.source_packages add column if not exists source_id text;
alter table flashcards_os.source_packages add column if not exists source_snapshot jsonb not null default '{}'::jsonb;

alter table flashcards_os.deliverables alter column collection_id drop not null;
alter table flashcards_os.deliverables add column if not exists source_type text;
alter table flashcards_os.deliverables add column if not exists source_id text;
alter table flashcards_os.deliverables add column if not exists source_snapshot jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 4. Generic product-release lineage
-- ---------------------------------------------------------------------------
alter table flashcards_os.product_releases alter column collection_id drop not null;
alter table flashcards_os.product_releases alter column design_id drop not null;
alter table flashcards_os.product_releases add column if not exists source_type text;
alter table flashcards_os.product_releases add column if not exists source_id text;
alter table flashcards_os.product_releases add column if not exists source_label text not null default '';
alter table flashcards_os.product_releases add column if not exists source_snapshot jsonb not null default '{}'::jsonb;
alter table flashcards_os.product_releases add column if not exists collection_ids text[] not null default '{}';
alter table flashcards_os.product_releases add column if not exists collection_version_ids uuid[] not null default '{}';

update flashcards_os.product_releases
set source_type=coalesce(source_type,'product_design'),
    source_id=coalesce(source_id,design_id::text,collection_id),
    source_label=case when source_label='' then coalesce(code,'Legacy release') else source_label end,
    collection_ids=case when coalesce(array_length(collection_ids,1),0)=0 and collection_id is not null then array[collection_id] else collection_ids end
where source_type is null or source_id is null or source_label='' or coalesce(array_length(collection_ids,1),0)=0;

alter table flashcards_os.product_releases alter column source_type set not null;
alter table flashcards_os.product_releases alter column source_id set not null;

do $$ begin
 if not exists(select 1 from pg_constraint where conname='product_releases_source_type_check') then
  alter table flashcards_os.product_releases add constraint product_releases_source_type_check check(source_type in('collection','package_scenario','journey_scenario','ready_learning_plan','b2c_sellable','b2b_sellable','product_design'));
 end if;
end $$;
create index if not exists idx_fc_product_releases_source on flashcards_os.product_releases(tenant_key,source_type,source_id);
create index if not exists idx_fc_product_releases_collection_ids on flashcards_os.product_releases using gin(collection_ids);

create or replace function flashcards_os.guard_released_asset_mutation() returns trigger language plpgsql as $$
begin
 if old.status in ('released','commercially_active','superseded','retired','archived') and (
    new.command_id is distinct from old.command_id or
    new.source_package_id is distinct from old.source_package_id or
    new.deliverable_ids is distinct from old.deliverable_ids or
    new.collection_version is distinct from old.collection_version or
    new.source_type is distinct from old.source_type or
    new.source_id is distinct from old.source_id or
    new.source_snapshot is distinct from old.source_snapshot or
    new.collection_ids is distinct from old.collection_ids or
    new.collection_version_ids is distinct from old.collection_version_ids
 ) then raise exception 'Released product composition is immutable; create a new release version.';
 end if;
 return new;
end $$;

drop trigger if exists trg_fc_product_release_immutable on flashcards_os.product_releases;
create trigger trg_fc_product_release_immutable before update on flashcards_os.product_releases for each row execute function flashcards_os.guard_released_asset_mutation();

-- ---------------------------------------------------------------------------
-- 5. Service-role mutation/read views refreshed after additive columns
-- ---------------------------------------------------------------------------
create or replace view public.fc_os_catalogue_collection_commercials as select * from flashcards_os.catalogue_collection_commercials;
create or replace view public.fc_os_b2c_sellables as select * from flashcards_os.b2c_sellables;
create or replace view public.fc_os_b2b_sellables as select * from flashcards_os.b2b_sellables;
create or replace view public.fc_os_production_commands as
 select c.*,coalesce(col.code,'') collection_code,coalesce(col.name,c.source_label,'Production source') collection_name,coalesce(d.code,'') design_code
 from flashcards_os.production_commands c
 left join flashcards_os.collections col on col.id::text=c.collection_id
 left join flashcards_os.product_designs d on d.id=c.design_id;
create or replace view public.fc_os_external_production_jobs as select j.*,coalesce(col.name,'Multi-source production') collection_name from flashcards_os.external_production_jobs j left join flashcards_os.collections col on col.id::text=j.collection_id;
create or replace view public.fc_os_upload_sessions as select * from flashcards_os.upload_sessions;
create or replace view public.fc_os_storage_objects as select o.*,coalesce(c.name,'Multi-source asset') collection_name from flashcards_os.storage_objects o left join flashcards_os.collections c on c.id::text=o.collection_id;
create or replace view public.fc_os_source_packages as select p.*,coalesce(c.name,'Multi-source package') collection_name from flashcards_os.source_packages p left join flashcards_os.collections c on c.id::text=p.collection_id;
create or replace view public.fc_os_deliverables as select d.*,coalesce(c.name,'Multi-source deliverable') collection_name from flashcards_os.deliverables d left join flashcards_os.collections c on c.id::text=d.collection_id;
create or replace view public.fc_os_product_releases as select r.*,coalesce(c.name,r.source_label,'Multi-source release') collection_name from flashcards_os.product_releases r left join flashcards_os.collections c on c.id::text=r.collection_id;

-- Preserve service-role-only mutation boundary.
do $$ declare v text; begin
 foreach v in array array['catalogue_collection_commercials','b2c_sellables','b2b_sellables','production_commands','external_production_jobs','upload_sessions','storage_objects','source_packages','deliverables','product_releases'] loop
  execute format('revoke all on public.fc_os_%I from authenticated, anon',v);
  execute format('grant all on public.fc_os_%I to service_role',v);
 end loop;
end $$;

commit;
