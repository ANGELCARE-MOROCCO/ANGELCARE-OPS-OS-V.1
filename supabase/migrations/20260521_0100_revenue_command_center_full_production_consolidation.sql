-- Revenue Command Center full production consolidation
-- Safe additive migration: creates canonical tables, indexes, RLS, triggers, analytics view and helper functions.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.revenue_accounts (
  id uuid primary key default gen_random_uuid(),
  account_name text not null,
  account_type text not null default 'organization',
  segment text default 'b2b',
  city text default 'Unassigned',
  territory text,
  status text not null default 'active',
  priority text not null default 'medium',
  owner_id uuid,
  owner_name text default 'BD Officer',
  website text,
  phone text,
  email text,
  address text,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.revenue_accounts(id) on delete set null,
  full_name text not null,
  role_title text,
  email text,
  phone text,
  whatsapp text,
  influence_level text default 'unknown',
  decision_role text default 'contact',
  preferred_channel text default 'phone',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_prospects (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  name text not null,
  company text,
  city text not null default 'Unassigned',
  source text default 'manual',
  segment text default 'b2b',
  stage text not null default 'new_lead',
  priority text not null default 'medium',
  score numeric not null default 0,
  value_mad numeric not null default 0,
  probability numeric not null default 0,
  owner_id uuid,
  owner text default 'BD Officer',
  contact_name text,
  email text,
  phone text,
  next_action_at timestamptz,
  last_activity_at timestamptz,
  status text not null default 'active',
  data jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_opportunities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.revenue_prospects(id) on delete cascade,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  title text not null,
  stage text not null default 'qualification',
  value_mad numeric not null default 0,
  probability numeric not null default 0,
  expected_close_date date,
  status text not null default 'open',
  owner_id uuid,
  owner text default 'BD Officer',
  loss_reason text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_tasks (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'prospect',
  entity_id uuid,
  prospect_id uuid references public.revenue_prospects(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'medium',
  task_type text not null default 'follow_up',
  owner_id uuid,
  owner text default 'BD Officer',
  assigned_role text,
  due_date timestamptz,
  start_at timestamptz,
  end_at timestamptz,
  expected_outcome text,
  location text,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_appointments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'prospect',
  entity_id uuid,
  prospect_id uuid references public.revenue_prospects(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  title text not null,
  appointment_at timestamptz not null,
  end_at timestamptz,
  owner_id uuid,
  owner text default 'BD Officer',
  status text not null default 'scheduled',
  appointment_type text not null default 'meeting',
  priority text not null default 'medium',
  location text,
  meeting_link text,
  notes text,
  agenda text,
  objective text,
  expected_outcome text,
  attendees jsonb not null default '[]',
  reminders jsonb not null default '[]',
  documents jsonb not null default '[]',
  tasks jsonb not null default '[]',
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partnerships (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.revenue_accounts(id) on delete set null,
  prospect_id uuid references public.revenue_prospects(id) on delete set null,
  partner_name text not null,
  partner_type text not null default 'kindergarten',
  city text default 'Unassigned',
  stage text not null default 'targeted',
  priority text not null default 'medium',
  estimated_value_mad numeric not null default 0,
  owner_id uuid,
  owner text default 'Partnership Officer',
  contact_name text,
  phone text,
  email text,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_cases (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.revenue_prospects(id) on delete set null,
  parent_name text not null,
  child_age_range text,
  city text default 'Unassigned',
  service_interest text not null default 'childcare',
  stage text not null default 'inquiry',
  priority text not null default 'medium',
  estimated_value_mad numeric not null default 0,
  owner_id uuid,
  owner text default 'B2C Officer',
  phone text,
  email text,
  preferred_channel text default 'whatsapp',
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'prospect',
  entity_id uuid,
  title text not null,
  document_type text not null default 'proposal',
  storage_path text,
  external_url text,
  status text not null default 'draft',
  owner_id uuid,
  owner text default 'BD Officer',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'prospect',
  entity_id uuid,
  prospect_id uuid references public.revenue_prospects(id) on delete cascade,
  event_type text not null default 'activity',
  title text not null,
  body text,
  actor_id uuid,
  actor text default 'System',
  severity text not null default 'info',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_command_action_logs (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  actor_id uuid,
  actor text default 'System',
  payload jsonb not null default '{}',
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists revenue_prospects_stage_idx on public.revenue_prospects(stage);
create index if not exists revenue_prospects_city_idx on public.revenue_prospects(city);
create index if not exists revenue_prospects_owner_idx on public.revenue_prospects(owner_id);
create index if not exists revenue_tasks_entity_idx on public.revenue_tasks(entity_type, entity_id);
create index if not exists revenue_tasks_due_idx on public.revenue_tasks(due_date, status);
create index if not exists revenue_appointments_entity_idx on public.revenue_appointments(entity_type, entity_id);
create index if not exists revenue_appointments_time_idx on public.revenue_appointments(appointment_at, status);
create index if not exists revenue_activities_entity_idx on public.revenue_activities(entity_type, entity_id, created_at desc);
create index if not exists revenue_partnerships_stage_idx on public.revenue_partnerships(stage, city);
create index if not exists revenue_b2c_stage_idx on public.revenue_b2c_cases(stage, city);

-- Compatibility: populate entity_id from prospect_id when old pages only send prospect_id.
create or replace function public.revenue_entity_backfill()
returns trigger language plpgsql as $$
begin
  if new.entity_id is null and new.prospect_id is not null then
    new.entity_id := new.prospect_id;
    new.entity_type := coalesce(new.entity_type, 'prospect');
  end if;
  if new.prospect_id is null and new.entity_type = 'prospect' and new.entity_id is not null then
    new.prospect_id := new.entity_id;
  end if;
  return new;
end $$;

do $$ begin
  create trigger revenue_prospects_updated_at before update on public.revenue_prospects for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger revenue_tasks_updated_at before update on public.revenue_tasks for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger revenue_appointments_updated_at before update on public.revenue_appointments for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger revenue_tasks_entity_backfill before insert or update on public.revenue_tasks for each row execute function public.revenue_entity_backfill();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger revenue_appointments_entity_backfill before insert or update on public.revenue_appointments for each row execute function public.revenue_entity_backfill();
exception when duplicate_object then null; end $$;

create or replace view public.revenue_command_center_analytics as
select
  (select count(*) from public.revenue_prospects where status <> 'archived') as active_prospects,
  (select coalesce(sum(value_mad),0) from public.revenue_prospects where status <> 'archived') as pipeline_value_mad,
  (select count(*) from public.revenue_prospects where priority in ('high','critical') and status <> 'archived') as high_priority_prospects,
  (select count(*) from public.revenue_tasks where status in ('open','pending','todo')) as open_tasks,
  (select count(*) from public.revenue_tasks where status in ('open','pending','todo') and due_date < now()) as overdue_tasks,
  (select count(*) from public.revenue_appointments where status = 'scheduled' and appointment_at >= now()) as upcoming_appointments,
  (select count(*) from public.revenue_partnerships where status <> 'archived') as active_partnerships,
  (select count(*) from public.revenue_b2c_cases where status <> 'archived') as active_b2c_cases,
  now() as generated_at;

alter table public.revenue_accounts enable row level security;
alter table public.revenue_contacts enable row level security;
alter table public.revenue_prospects enable row level security;
alter table public.revenue_opportunities enable row level security;
alter table public.revenue_tasks enable row level security;
alter table public.revenue_appointments enable row level security;
alter table public.revenue_partnerships enable row level security;
alter table public.revenue_b2c_cases enable row level security;
alter table public.revenue_documents enable row level security;
alter table public.revenue_activities enable row level security;
alter table public.revenue_command_action_logs enable row level security;

-- Baseline authenticated policy. Tighten later with your staff_roles table if already available.
do $$ declare t text; begin
  foreach t in array array['revenue_accounts','revenue_contacts','revenue_prospects','revenue_opportunities','revenue_tasks','revenue_appointments','revenue_partnerships','revenue_b2c_cases','revenue_documents','revenue_activities','revenue_command_action_logs'] loop
    execute format('drop policy if exists "%s_authenticated_all" on public.%I', t, t);
    execute format('create policy "%s_authenticated_all" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;
