-- ANGELCARE RCC PHASE 03
-- Tasks + Appointments production source-of-truth hardening.
-- Safe to run after previous revenue_* migrations.

create extension if not exists pgcrypto;

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

create index if not exists revenue_tasks_entity_idx on public.revenue_tasks(entity_type, entity_id);
create index if not exists revenue_tasks_due_date_idx on public.revenue_tasks(due_date);
create index if not exists revenue_tasks_status_idx on public.revenue_tasks(status);
create index if not exists revenue_tasks_owner_idx on public.revenue_tasks(owner);
create index if not exists revenue_tasks_updated_at_idx on public.revenue_tasks(updated_at desc);

create index if not exists revenue_appointments_entity_idx on public.revenue_appointments(entity_type, entity_id);
create index if not exists revenue_appointments_at_idx on public.revenue_appointments(appointment_at);
create index if not exists revenue_appointments_status_idx on public.revenue_appointments(status);
create index if not exists revenue_appointments_owner_idx on public.revenue_appointments(owner);

create or replace function public.revenue_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_revenue_tasks_touch on public.revenue_tasks;
create trigger trg_revenue_tasks_touch before update on public.revenue_tasks
for each row execute function public.revenue_touch_updated_at();

drop trigger if exists trg_revenue_appointments_touch on public.revenue_appointments;
create trigger trg_revenue_appointments_touch before update on public.revenue_appointments
for each row execute function public.revenue_touch_updated_at();

alter table public.revenue_tasks enable row level security;
alter table public.revenue_appointments enable row level security;

drop policy if exists authenticated_all_revenue_tasks on public.revenue_tasks;
create policy authenticated_all_revenue_tasks
on public.revenue_tasks
for all
to authenticated
using (true)
with check (true);

drop policy if exists authenticated_all_revenue_appointments on public.revenue_appointments;
create policy authenticated_all_revenue_appointments
on public.revenue_appointments
for all
to authenticated
using (true)
with check (true);

create or replace view public.revenue_task_command_view as
select
  t.*,
  coalesce(p.name, t.entity_id) as entity_name,
  coalesce(p.city, 'Unassigned') as entity_city,
  coalesce(p.priority, 'medium') as entity_priority,
  coalesce(p.stage, 'unknown') as entity_stage
from public.revenue_tasks t
left join public.revenue_prospects p on p.id = t.entity_id;

create or replace view public.revenue_appointment_command_view as
select
  a.*,
  coalesce(p.name, a.entity_id) as entity_name,
  coalesce(p.city, 'Unassigned') as entity_city,
  coalesce(p.priority, 'medium') as entity_priority,
  coalesce(p.stage, 'unknown') as entity_stage
from public.revenue_appointments a
left join public.revenue_prospects p on p.id = a.entity_id;

create or replace function public.revenue_task_completion_metrics()
returns table(
  total_tasks integer,
  open_tasks integer,
  completed_tasks integer,
  overdue_tasks integer
)
language sql
security definer
as $$
  select
    count(*)::integer as total_tasks,
    count(*) filter (where status = 'open')::integer as open_tasks,
    count(*) filter (where status = 'done')::integer as completed_tasks,
    count(*) filter (where status = 'open' and due_date is not null and due_date < current_date)::integer as overdue_tasks
  from public.revenue_tasks;
$$;
