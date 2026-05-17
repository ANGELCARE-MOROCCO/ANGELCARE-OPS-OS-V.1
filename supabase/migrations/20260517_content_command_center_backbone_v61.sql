
-- Content Command Center Production Backbone V61
-- Run after V60 migration or standalone. Safe CREATE IF NOT EXISTS statements.

create extension if not exists pgcrypto;

create table if not exists public.content_command_categories (
  id text primary key,
  family text not null,
  name text not null,
  parent_id text null references public.content_command_categories(id) on delete cascade,
  sort_order integer not null default 0,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_command_assets (
  id text primary key,
  family text not null,
  title text not null,
  category text,
  subcategory text,
  output text,
  channel text,
  service_product text,
  owner text,
  status text not null default 'Draft',
  priority text not null default 'Medium',
  storage_path text,
  preview_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_command_documents (
  id text primary key,
  title text not null,
  document_type text,
  category text,
  subcategory text,
  owner text,
  version text default 'v1.0',
  status text not null default 'Draft',
  confidentiality text default 'internal',
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_command_templates (
  id text primary key,
  name text not null,
  family text not null,
  family_id text not null,
  category text not null,
  subcategory text not null,
  modal_scope text,
  output text,
  channel text,
  owner text,
  status text not null default 'Draft',
  usage_count integer not null default 0,
  readiness integer not null default 72,
  tone text not null default 'violet',
  icon_key text not null default 'LayoutTemplate',
  rules jsonb not null default '[]'::jsonb,
  matched_params jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_command_tasks (
  id text primary key,
  entity_type text not null default 'asset',
  entity_id text,
  template_id text references public.content_command_templates(id) on delete set null,
  title text not null,
  status text not null default 'active',
  owner text,
  priority text default 'medium',
  due_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_command_comments (
  id text primary key,
  entity_type text not null default 'asset',
  entity_id text,
  template_id text references public.content_command_templates(id) on delete set null,
  author text,
  role text,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.content_command_activity (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_content_command_categories_updated_at on public.content_command_categories;
create trigger set_content_command_categories_updated_at before update on public.content_command_categories for each row execute function public.set_updated_at();

drop trigger if exists set_content_command_assets_updated_at on public.content_command_assets;
create trigger set_content_command_assets_updated_at before update on public.content_command_assets for each row execute function public.set_updated_at();

drop trigger if exists set_content_command_documents_updated_at on public.content_command_documents;
create trigger set_content_command_documents_updated_at before update on public.content_command_documents for each row execute function public.set_updated_at();

drop trigger if exists set_content_command_templates_updated_at on public.content_command_templates;
create trigger set_content_command_templates_updated_at before update on public.content_command_templates for each row execute function public.set_updated_at();

drop trigger if exists set_content_command_tasks_updated_at on public.content_command_tasks;
create trigger set_content_command_tasks_updated_at before update on public.content_command_tasks for each row execute function public.set_updated_at();

alter table public.content_command_categories enable row level security;
alter table public.content_command_assets enable row level security;
alter table public.content_command_documents enable row level security;
alter table public.content_command_templates enable row level security;
alter table public.content_command_tasks enable row level security;
alter table public.content_command_comments enable row level security;
alter table public.content_command_activity enable row level security;

-- Broad authenticated policies for internal launch. Replace with role-based policies after launch.
do $$
declare
  t text;
begin
  foreach t in array array[
    'content_command_categories',
    'content_command_assets',
    'content_command_documents',
    'content_command_templates',
    'content_command_tasks',
    'content_command_comments',
    'content_command_activity'
  ]
  loop
    execute format('drop policy if exists "authenticated read %s" on public.%I', t, t);
    execute format('create policy "authenticated read %s" on public.%I for select to authenticated using (true)', t, t);
    execute format('drop policy if exists "authenticated write %s" on public.%I', t, t);
    execute format('create policy "authenticated write %s" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Seed the four master families/categories
insert into public.content_command_categories (id, family, name, parent_id, sort_order, status, metadata)
values
('digital-content', 'Digital content', 'Digital content', null, 10, 'active', '{"scope":"master"}'),
('print-offline', 'Print & Offline Content', 'Print & Offline Content', null, 20, 'active', '{"scope":"master"}'),
('corporate-docs', 'Corporate Docs', 'Corporate Docs', null, 30, 'active', '{"scope":"master"}'),
('templates', 'Templates', 'Templates', null, 40, 'active', '{"scope":"master"}')
on conflict (id) do update set
  family = excluded.family,
  name = excluded.name,
  sort_order = excluded.sort_order,
  status = excluded.status,
  metadata = excluded.metadata;
