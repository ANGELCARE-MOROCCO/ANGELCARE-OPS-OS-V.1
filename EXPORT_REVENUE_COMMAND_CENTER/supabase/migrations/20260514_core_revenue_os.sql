
-- ANGELCARE PRODUCTION READINESS PACK 1
-- CORE PROSPECT / REVENUE OS DATABASE FOUNDATION
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.revenue_workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  mode text not null default 'production',
  created_at timestamptz not null default now()
);

insert into public.revenue_workspaces(slug, name)
values ('angelcare-main', 'AngelCare Main Workspace')
on conflict (slug) do nothing;

create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null,
  entity_id text not null,
  event_type text not null,
  event_title text not null,
  event_body text,
  actor text not null default 'AngelCare',
  severity text not null default 'info',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text,
  entity_id text,
  title text not null,
  body text,
  severity text not null default 'info',
  status text not null default 'unread',
  assigned_to text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.revenue_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'prospect',
  entity_id text not null,
  title text not null,
  description text,
  owner text not null default 'BD Officer',
  priority text not null default 'medium',
  status text not null default 'open',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'prospect',
  entity_id text not null,
  title text not null,
  appointment_at timestamptz not null,
  owner text not null default 'BD Officer',
  status text not null default 'scheduled',
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'prospect',
  entity_id text not null,
  author text not null default 'AngelCare',
  channel text not null default 'internal',
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'prospect',
  entity_id text not null,
  title text not null,
  file_url text,
  document_type text not null default 'profile',
  status text not null default 'active',
  created_by text not null default 'AngelCare',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'prospect',
  entity_id text not null,
  full_name text not null,
  role text not null default 'Contact',
  influence_level text not null default 'medium',
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_pipeline_history (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_id text not null,
  from_stage text,
  to_stage text not null,
  actor text not null default 'AngelCare',
  created_at timestamptz not null default now()
);

create or replace function public.revenue_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_revenue_tasks_touch on public.revenue_tasks;
create trigger trg_revenue_tasks_touch before update on public.revenue_tasks for each row execute function public.revenue_touch_updated_at();

drop trigger if exists trg_revenue_appointments_touch on public.revenue_appointments;
create trigger trg_revenue_appointments_touch before update on public.revenue_appointments for each row execute function public.revenue_touch_updated_at();

drop trigger if exists trg_revenue_documents_touch on public.revenue_documents;
create trigger trg_revenue_documents_touch before update on public.revenue_documents for each row execute function public.revenue_touch_updated_at();

drop trigger if exists trg_revenue_contacts_touch on public.revenue_contacts;
create trigger trg_revenue_contacts_touch before update on public.revenue_contacts for each row execute function public.revenue_touch_updated_at();

alter table public.revenue_events enable row level security;
alter table public.revenue_notifications enable row level security;
alter table public.revenue_tasks enable row level security;
alter table public.revenue_appointments enable row level security;
alter table public.revenue_comments enable row level security;
alter table public.revenue_documents enable row level security;
alter table public.revenue_contacts enable row level security;
alter table public.revenue_pipeline_history enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'revenue_events','revenue_notifications','revenue_tasks','revenue_appointments',
    'revenue_comments','revenue_documents','revenue_contacts','revenue_pipeline_history'
  ] loop
    execute format('drop policy if exists authenticated_all_%s on public.%I', t, t);
    execute format('create policy authenticated_all_%s on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

create or replace function public.revenue_log_event(
  p_entity_type text,
  p_entity_id text,
  p_event_type text,
  p_event_title text,
  p_event_body text default null,
  p_actor text default 'AngelCare',
  p_severity text default 'info',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer as $$
declare new_id uuid;
begin
  insert into public.revenue_events(entity_type, entity_id, event_type, event_title, event_body, actor, severity, metadata)
  values (p_entity_type, p_entity_id, p_event_type, p_event_title, p_event_body, p_actor, p_severity, coalesce(p_metadata, '{}'::jsonb))
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.revenue_overdue_sweep()
returns integer language plpgsql security definer as $$
declare inserted_count integer;
begin
  insert into public.revenue_notifications(entity_type, entity_id, title, body, severity)
  select entity_type, entity_id, 'Overdue task', 'Task "' || title || '" is overdue.', 'warning'
  from public.revenue_tasks t
  where t.status = 'open'
    and t.due_date is not null
    and t.due_date < current_date
    and not exists (
      select 1 from public.revenue_notifications n
      where n.entity_id = t.entity_id
        and n.title = 'Overdue task'
        and n.body like '%' || t.title || '%'
        and n.created_at > now() - interval '48 hours'
    );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end $$;
