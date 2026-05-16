-- ANGELCARE RCC DAILY TASKS RESTORE DATA + LAYOUT FIX V9

alter table public.revenue_tasks
add column if not exists status_label text,
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

create or replace view public.revenue_daily_task_metrics_view as
select
  count(*)::integer as total_tasks,
  count(*) filter (where status = 'done')::integer as completed_tasks,
  count(*) filter (where status = 'open' and coalesce(status_label,'') in ('In Progress','Open','Scheduled','Pending') or status = 'open')::integer as in_progress_tasks,
  count(*) filter (where status = 'open' and coalesce(status_label,'') = 'Pending')::integer as pending_tasks,
  count(*) filter (where status = 'open' and due_date is not null and due_date < current_date)::integer as overdue_tasks,
  count(*) filter (where status = 'open' and due_date between current_date and current_date + 7)::integer as next_7_days,
  round(case when count(*) = 0 then 0 else (count(*) filter (where status = 'done')::numeric / count(*)::numeric) * 100 end)::integer as completion_rate
from public.revenue_tasks;

create or replace view public.revenue_task_owner_workload_view as
select owner, count(*)::integer as total_tasks,
count(*) filter (where status = 'open')::integer as open_tasks,
count(*) filter (where status = 'done')::integer as completed_tasks,
count(*) filter (where priority in ('high','critical'))::integer as priority_tasks
from public.revenue_tasks group by owner order by open_tasks desc, total_tasks desc;

create or replace view public.revenue_task_category_view as
select task_type, count(*)::integer as total_tasks,
round(case when (select count(*) from public.revenue_tasks) = 0 then 0 else count(*)::numeric / (select count(*) from public.revenue_tasks)::numeric * 100 end)::integer as pct
from public.revenue_tasks group by task_type order by total_tasks desc;

create or replace function public.revenue_task_quick_action(
  p_task_id uuid,
  p_action text,
  p_actor text default 'AngelCare'
)
returns jsonb
language plpgsql
security definer
as $$
declare v_task public.revenue_tasks%rowtype;
begin
  select * into v_task from public.revenue_tasks where id = p_task_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Task not found'); end if;

  if p_action = 'complete' then
    update public.revenue_tasks set status = 'done', status_label = 'Completed', completed_at = now() where id = p_task_id;
  elsif p_action = 'reopen' then
    update public.revenue_tasks set status = 'open', status_label = 'Open', completed_at = null where id = p_task_id;
  elsif p_action = 'delete' then
    delete from public.revenue_tasks where id = p_task_id;
  else
    return jsonb_build_object('ok', false, 'error', 'Unknown action');
  end if;

  return jsonb_build_object('ok', true, 'action', p_action, 'task_id', p_task_id);
end $$;
