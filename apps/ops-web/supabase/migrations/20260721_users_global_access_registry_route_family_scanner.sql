-- ANGELCARE USERS MANAGEMENT
-- Global Access Registry & Route-Family Scanner v2
-- Additive migration. Review and execute manually in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.access_resource_registry (
  id uuid primary key default gen_random_uuid(),
  resource_key text not null unique,
  resource_type text not null,
  parent_resource_key text null,
  module_key text null,
  family_key text null,
  display_name text not null,
  description text null,
  canonical_route text null,
  route_pattern text null,
  source_path text null,
  application_root text not null default 'apps/ops-web/app',
  category text null,
  department text null,
  icon text null,
  permission_key text not null unique,
  assignable boolean not null default false,
  dashboard_visible boolean not null default false,
  navigation_visible boolean not null default false,
  protected boolean not null default false,
  risk_level text not null default 'normal',
  status text not null default 'discovered',
  classification_confidence numeric(5,4) not null default 0,
  classification_reason text null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  published_at timestamptz null,
  retired_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_resource_registry_type_check check (resource_type in (
    'module','module_workspace','route_family','route_group','standalone_route',
    'route','dynamic_route','api_route','redirect','internal'
  )),
  constraint access_resource_registry_status_check check (status in (
    'discovered','classified','review_required','active','missing','retired','excluded'
  )),
  constraint access_resource_registry_parent_not_self check (parent_resource_key is null or parent_resource_key <> resource_key)
);

create table if not exists public.access_registry_versions (
  id uuid primary key default gen_random_uuid(),
  version_number bigint not null unique,
  status text not null default 'active',
  source_scan_id uuid null,
  checksum text not null,
  resource_count integer not null default 0,
  module_count integer not null default 0,
  route_count integer not null default 0,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid null,
  actor_email text null,
  created_at timestamptz not null default now(),
  published_at timestamptz null,
  rolled_back_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  constraint access_registry_versions_status_check check (status in ('active','superseded','rolled_back','archived'))
);

create table if not exists public.access_resource_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  resource_key text not null,
  permission_key text not null,
  grant_level text not null default 'view',
  grant_origin text not null default 'direct',
  effect text not null default 'allow',
  valid_from timestamptz not null default now(),
  valid_until timestamptz null,
  status text not null default 'active',
  granted_by uuid null,
  actor_email text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, resource_key, permission_key, effect),
  constraint access_resource_grants_level_check check (grant_level in ('view','operate','manage','admin')),
  constraint access_resource_grants_origin_check check (grant_origin in ('direct','role_template','inherited','temporary','migration')),
  constraint access_resource_grants_effect_check check (effect in ('allow','deny')),
  constraint access_resource_grants_status_check check (status in ('active','expired','revoked'))
);

alter table public.access_route_registry add column if not exists resource_key text null;
alter table public.access_route_registry add column if not exists family_key text null;
alter table public.access_scan_runs add column if not exists scan_mode text null;
alter table public.access_scan_runs add column if not exists resources_detected integer not null default 0;
alter table public.access_scan_runs add column if not exists families_detected integer not null default 0;
alter table public.access_scan_runs add column if not exists groups_detected integer not null default 0;
alter table public.access_scan_runs add column if not exists standalone_routes_detected integer not null default 0;
alter table public.access_scan_runs add column if not exists api_routes_detected integer not null default 0;
alter table public.access_scan_runs add column if not exists new_resources integer not null default 0;
alter table public.access_scan_runs add column if not exists changed_resources integer not null default 0;
alter table public.access_scan_runs add column if not exists missing_resources integer not null default 0;
alter table public.access_scan_runs add column if not exists checksum text null;
alter table public.access_scan_runs add column if not exists registry_version_id uuid null;
alter table public.access_scan_runs add column if not exists idempotency_key text null;
alter table public.access_scan_runs add column if not exists published_at timestamptz null;
alter table public.access_registry_events add column if not exists resource_key text null;

create unique index if not exists idx_access_scan_runs_idempotency_key
  on public.access_scan_runs(idempotency_key)
  where idempotency_key is not null;
create index if not exists idx_access_resource_registry_type on public.access_resource_registry(resource_type);
create index if not exists idx_access_resource_registry_parent on public.access_resource_registry(parent_resource_key);
create index if not exists idx_access_resource_registry_module on public.access_resource_registry(module_key);
create index if not exists idx_access_resource_registry_family on public.access_resource_registry(family_key);
create index if not exists idx_access_resource_registry_route on public.access_resource_registry(canonical_route);
create index if not exists idx_access_resource_registry_status on public.access_resource_registry(status);
create index if not exists idx_access_resource_registry_assignable on public.access_resource_registry(assignable, status);
create index if not exists idx_access_resource_registry_dashboard on public.access_resource_registry(dashboard_visible, status);
create index if not exists idx_access_registry_versions_created_at on public.access_registry_versions(created_at desc);
create index if not exists idx_access_resource_grants_user on public.access_resource_grants(user_id, status);
create index if not exists idx_access_resource_grants_resource on public.access_resource_grants(resource_key, status);
create index if not exists idx_access_registry_events_resource on public.access_registry_events(resource_key);
create index if not exists idx_access_route_registry_resource on public.access_route_registry(resource_key);
create index if not exists idx_access_route_registry_family on public.access_route_registry(family_key);

create or replace function public.touch_global_access_registry_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_access_resource_registry_updated_at on public.access_resource_registry;
create trigger trg_access_resource_registry_updated_at
before update on public.access_resource_registry
for each row execute function public.touch_global_access_registry_updated_at();

drop trigger if exists trg_access_resource_grants_updated_at on public.access_resource_grants;
create trigger trg_access_resource_grants_updated_at
before update on public.access_resource_grants
for each row execute function public.touch_global_access_registry_updated_at();

create or replace function public.block_access_registry_history_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Access registry history is immutable';
end;
$$;

drop trigger if exists trg_access_registry_events_immutable_update on public.access_registry_events;
create trigger trg_access_registry_events_immutable_update
before update or delete on public.access_registry_events
for each row execute function public.block_access_registry_history_mutation();

drop trigger if exists trg_access_registry_versions_immutable_delete on public.access_registry_versions;
create trigger trg_access_registry_versions_immutable_delete
before delete on public.access_registry_versions
for each row execute function public.block_access_registry_history_mutation();

alter table public.access_resource_registry enable row level security;
alter table public.access_registry_versions enable row level security;
alter table public.access_resource_grants enable row level security;

-- Remove the Phase 1 permissive authenticated write policies.
drop policy if exists authenticated_all_access_module_registry on public.access_module_registry;
drop policy if exists authenticated_all_access_route_registry on public.access_route_registry;
drop policy if exists authenticated_all_access_scan_runs on public.access_scan_runs;
drop policy if exists authenticated_all_access_registry_events on public.access_registry_events;
drop policy if exists authenticated_all_access_role_templates on public.access_role_templates;

-- Read-only registry visibility. Server mutation uses the service-role client after actor/RBAC validation.
drop policy if exists authenticated_read_access_resource_registry on public.access_resource_registry;
create policy authenticated_read_access_resource_registry
on public.access_resource_registry for select to authenticated using (true);

drop policy if exists authenticated_read_access_registry_versions on public.access_registry_versions;
create policy authenticated_read_access_registry_versions
on public.access_registry_versions for select to authenticated using (true);

drop policy if exists authenticated_read_own_access_resource_grants on public.access_resource_grants;
create policy authenticated_read_own_access_resource_grants
on public.access_resource_grants for select to authenticated
using (user_id = auth.uid());

-- Preserve authenticated read access for existing compatibility registries.
drop policy if exists authenticated_read_access_module_registry on public.access_module_registry;
create policy authenticated_read_access_module_registry
on public.access_module_registry for select to authenticated using (true);

drop policy if exists authenticated_read_access_route_registry on public.access_route_registry;
create policy authenticated_read_access_route_registry
on public.access_route_registry for select to authenticated using (true);

drop policy if exists authenticated_read_access_scan_runs on public.access_scan_runs;
create policy authenticated_read_access_scan_runs
on public.access_scan_runs for select to authenticated using (true);

drop policy if exists authenticated_read_access_registry_events on public.access_registry_events;
create policy authenticated_read_access_registry_events
on public.access_registry_events for select to authenticated using (true);

drop policy if exists authenticated_read_access_role_templates on public.access_role_templates;
create policy authenticated_read_access_role_templates
on public.access_role_templates for select to authenticated using (true);

comment on table public.access_resource_registry is 'Canonical global application resource hierarchy: modules, independent families, groups, standalone pages, routes and APIs.';
comment on table public.access_registry_versions is 'Recoverable snapshots created when an authorized global access scan is published.';
comment on table public.access_resource_grants is 'Normalized future-proof grants. Existing app_users.permissions remains compatible and is populated through the permission catalog.';

commit;
