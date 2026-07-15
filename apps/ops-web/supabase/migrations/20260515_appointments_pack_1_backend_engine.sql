-- ANGELCARE RCC APPOINTMENTS PACK 1 - BACKEND ENGINE
create extension if not exists pgcrypto;

create table if not exists public.revenue_appointments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'prospect',
  entity_id uuid not null,
  title text not null,
  appointment_at timestamptz not null,
  end_at timestamptz,
  owner text not null default 'BD Officer',
  status text not null default 'scheduled',
  appointment_type text not null default 'meeting',
  priority text not null default 'medium',
  location text,
  meeting_link text,
  notes text,
  agenda text,
  objective text,
  expected_outcome text,
  attendees jsonb not null default '[]'::jsonb,
  reminders jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenue_appointments
add column if not exists end_at timestamptz,
add column if not exists appointment_type text not null default 'meeting',
add column if not exists priority text not null default 'medium',
add column if not exists meeting_link text,
add column if not exists agenda text,
add column if not exists objective text,
add column if not exists expected_outcome text,
add column if not exists attendees jsonb not null default '[]'::jsonb,
add column if not exists reminders jsonb not null default '[]'::jsonb,
add column if not exists documents jsonb not null default '[]'::jsonb,
add column if not exists tasks jsonb not null default '[]'::jsonb;

create index if not exists revenue_appointments_entity_id_idx on public.revenue_appointments(entity_id);
create index if not exists revenue_appointments_at_idx on public.revenue_appointments(appointment_at);
create index if not exists revenue_appointments_status_idx on public.revenue_appointments(status);
create index if not exists revenue_appointments_type_idx on public.revenue_appointments(appointment_type);

create or replace function public.revenue_appointments_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists revenue_appointments_touch_updated_at on public.revenue_appointments;
create trigger revenue_appointments_touch_updated_at
before update on public.revenue_appointments
for each row execute function public.revenue_appointments_touch_updated_at();

drop view if exists public.revenue_appointment_command_view cascade;
create view public.revenue_appointment_command_view as
select
  a.*,
  coalesce(p.name, p.data->>'name', p.data->>'company', a.entity_id::text) as entity_name,
  coalesce(p.city, p.data->>'city', 'Unassigned') as entity_city,
  coalesce(p.priority, p.data->>'priority', 'medium') as entity_priority,
  coalesce(p.stage, p.data->>'stage', 'unknown') as entity_stage,
  coalesce(p.data->>'contactName', p.data->>'decisionMaker', 'N/A') as entity_contact,
  coalesce(p.data->>'phone', '') as entity_phone,
  coalesce(p.data->>'email', '') as entity_email,
  coalesce(p.value_mad, nullif(p.data->>'valueMad','')::numeric, 0) as entity_value_mad,
  coalesce(p.score, nullif(p.data->>'score','')::numeric, 0) as entity_score,
  (select count(*)::integer from public.revenue_tasks t where t.entity_id = a.entity_id) as linked_task_count
from public.revenue_appointments a
left join public.revenue_prospects p on p.id = a.entity_id;

create or replace view public.revenue_appointment_metrics_view as
select
  count(*) filter (where appointment_at::date = current_date)::integer as today_count,
  count(*) filter (where appointment_at >= date_trunc('week', now()) and appointment_at < date_trunc('week', now()) + interval '7 days')::integer as week_count,
  count(*) filter (where appointment_at >= date_trunc('month', now()) and appointment_at < date_trunc('month', now()) + interval '1 month')::integer as month_count,
  round(case when count(*) = 0 then 0 else count(*) filter (where status in ('confirmed','completed'))::numeric / count(*)::numeric * 100 end)::integer as confirmed_rate,
  round(case when count(*) = 0 then 0 else count(*) filter (where status = 'completed')::numeric / count(*)::numeric * 100 end)::integer as conversion_rate,
  coalesce(round(avg(extract(epoch from (coalesce(end_at, appointment_at + interval '45 minutes') - appointment_at)) / 60))::integer, 0) as avg_duration_minutes,
  count(*)::integer as total_count
from public.revenue_appointments;

create or replace view public.revenue_appointment_type_view as
select appointment_type, count(*)::integer as total,
round(case when (select count(*) from public.revenue_appointments) = 0 then 0 else count(*)::numeric / (select count(*) from public.revenue_appointments)::numeric * 100 end)::integer as pct
from public.revenue_appointments group by appointment_type order by total desc;

create or replace function public.revenue_appointment_quick_action(
  p_appointment_id uuid,
  p_action text,
  p_actor text default 'AngelCare'
)
returns jsonb language plpgsql security definer as $$
begin
  if not exists (select 1 from public.revenue_appointments where id = p_appointment_id) then
    return jsonb_build_object('ok', false, 'error', 'Appointment not found');
  end if;

  if p_action = 'confirm' then
    update public.revenue_appointments set status='confirmed' where id=p_appointment_id;
  elsif p_action = 'complete' then
    update public.revenue_appointments set status='completed' where id=p_appointment_id;
  elsif p_action = 'cancel' then
    update public.revenue_appointments set status='cancelled' where id=p_appointment_id;
  elsif p_action = 'delete' then
    delete from public.revenue_appointments where id=p_appointment_id;
  else
    return jsonb_build_object('ok', false, 'error', 'Unknown action');
  end if;

  return jsonb_build_object('ok', true, 'action', p_action, 'appointment_id', p_appointment_id);
end $$;
