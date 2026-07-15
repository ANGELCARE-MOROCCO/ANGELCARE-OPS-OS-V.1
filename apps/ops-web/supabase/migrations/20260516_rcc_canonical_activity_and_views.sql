-- Revenue Command Center canonical stabilization support.
-- Safe to run multiple times. It does not drop existing tables or data.

create extension if not exists pgcrypto;

create table if not exists public.revenue_activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'prospect',
  entity_id text not null,
  event_type text not null default 'activity',
  event_title text not null default 'Activity logged',
  event_body text,
  actor text default 'AngelCare',
  severity text default 'info',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists revenue_activities_entity_idx on public.revenue_activities(entity_type, entity_id, created_at desc);
create index if not exists revenue_activities_created_idx on public.revenue_activities(created_at desc);

-- Keep older revenue_events installs compatible by mirroring into canonical activities.
do $$
begin
  if to_regclass('public.revenue_events') is not null then
    execute $sql$
      insert into public.revenue_activities(entity_type, entity_id, event_type, event_title, event_body, actor, severity, metadata, created_at)
      select
        coalesce(entity_type, 'prospect'),
        entity_id,
        coalesce(event_type, 'activity'),
        coalesce(event_title, title, 'Activity logged'),
        event_body,
        coalesce(actor, 'AngelCare'),
        coalesce(severity, 'info'),
        coalesce(metadata, '{}'::jsonb),
        coalesce(created_at, now())
      from public.revenue_events
      where entity_id is not null
      on conflict do nothing
    $sql$;
  end if;
end $$;

create or replace view public.revenue_task_command_view as
select
  t.*,
  p.name as entity_name,
  p.city as entity_city,
  p.stage as entity_stage,
  p.priority as entity_priority
from public.revenue_tasks t
left join public.revenue_prospects p on p.id::text = t.entity_id::text;

create or replace view public.revenue_appointment_command_view as
select
  a.*,
  p.name as entity_name,
  p.city as entity_city,
  p.stage as entity_stage,
  p.priority as entity_priority
from public.revenue_appointments a
left join public.revenue_prospects p on p.id::text = a.entity_id::text;
