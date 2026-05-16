-- ANGELCARE RCC TASK CREATE ENTERPRISE SCHEDULING V2
-- Adds enterprise scheduling fields to revenue_tasks.

alter table public.revenue_tasks
add column if not exists start_at timestamptz,
add column if not exists end_at timestamptz,
add column if not exists task_type text not null default 'execution',
add column if not exists department text not null default 'Revenue',
add column if not exists assigned_role text,
add column if not exists location text,
add column if not exists outcome_expected text,
add column if not exists escalation_rule text,
add column if not exists dependencies text,
add column if not exists tags text[] not null default '{}'::text[];

create index if not exists revenue_tasks_start_at_idx on public.revenue_tasks(start_at);
create index if not exists revenue_tasks_end_at_idx on public.revenue_tasks(end_at);
create index if not exists revenue_tasks_type_idx on public.revenue_tasks(task_type);
create index if not exists revenue_tasks_department_idx on public.revenue_tasks(department);

create or replace view public.revenue_task_command_view as
select
  t.*,
  coalesce(p.name, t.entity_id) as entity_name,
  coalesce(p.city, 'Unassigned') as entity_city,
  coalesce(p.priority, 'medium') as entity_priority,
  coalesce(p.stage, 'unknown') as entity_stage
from public.revenue_tasks t
left join public.revenue_prospects p on p.id = t.entity_id;
