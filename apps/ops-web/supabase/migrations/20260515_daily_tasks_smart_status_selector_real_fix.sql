-- ANGELCARE RCC DAILY TASKS SMART STATUS SELECTOR REAL FIX V7
-- Persists human status label so selecting In Progress/Scheduled/Pending changes visibly and syncs live.

alter table public.revenue_tasks
add column if not exists status_label text;

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
