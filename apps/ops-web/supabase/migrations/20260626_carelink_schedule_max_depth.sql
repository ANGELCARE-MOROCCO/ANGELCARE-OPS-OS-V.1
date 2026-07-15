
create table if not exists public.carelink_schedule_events (
  id bigserial primary key,
  source_type text not null default 'manual',
  source_id text null,
  title text not null,
  service_type text null,
  family_name text null,
  caregiver_id bigint null,
  caregiver_name text null,
  city text null,
  zone text null,
  status text not null default 'planned',
  priority text not null default 'normal',
  start_at timestamptz null,
  end_at timestamptz null,
  route_from text null,
  route_to text null,
  transport_mode text null,
  validation_status text not null default 'draft',
  risk_level text not null default 'normal',
  notes text null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carelink_schedule_action_logs (
  id bigserial primary key,
  action_type text not null,
  entity_type text null,
  entity_id text null,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now()
);

alter table public.carelink_schedule_events
  add column if not exists source_type text default 'manual',
  add column if not exists source_id text null,
  add column if not exists title text,
  add column if not exists service_type text,
  add column if not exists family_name text,
  add column if not exists caregiver_id bigint null,
  add column if not exists caregiver_name text,
  add column if not exists city text,
  add column if not exists zone text,
  add column if not exists status text default 'planned',
  add column if not exists priority text default 'normal',
  add column if not exists start_at timestamptz null,
  add column if not exists end_at timestamptz null,
  add column if not exists route_from text,
  add column if not exists route_to text,
  add column if not exists transport_mode text,
  add column if not exists validation_status text default 'draft',
  add column if not exists risk_level text default 'normal',
  add column if not exists notes text,
  add column if not exists created_by text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_carelink_schedule_events_start_at
  on public.carelink_schedule_events(start_at);

create index if not exists idx_carelink_schedule_events_city
  on public.carelink_schedule_events(city);

create index if not exists idx_carelink_schedule_events_status
  on public.carelink_schedule_events(status);

create index if not exists idx_carelink_schedule_events_caregiver
  on public.carelink_schedule_events(caregiver_id);
