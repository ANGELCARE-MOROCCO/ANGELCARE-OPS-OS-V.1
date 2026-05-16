-- ANGELCARE RCC MEGA HARDENING PACK 01
-- EVENT TIMELINE + NOTIFICATIONS + ESCALATION ENGINE
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'system',
  entity_id text not null default 'global',
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

create index if not exists revenue_events_entity_idx on public.revenue_events(entity_type, entity_id, created_at desc);
create index if not exists revenue_events_type_idx on public.revenue_events(event_type);
create index if not exists revenue_notifications_status_idx on public.revenue_notifications(status, created_at desc);
create index if not exists revenue_notifications_entity_idx on public.revenue_notifications(entity_type, entity_id);

alter table public.revenue_events enable row level security;
alter table public.revenue_notifications enable row level security;

drop policy if exists authenticated_all_revenue_events on public.revenue_events;
create policy authenticated_all_revenue_events on public.revenue_events for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_revenue_notifications on public.revenue_notifications;
create policy authenticated_all_revenue_notifications on public.revenue_notifications for all to authenticated using (true) with check (true);

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
returns uuid
language plpgsql
security definer
as $$
declare new_id uuid;
begin
  insert into public.revenue_events(entity_type, entity_id, event_type, event_title, event_body, actor, severity, metadata)
  values (coalesce(p_entity_type,'system'), coalesce(p_entity_id,'global'), p_event_type, p_event_title, p_event_body, coalesce(p_actor,'AngelCare'), coalesce(p_severity,'info'), coalesce(p_metadata,'{}'::jsonb))
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.revenue_create_notification(
  p_entity_type text,
  p_entity_id text,
  p_title text,
  p_body text default null,
  p_severity text default 'info',
  p_assigned_to text default null
)
returns uuid
language plpgsql
security definer
as $$
declare new_id uuid;
begin
  insert into public.revenue_notifications(entity_type, entity_id, title, body, severity, assigned_to)
  values (p_entity_type, p_entity_id, p_title, p_body, coalesce(p_severity,'info'), p_assigned_to)
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.revenue_escalation_sweep()
returns table(overdue_tasks integer, stale_prospects integer, missed_appointments integer)
language plpgsql
security definer
as $$
declare v_overdue integer := 0;
declare v_stale integer := 0;
declare v_missed integer := 0;
begin
  insert into public.revenue_notifications(entity_type, entity_id, title, body, severity, assigned_to)
  select 'task', t.id::text, 'Overdue task', 'Task "' || t.title || '" is overdue for ' || coalesce(t.owner,'owner') || '.', 'warning', t.owner
  from public.revenue_tasks t
  where t.status = 'open'
    and t.due_date is not null
    and t.due_date < current_date
    and not exists (
      select 1 from public.revenue_notifications n
      where n.entity_type = 'task' and n.entity_id = t.id::text and n.title = 'Overdue task' and n.status = 'unread'
    );
  get diagnostics v_overdue = row_count;

  insert into public.revenue_notifications(entity_type, entity_id, title, body, severity)
  select 'prospect', p.id, 'Stale prospect', 'Prospect "' || p.name || '" has no recent update and needs follow-up.', 'warning'
  from public.revenue_prospects p
  where p.updated_at < now() - interval '7 days'
    and coalesce(p.stage,'') not in ('closed_won','closed_lost')
    and not exists (
      select 1 from public.revenue_notifications n
      where n.entity_type = 'prospect' and n.entity_id = p.id and n.title = 'Stale prospect' and n.created_at > now() - interval '48 hours'
    );
  get diagnostics v_stale = row_count;

  insert into public.revenue_notifications(entity_type, entity_id, title, body, severity, assigned_to)
  select 'appointment', a.id::text, 'Missed appointment', 'Appointment "' || a.title || '" is in the past and still scheduled.', 'critical', a.owner
  from public.revenue_appointments a
  where a.status = 'scheduled'
    and a.appointment_at < now()
    and not exists (
      select 1 from public.revenue_notifications n
      where n.entity_type = 'appointment' and n.entity_id = a.id::text and n.title = 'Missed appointment' and n.status = 'unread'
    );
  get diagnostics v_missed = row_count;

  return query select v_overdue, v_stale, v_missed;
end $$;

create or replace function public.revenue_log_task_event()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    perform public.revenue_log_event('task', new.id::text, 'task.created', 'Task created', new.title, new.owner, 'info', to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      perform public.revenue_log_event('task', new.id::text, 'task.status_changed', 'Task status changed', old.status || ' → ' || new.status, new.owner, case when new.status='done' then 'success' else 'info' end, to_jsonb(new));
    else
      perform public.revenue_log_event('task', new.id::text, 'task.updated', 'Task updated', new.title, new.owner, 'info', to_jsonb(new));
    end if;
  elsif tg_op = 'DELETE' then
    perform public.revenue_log_event('task', old.id::text, 'task.deleted', 'Task deleted', old.title, old.owner, 'warning', to_jsonb(old));
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_revenue_task_events on public.revenue_tasks;
create trigger trg_revenue_task_events after insert or update or delete on public.revenue_tasks
for each row execute function public.revenue_log_task_event();

create or replace function public.revenue_log_appointment_event()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    perform public.revenue_log_event('appointment', new.id::text, 'appointment.scheduled', 'Appointment scheduled', new.title, new.owner, 'info', to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      perform public.revenue_log_event('appointment', new.id::text, 'appointment.status_changed', 'Appointment status changed', old.status || ' → ' || new.status, new.owner, case when new.status='completed' then 'success' else 'info' end, to_jsonb(new));
    else
      perform public.revenue_log_event('appointment', new.id::text, 'appointment.updated', 'Appointment updated', new.title, new.owner, 'info', to_jsonb(new));
    end if;
  elsif tg_op = 'DELETE' then
    perform public.revenue_log_event('appointment', old.id::text, 'appointment.deleted', 'Appointment deleted', old.title, old.owner, 'warning', to_jsonb(old));
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_revenue_appointment_events on public.revenue_appointments;
create trigger trg_revenue_appointment_events after insert or update or delete on public.revenue_appointments
for each row execute function public.revenue_log_appointment_event();

create or replace function public.revenue_log_prospect_event()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    perform public.revenue_log_event('prospect', new.id, 'prospect.created', 'Prospect created', new.name, 'AngelCare', 'info', new.data);
  elsif tg_op = 'UPDATE' then
    if old.stage is distinct from new.stage then
      perform public.revenue_log_event('prospect', new.id, 'prospect.stage_changed', 'Prospect stage changed', coalesce(old.stage,'start') || ' → ' || new.stage, 'AngelCare', 'info', new.data);
    else
      perform public.revenue_log_event('prospect', new.id, 'prospect.updated', 'Prospect updated', new.name, 'AngelCare', 'info', new.data);
    end if;
  elsif tg_op = 'DELETE' then
    perform public.revenue_log_event('prospect', old.id, 'prospect.deleted', 'Prospect deleted', old.name, 'AngelCare', 'warning', old.data);
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_revenue_prospect_events on public.revenue_prospects;
create trigger trg_revenue_prospect_events after insert or update or delete on public.revenue_prospects
for each row execute function public.revenue_log_prospect_event();
