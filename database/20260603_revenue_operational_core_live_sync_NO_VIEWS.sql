-- AngelCare Revenue Command Center operational core live sync repair.
-- Safe/idempotent: no destructive table drops and no data loss.

create extension if not exists pgcrypto;

create table if not exists public.revenue_prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Unnamed prospect',
  city text not null default 'Unassigned',
  stage text not null default 'new_lead',
  priority text not null default 'medium',
  value_mad numeric not null default 0,
  score numeric not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partnerships (
  id uuid primary key default gen_random_uuid(),
  organization text not null default 'Unnamed partner',
  name text,
  company text,
  contact_name text,
  email text,
  phone text,
  city text default 'Unassigned',
  location text,
  partnership_type text default 'strategic',
  partner_type text,
  kind text,
  stage text default 'prospecting',
  status text default 'active',
  potential_value_mad numeric default 0,
  value_mad numeric default 0,
  pipeline_value_mad numeric default 0,
  contract_status text default 'not_started',
  next_action text,
  next_action_at timestamptz,
  owner text default 'Partnership Lead',
  notes text,
  relationship_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.revenue_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'general',
  entity_id text,
  title text not null default 'Revenue task',
  description text,
  owner text not null default 'BD Officer',
  priority text not null default 'medium',
  status text not null default 'open',
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'general',
  entity_id text,
  title text not null default 'Revenue appointment',
  appointment_at timestamptz not null default now(),
  owner text not null default 'BD Officer',
  status text not null default 'scheduled',
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'general',
  entity_id text,
  author text not null default 'AngelCare',
  channel text not null default 'internal',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_type text not null default 'general',
  entity_id text,
  event_type text not null default 'activity',
  event_title text not null default 'Activity logged',
  event_body text,
  actor text default 'AngelCare',
  severity text default 'info',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_pipeline_history (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null default 'angelcare-main',
  entity_id text,
  from_stage text,
  to_stage text not null default 'unknown',
  actor text not null default 'AngelCare',
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_command_action_logs (
  id uuid primary key default gen_random_uuid(),
  module_key text default 'revenue-command-center',
  page_key text default 'revenue-command-center',
  action_key text,
  selected_count int default 0,
  payload jsonb not null default '{}'::jsonb,
  status text default 'completed',
  created_at timestamptz not null default now()
);

alter table public.revenue_prospects add column if not exists company text;
alter table public.revenue_prospects add column if not exists organization text;
alter table public.revenue_prospects add column if not exists contact_name text;
alter table public.revenue_prospects add column if not exists email text;
alter table public.revenue_prospects add column if not exists phone text;
alter table public.revenue_prospects add column if not exists location text;
alter table public.revenue_prospects add column if not exists source text default 'manual';
alter table public.revenue_prospects add column if not exists segment text default 'b2b';
alter table public.revenue_prospects add column if not exists status text default 'active';
alter table public.revenue_prospects add column if not exists probability numeric default 0;
alter table public.revenue_prospects add column if not exists owner text default 'BD Officer';
alter table public.revenue_prospects add column if not exists next_action text;
alter table public.revenue_prospects add column if not exists next_action_at timestamptz;
alter table public.revenue_prospects add column if not exists notes text;
alter table public.revenue_prospects add column if not exists tags text[] default '{}'::text[];
alter table public.revenue_prospects add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.revenue_prospects add column if not exists archived_at timestamptz;

alter table public.revenue_partnerships add column if not exists organization text default 'Unnamed partner';
alter table public.revenue_partnerships add column if not exists name text;
alter table public.revenue_partnerships add column if not exists company text;
alter table public.revenue_partnerships add column if not exists contact_name text;
alter table public.revenue_partnerships add column if not exists email text;
alter table public.revenue_partnerships add column if not exists phone text;
alter table public.revenue_partnerships add column if not exists city text default 'Unassigned';
alter table public.revenue_partnerships add column if not exists location text;
alter table public.revenue_partnerships add column if not exists partnership_type text default 'strategic';
alter table public.revenue_partnerships add column if not exists partner_type text;
alter table public.revenue_partnerships add column if not exists kind text;
alter table public.revenue_partnerships add column if not exists stage text default 'prospecting';
alter table public.revenue_partnerships add column if not exists status text default 'active';
alter table public.revenue_partnerships add column if not exists potential_value_mad numeric default 0;
alter table public.revenue_partnerships add column if not exists value_mad numeric default 0;
alter table public.revenue_partnerships add column if not exists pipeline_value_mad numeric default 0;
alter table public.revenue_partnerships add column if not exists contract_status text default 'not_started';
alter table public.revenue_partnerships add column if not exists next_action text;
alter table public.revenue_partnerships add column if not exists next_action_at timestamptz;
alter table public.revenue_partnerships add column if not exists owner text default 'Partnership Lead';
alter table public.revenue_partnerships add column if not exists notes text;
alter table public.revenue_partnerships add column if not exists relationship_notes text;
alter table public.revenue_partnerships add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.revenue_partnerships add column if not exists archived_at timestamptz;

alter table public.revenue_tasks add column if not exists prospect_id text;
alter table public.revenue_tasks add column if not exists partnership_id text;
alter table public.revenue_tasks add column if not exists assigned_owner text;
alter table public.revenue_tasks add column if not exists blocked_reason text;
alter table public.revenue_tasks add column if not exists notes text;
alter table public.revenue_tasks add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.revenue_tasks add column if not exists archived_at timestamptz;
alter table public.revenue_tasks add column if not exists start_at timestamptz;
alter table public.revenue_tasks add column if not exists end_at timestamptz;
alter table public.revenue_tasks add column if not exists task_type text default 'follow_up';
alter table public.revenue_tasks add column if not exists department text default 'Revenue Command';
alter table public.revenue_tasks add column if not exists assigned_role text;
alter table public.revenue_tasks add column if not exists location text;
alter table public.revenue_tasks add column if not exists expected_outcome text;
alter table public.revenue_tasks add column if not exists outcome_expected text;
alter table public.revenue_tasks add column if not exists escalation_rule text;
alter table public.revenue_tasks add column if not exists dependencies text;
alter table public.revenue_tasks add column if not exists tags text[] default '{}'::text[];
alter table public.revenue_tasks add column if not exists visibility text default 'team';
alter table public.revenue_tasks add column if not exists reminder_minutes integer;
alter table public.revenue_tasks add column if not exists add_to_calendar boolean default false;
alter table public.revenue_tasks add column if not exists send_notifications boolean default false;

alter table public.revenue_appointments add column if not exists prospect_id text;
alter table public.revenue_appointments add column if not exists partnership_id text;
alter table public.revenue_appointments add column if not exists scheduled_at timestamptz;
alter table public.revenue_appointments add column if not exists end_at timestamptz;
alter table public.revenue_appointments add column if not exists appointment_type text default 'meeting';
alter table public.revenue_appointments add column if not exists priority text default 'medium';
alter table public.revenue_appointments add column if not exists meeting_link text;
alter table public.revenue_appointments add column if not exists agenda text;
alter table public.revenue_appointments add column if not exists objective text;
alter table public.revenue_appointments add column if not exists expected_outcome text;
alter table public.revenue_appointments add column if not exists outcome text;
alter table public.revenue_appointments add column if not exists briefing_notes text;
alter table public.revenue_appointments add column if not exists live_notes text;
alter table public.revenue_appointments add column if not exists follow_up_at timestamptz;
alter table public.revenue_appointments add column if not exists attendees jsonb not null default '[]'::jsonb;
alter table public.revenue_appointments add column if not exists reminders jsonb not null default '[]'::jsonb;
alter table public.revenue_appointments add column if not exists documents jsonb not null default '[]'::jsonb;
alter table public.revenue_appointments add column if not exists tasks jsonb not null default '[]'::jsonb;
alter table public.revenue_appointments add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.revenue_appointments add column if not exists archived_at timestamptz;

create table if not exists public.revenue_follow_ups (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'general',
  entity_id text,
  prospect_id text,
  partnership_id text,
  title text not null default 'Revenue follow-up',
  scheduled_at timestamptz,
  channel text default 'whatsapp',
  status text default 'pending',
  priority text default 'medium',
  owner text default 'BD Officer',
  result text,
  next_step text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.revenue_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'general',
  entity_id text,
  prospect_id text,
  partnership_id text,
  author text default 'Revenue Command Center',
  note_type text default 'note',
  body text not null,
  visibility text default 'team',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.revenue_comments add column if not exists prospect_id text;
alter table public.revenue_comments add column if not exists partnership_id text;
alter table public.revenue_comments add column if not exists body text;
alter table public.revenue_comments add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.revenue_comments add column if not exists updated_at timestamptz;
alter table public.revenue_comments add column if not exists archived_at timestamptz;

create table if not exists public.revenue_activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'general',
  entity_id text,
  prospect_id text,
  partnership_id text,
  event_type text not null default 'activity',
  title text,
  event_title text,
  body text,
  event_body text,
  actor_id uuid,
  actor text default 'Revenue Command Center',
  severity text default 'info',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.revenue_activities add column if not exists prospect_id text;
alter table public.revenue_activities add column if not exists partnership_id text;
alter table public.revenue_activities add column if not exists title text;
alter table public.revenue_activities add column if not exists event_title text;
alter table public.revenue_activities add column if not exists body text;
alter table public.revenue_activities add column if not exists event_body text;
alter table public.revenue_activities add column if not exists actor_id uuid;

alter table public.revenue_events add column if not exists title text;
alter table public.revenue_events add column if not exists body text;
alter table public.revenue_events add column if not exists prospect_id text;
alter table public.revenue_events add column if not exists partnership_id text;

alter table public.revenue_pipeline_history add column if not exists entity_type text default 'prospect';
alter table public.revenue_pipeline_history add column if not exists prospect_id text;
alter table public.revenue_pipeline_history add column if not exists partnership_id text;
alter table public.revenue_pipeline_history add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.revenue_command_action_logs add column if not exists action_type text;
alter table public.revenue_command_action_logs add column if not exists action_key text;
alter table public.revenue_command_action_logs add column if not exists entity_type text;
alter table public.revenue_command_action_logs add column if not exists entity_id text;
alter table public.revenue_command_action_logs add column if not exists actor_id uuid;
alter table public.revenue_command_action_logs add column if not exists actor text;
alter table public.revenue_command_action_logs add column if not exists result jsonb not null default '{}'::jsonb;

create table if not exists public.revenue_partnership_activities (
  id uuid primary key default gen_random_uuid(),
  partner_id text,
  partnership_id text,
  action text not null default 'activity',
  title text not null default 'Partnership activity',
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists revenue_prospects_status_idx on public.revenue_prospects(status);
create index if not exists revenue_prospects_archived_idx on public.revenue_prospects(archived_at);
create index if not exists revenue_partnerships_status_idx on public.revenue_partnerships(status);
create index if not exists revenue_partnerships_stage_idx on public.revenue_partnerships(stage);
create index if not exists revenue_partnerships_owner_idx on public.revenue_partnerships(owner);
create index if not exists revenue_partnerships_updated_idx on public.revenue_partnerships(updated_at desc);
create index if not exists revenue_tasks_prospect_idx on public.revenue_tasks(prospect_id);
create index if not exists revenue_tasks_partnership_idx on public.revenue_tasks(partnership_id);
create index if not exists revenue_tasks_entity_text_idx on public.revenue_tasks(entity_type, entity_id);
create index if not exists revenue_appointments_prospect_idx on public.revenue_appointments(prospect_id);
create index if not exists revenue_appointments_partnership_idx on public.revenue_appointments(partnership_id);
create index if not exists revenue_appointments_entity_text_idx on public.revenue_appointments(entity_type, entity_id);
create index if not exists revenue_follow_ups_entity_idx on public.revenue_follow_ups(entity_type, entity_id);
create index if not exists revenue_follow_ups_prospect_idx on public.revenue_follow_ups(prospect_id);
create index if not exists revenue_follow_ups_partnership_idx on public.revenue_follow_ups(partnership_id);
create index if not exists revenue_follow_ups_status_idx on public.revenue_follow_ups(status, scheduled_at);
create index if not exists revenue_notes_entity_idx on public.revenue_notes(entity_type, entity_id, created_at desc);
create index if not exists revenue_notes_prospect_idx on public.revenue_notes(prospect_id, created_at desc);
create index if not exists revenue_notes_partnership_idx on public.revenue_notes(partnership_id, created_at desc);
create index if not exists revenue_activities_prospect_idx on public.revenue_activities(prospect_id, created_at desc);
create index if not exists revenue_activities_partnership_idx on public.revenue_activities(partnership_id, created_at desc);

create or replace function public.revenue_operational_entity_backfill()
returns trigger language plpgsql as $$
begin
  if new.entity_id is null and new.prospect_id is not null then
    new.entity_id := new.prospect_id;
    new.entity_type := 'prospect';
  end if;
  if new.entity_id is null and new.partnership_id is not null then
    new.entity_id := new.partnership_id;
    new.entity_type := 'partnership';
  end if;
  if new.prospect_id is null and new.entity_type = 'prospect' and new.entity_id is not null then
    new.prospect_id := new.entity_id;
  end if;
  if new.partnership_id is null and new.entity_type = 'partnership' and new.entity_id is not null then
    new.partnership_id := new.entity_id;
  end if;
  new.updated_at := coalesce(new.updated_at, now());
  return new;
end $$;

do $$ begin
  drop trigger if exists revenue_tasks_operational_entity_backfill on public.revenue_tasks;
  create trigger revenue_tasks_operational_entity_backfill before insert or update on public.revenue_tasks for each row execute function public.revenue_operational_entity_backfill();
exception when undefined_table then null; end $$;

do $$ begin
  drop trigger if exists revenue_appointments_operational_entity_backfill on public.revenue_appointments;
  create trigger revenue_appointments_operational_entity_backfill before insert or update on public.revenue_appointments for each row execute function public.revenue_operational_entity_backfill();
exception when undefined_table then null; end $$;

do $$ begin
  drop trigger if exists revenue_follow_ups_operational_entity_backfill on public.revenue_follow_ups;
  create trigger revenue_follow_ups_operational_entity_backfill before insert or update on public.revenue_follow_ups for each row execute function public.revenue_operational_entity_backfill();
exception when undefined_table then null; end $$;

-- VIEW REMOVED FOR SAFE TABLE/COLUMN MIGRATION;


-- VIEW REMOVED FOR SAFE TABLE/COLUMN MIGRATION;


-- VIEW REMOVED FOR SAFE TABLE/COLUMN MIGRATION;


-- VIEW REMOVED FOR SAFE TABLE/COLUMN MIGRATION;


alter table public.revenue_prospects enable row level security;
alter table public.revenue_partnerships enable row level security;
alter table public.revenue_tasks enable row level security;
alter table public.revenue_appointments enable row level security;
alter table public.revenue_follow_ups enable row level security;
alter table public.revenue_notes enable row level security;
alter table public.revenue_comments enable row level security;
alter table public.revenue_activities enable row level security;
alter table public.revenue_events enable row level security;
alter table public.revenue_pipeline_history enable row level security;
alter table public.revenue_command_action_logs enable row level security;
alter table public.revenue_partnership_activities enable row level security;

do $$ declare t text; begin
  foreach t in array array[
    'revenue_prospects',
    'revenue_partnerships',
    'revenue_tasks',
    'revenue_appointments',
    'revenue_follow_ups',
    'revenue_notes',
    'revenue_comments',
    'revenue_activities',
    'revenue_events',
    'revenue_pipeline_history',
    'revenue_command_action_logs',
    'revenue_partnership_activities'
  ] loop
    execute format('drop policy if exists "%s_authenticated_all" on public.%I', t, t);
    execute format('create policy "%s_authenticated_all" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;
