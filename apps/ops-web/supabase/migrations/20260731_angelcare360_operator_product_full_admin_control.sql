-- AngelCare 360 Operator — Product Full Administrator Control
-- Additive correction: direct administration, automatic revision history,
-- change scopes and removal/migration governance without seeded/published locks.

begin;

alter table public.angelcare360_operator_product_modules
  add column if not exists is_seeded boolean not null default false,
  add column if not exists seed_source text;
alter table public.angelcare360_operator_product_features
  add column if not exists is_seeded boolean not null default false,
  add column if not exists seed_source text;
alter table public.angelcare360_operator_product_addons
  add column if not exists is_seeded boolean not null default false,
  add column if not exists seed_source text;
alter table public.angelcare360_operator_product_meters
  add column if not exists is_seeded boolean not null default false,
  add column if not exists seed_source text;
alter table public.angelcare360_operator_package_versions
  add column if not exists is_seeded boolean not null default false,
  add column if not exists seed_source text;
alter table public.angelcare360_operator_price_books
  add column if not exists is_seeded boolean not null default false,
  add column if not exists seed_source text;

-- Mark only the canonical records delivered by the original kernel seed.
update public.angelcare360_operator_product_modules
set is_seeded = true, seed_source = coalesce(seed_source, 'angelcare360-canonical-kernel')
where module_key in ('administration','people','admissions','attendance','academics','finance','payroll','transport','library','inventory','communications','reports')
  and version = '1.0.0';

update public.angelcare360_operator_product_features
set is_seeded = true, seed_source = coalesce(seed_source, 'angelcare360-canonical-kernel')
where evidence @> '[{"source":"canonical-seed"}]'::jsonb;

update public.angelcare360_operator_product_addons
set is_seeded = true, seed_source = coalesce(seed_source, 'angelcare360-canonical-kernel')
where addon_code in ('ADDITIONAL_SITE','EXTRA_100_STUDENTS','PREMIUM_SUPPORT','DATA_MIGRATION','DEDICATED_ONBOARDING','ADVANCED_REPORTING');

update public.angelcare360_operator_product_meters
set is_seeded = true, seed_source = coalesce(seed_source, 'angelcare360-canonical-kernel')
where meter_key in ('students','staff','users','institutions','storage_gb','messages_monthly','vehicles','support_hours');

update public.angelcare360_operator_package_versions
set is_seeded = true, seed_source = coalesce(seed_source, 'angelcare360-canonical-kernel')
where version_code in ('ESSENTIAL-MA-V1','PROFESSIONAL-MA-V1','ENTERPRISE-MA-V1');

update public.angelcare360_operator_price_books
set is_seeded = true, seed_source = coalesce(seed_source, 'angelcare360-canonical-kernel')
where price_book_code = 'MA-STANDARD-2026';

create table if not exists public.angelcare360_operator_product_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  revision_number integer not null,
  operation text not null,
  change_scope text not null default 'catalogue_only',
  effective_at timestamptz,
  reason text,
  before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb,
  impact_data jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, revision_number),
  check (change_scope in ('catalogue_only','new_sales_only','selected_subscriptions','existing_at_renewal','all_active_subscriptions','scheduled','immediate_authorized'))
);

create index if not exists ac360_product_revisions_entity_idx
  on public.angelcare360_operator_product_revisions(entity_type, entity_id, revision_number desc);

create table if not exists public.angelcare360_operator_product_change_jobs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  operation text not null,
  change_scope text not null,
  selected_subscription_ids uuid[] not null default '{}',
  effective_at timestamptz,
  status text not null default 'scheduled',
  reason text,
  impact_data jsonb not null default '{}'::jsonb,
  result_data jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (change_scope in ('catalogue_only','new_sales_only','selected_subscriptions','existing_at_renewal','all_active_subscriptions','scheduled','immediate_authorized')),
  check (status in ('draft','scheduled','executing','executed','partial','failed','cancelled'))
);

create index if not exists ac360_product_change_jobs_entity_idx
  on public.angelcare360_operator_product_change_jobs(entity_type, entity_id, created_at desc);
create index if not exists ac360_product_change_jobs_status_idx
  on public.angelcare360_operator_product_change_jobs(status, effective_at);

alter table public.angelcare360_operator_product_revisions enable row level security;
alter table public.angelcare360_operator_product_change_jobs enable row level security;

revoke all on public.angelcare360_operator_product_revisions from anon, authenticated;
revoke all on public.angelcare360_operator_product_change_jobs from anon, authenticated;
grant all on public.angelcare360_operator_product_revisions to service_role;
grant all on public.angelcare360_operator_product_change_jobs to service_role;

comment on table public.angelcare360_operator_product_revisions is
  'Automatic before/after history for direct administrator edits of Product Kernel objects.';
comment on table public.angelcare360_operator_product_change_jobs is
  'Scheduled or scoped synchronization jobs created by administrator product changes.';

create or replace function public.angelcare360_operator_replace_product_entity(
  p_kind text,
  p_source_id uuid,
  p_replacement_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package_items integer := 0;
  v_dependencies integer := 0;
  v_related integer := 0;
  v_step_count integer := 0;
begin
  if p_kind not in ('module','feature','addon','meter') then
    raise exception 'Unsupported Product Kernel type: %', p_kind;
  end if;
  if p_source_id = p_replacement_id then
    raise exception 'Source and replacement must differ';
  end if;

  insert into public.angelcare360_operator_package_version_items (
    package_version_id, item_type, item_id, inclusion_type, quantity,
    configuration, sort_order, created_at, updated_at
  )
  select package_version_id, item_type, p_replacement_id, inclusion_type,
         quantity, configuration, sort_order, created_at, now()
  from public.angelcare360_operator_package_version_items
  where item_type = p_kind and item_id = p_source_id
  on conflict (package_version_id, item_type, item_id)
  do update set
    inclusion_type = excluded.inclusion_type,
    quantity = coalesce(excluded.quantity, public.angelcare360_operator_package_version_items.quantity),
    configuration = public.angelcare360_operator_package_version_items.configuration || excluded.configuration,
    sort_order = least(public.angelcare360_operator_package_version_items.sort_order, excluded.sort_order),
    updated_at = now();
  get diagnostics v_package_items = row_count;

  delete from public.angelcare360_operator_package_version_items
  where item_type = p_kind and item_id = p_source_id;

  insert into public.angelcare360_operator_product_dependencies (
    source_type, source_id, target_type, target_id, relation_type,
    required_state, reason, created_at
  )
  select source_type, p_replacement_id, target_type, target_id,
         relation_type, required_state, reason, created_at
  from public.angelcare360_operator_product_dependencies
  where source_type = p_kind and source_id = p_source_id
    and not (target_type = p_kind and target_id = p_replacement_id)
  on conflict (source_type, source_id, target_type, target_id, relation_type)
  do nothing;
  get diagnostics v_dependencies = row_count;

  insert into public.angelcare360_operator_product_dependencies (
    source_type, source_id, target_type, target_id, relation_type,
    required_state, reason, created_at
  )
  select source_type, source_id, target_type, p_replacement_id,
         relation_type, required_state, reason, created_at
  from public.angelcare360_operator_product_dependencies
  where target_type = p_kind and target_id = p_source_id
    and not (source_type = p_kind and source_id = p_replacement_id)
  on conflict (source_type, source_id, target_type, target_id, relation_type)
  do nothing;
  get diagnostics v_related = row_count;
  v_dependencies := v_dependencies + v_related;

  delete from public.angelcare360_operator_product_dependencies
  where (source_type = p_kind and source_id = p_source_id)
     or (target_type = p_kind and target_id = p_source_id);

  if p_kind = 'module' then
    update public.angelcare360_operator_product_features
      set module_id = p_replacement_id, updated_at = now()
      where module_id = p_source_id;
    get diagnostics v_related = row_count;
    update public.angelcare360_operator_product_addons
      set module_id = p_replacement_id, updated_at = now()
      where module_id = p_source_id;
    get diagnostics v_step_count = row_count;
    v_related := v_related + v_step_count;
  elsif p_kind = 'feature' then
    update public.angelcare360_operator_product_addons
      set feature_id = p_replacement_id, updated_at = now()
      where feature_id = p_source_id;
    get diagnostics v_related = row_count;
  elsif p_kind = 'addon' then
    insert into public.angelcare360_operator_subscription_addons (
      subscription_id, addon_id, status, quantity, unit_price,
      start_date, end_date, notes, created_at, updated_at
    )
    select subscription_id, p_replacement_id, status, quantity, unit_price,
           start_date, end_date, notes, created_at, now()
    from public.angelcare360_operator_subscription_addons
    where addon_id = p_source_id
    on conflict (subscription_id, addon_id, start_date)
    do update set
      status = excluded.status,
      quantity = excluded.quantity,
      unit_price = excluded.unit_price,
      end_date = excluded.end_date,
      notes = excluded.notes,
      updated_at = now();
    delete from public.angelcare360_operator_subscription_addons
      where addon_id = p_source_id;
  elsif p_kind = 'meter' then
    update public.angelcare360_operator_capacity_topups
      set meter_id = p_replacement_id, updated_at = now()
      where meter_id = p_source_id;
    get diagnostics v_related = row_count;
  end if;

  return jsonb_build_object(
    'package_items_migrated', v_package_items,
    'dependencies_migrated', v_dependencies,
    'related_records_migrated', v_related
  );
end;
$$;

create or replace function public.angelcare360_operator_replace_package_version(
  p_source_id uuid,
  p_replacement_id uuid
) returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
begin
  if p_source_id = p_replacement_id then
    raise exception 'Source and replacement package versions must differ';
  end if;
  select coalesce(array_agg(id), '{}'::uuid[])
    into v_ids
  from public.angelcare360_operator_subscriptions
  where package_version_id = p_source_id;

  update public.angelcare360_operator_subscriptions
    set package_version_id = p_replacement_id,
        updated_at = now()
  where package_version_id = p_source_id;

  return v_ids;
end;
$$;

revoke all on function public.angelcare360_operator_replace_product_entity(text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.angelcare360_operator_replace_package_version(uuid, uuid) from public, anon, authenticated;
grant execute on function public.angelcare360_operator_replace_product_entity(text, uuid, uuid) to service_role;
grant execute on function public.angelcare360_operator_replace_package_version(uuid, uuid) to service_role;

commit;
