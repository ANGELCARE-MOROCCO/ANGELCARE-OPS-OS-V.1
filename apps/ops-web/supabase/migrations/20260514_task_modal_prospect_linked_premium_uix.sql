-- ANGELCARE RCC TASK MODAL PROSPECT-LINKED PREMIUM UIX V3
-- Safe extension of previous task scheduling fields.

alter table public.revenue_tasks
add column if not exists visibility text not null default 'team',
add column if not exists reminder_minutes integer not null default 15,
add column if not exists add_to_calendar boolean not null default true,
add column if not exists send_notifications boolean not null default true;

drop view if exists public.revenue_task_command_view cascade;

create view public.revenue_task_command_view as
select
  t.*,
  coalesce(p.name, t.entity_id) as entity_name,
  coalesce(p.city, 'Unassigned') as entity_city,
  coalesce(p.priority, 'medium') as entity_priority,
  coalesce(p.stage, 'unknown') as entity_stage
from public.revenue_tasks t
left join public.revenue_prospects p on p.id = t.entity_id;
