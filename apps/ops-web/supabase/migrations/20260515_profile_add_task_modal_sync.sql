-- ANGELCARE RCC PROSPECT PROFILE ADD TASK MODAL SYNC V1
-- Safe ensure task fields exist for prospect-profile task creation.

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
add column if not exists tags text[] not null default '{}'::text[],
add column if not exists visibility text not null default 'team',
add column if not exists reminder_minutes integer not null default 15,
add column if not exists add_to_calendar boolean not null default true,
add column if not exists send_notifications boolean not null default true;

create index if not exists revenue_tasks_entity_id_idx on public.revenue_tasks(entity_id);
create index if not exists revenue_tasks_start_at_idx on public.revenue_tasks(start_at);
create index if not exists revenue_tasks_due_date_idx on public.revenue_tasks(due_date);

drop view if exists public.revenue_task_command_view cascade;

create view public.revenue_task_command_view as
select
  t.*,
  coalesce(p.name, p.data->>'name', p.data->>'company', t.entity_id) as entity_name,
  coalesce(p.city, p.data->>'city', 'Unassigned') as entity_city,
  coalesce(p.priority, p.data->>'priority', 'medium') as entity_priority,
  coalesce(p.stage, p.data->>'stage', 'unknown') as entity_stage,
  coalesce(p.data->>'contactName', p.data->>'decisionMaker', 'N/A') as entity_contact,
  coalesce(p.data->>'phone', '') as entity_phone,
  coalesce(p.data->>'email', '') as entity_email,
  coalesce(p.value_mad, nullif(p.data->>'valueMad','')::numeric, 0) as entity_value_mad,
  coalesce(p.score, nullif(p.data->>'score','')::numeric, 0) as entity_score
from public.revenue_tasks t
left join public.revenue_prospects p on p.id = t.entity_id;
