
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

create table if not exists public.carelink_schedule_rules (
  id bigserial primary key,
  rule_name text not null,
  city text null,
  zone text null,
  caregiver_id bigint null,
  rule_type text not null default 'capacity',
  rule_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
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

create index if not exists idx_carelink_schedule_events_start_at
  on public.carelink_schedule_events(start_at);

create index if not exists idx_carelink_schedule_events_city
  on public.carelink_schedule_events(city);

create index if not exists idx_carelink_schedule_events_caregiver
  on public.carelink_schedule_events(caregiver_id);

create index if not exists idx_carelink_schedule_events_status
  on public.carelink_schedule_events(status);
