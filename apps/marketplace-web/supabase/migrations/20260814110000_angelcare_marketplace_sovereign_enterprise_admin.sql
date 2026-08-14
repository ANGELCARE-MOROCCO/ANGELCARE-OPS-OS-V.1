begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare_marketplace_operator_workspaces (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null,
  workspace_key text not null default 'primary',
  pins jsonb not null default '[]'::jsonb,
  recents jsonb not null default '[]'::jsonb,
  layout jsonb not null default '{}'::jsonb,
  saved_views jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(app_user_id, workspace_key)
);
create index if not exists ac_operator_workspaces_user_idx on public.angelcare_marketplace_operator_workspaces(app_user_id, updated_at desc);

create table if not exists public.angelcare_marketplace_saved_segments (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('AC-SEG-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  app_user_id uuid not null,
  name text not null,
  description text,
  filters jsonb not null default '{}'::jsonb,
  last_snapshot_count integer not null default 0,
  last_snapshot_at timestamptz,
  status text not null default 'active',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac_saved_segments_user_idx on public.angelcare_marketplace_saved_segments(app_user_id, status, updated_at desc);

create table if not exists public.angelcare_marketplace_document_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid,
  template_key text not null,
  version_number integer not null,
  snapshot jsonb not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(template_key, version_number)
);
create index if not exists ac_document_template_versions_idx on public.angelcare_marketplace_document_template_versions(template_key, version_number desc);

alter table public.angelcare_marketplace_operator_workspaces enable row level security;
alter table public.angelcare_marketplace_saved_segments enable row level security;
alter table public.angelcare_marketplace_document_template_versions enable row level security;

revoke all on public.angelcare_marketplace_operator_workspaces from anon, authenticated;
revoke all on public.angelcare_marketplace_saved_segments from anon, authenticated;
revoke all on public.angelcare_marketplace_document_template_versions from anon, authenticated;
grant all on public.angelcare_marketplace_operator_workspaces to service_role;
grant all on public.angelcare_marketplace_saved_segments to service_role;
grant all on public.angelcare_marketplace_document_template_versions to service_role;

commit;
