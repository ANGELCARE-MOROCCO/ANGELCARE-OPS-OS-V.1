-- ANGELCARE RCC PROFILE APPOINTMENTS LIVE SYNC FIX V1
-- Ensures prospect profile appointments read the same live appointment view as the Appointments page.

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

create index if not exists revenue_appointments_entity_id_idx on public.revenue_appointments(entity_id);
create index if not exists revenue_appointments_at_idx on public.revenue_appointments(appointment_at);

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
