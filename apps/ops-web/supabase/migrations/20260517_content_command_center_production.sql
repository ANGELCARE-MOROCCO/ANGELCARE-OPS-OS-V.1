
-- Content Command Center Production Schema
-- Run in Supabase SQL Editor before deploying API routes.

create extension if not exists pgcrypto;

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
  template_id text references public.content_command_templates(id) on delete cascade,
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
  template_id text references public.content_command_templates(id) on delete cascade,
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

alter table public.content_command_templates enable row level security;
alter table public.content_command_tasks enable row level security;
alter table public.content_command_comments enable row level security;
alter table public.content_command_activity enable row level security;

-- Adjust these policies to your auth/roles model.
drop policy if exists "authenticated read content command templates" on public.content_command_templates;
create policy "authenticated read content command templates"
on public.content_command_templates for select
to authenticated
using (true);

drop policy if exists "authenticated write content command templates" on public.content_command_templates;
create policy "authenticated write content command templates"
on public.content_command_templates for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read content command tasks" on public.content_command_tasks;
create policy "authenticated read content command tasks"
on public.content_command_tasks for select
to authenticated
using (true);

drop policy if exists "authenticated write content command tasks" on public.content_command_tasks;
create policy "authenticated write content command tasks"
on public.content_command_tasks for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read content command comments" on public.content_command_comments;
create policy "authenticated read content command comments"
on public.content_command_comments for select
to authenticated
using (true);

drop policy if exists "authenticated write content command comments" on public.content_command_comments;
create policy "authenticated write content command comments"
on public.content_command_comments for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read content command activity" on public.content_command_activity;
create policy "authenticated read content command activity"
on public.content_command_activity for select
to authenticated
using (true);

drop policy if exists "authenticated write content command activity" on public.content_command_activity;
create policy "authenticated write content command activity"
on public.content_command_activity for all
to authenticated
using (true)
with check (true);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_content_command_templates_updated_at on public.content_command_templates;
create trigger set_content_command_templates_updated_at
before update on public.content_command_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_content_command_tasks_updated_at on public.content_command_tasks;
create trigger set_content_command_tasks_updated_at
before update on public.content_command_tasks
for each row execute function public.set_updated_at();
