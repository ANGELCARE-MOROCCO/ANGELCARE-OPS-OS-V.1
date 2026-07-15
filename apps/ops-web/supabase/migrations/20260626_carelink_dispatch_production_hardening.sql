create table if not exists public.carelink_dispatch_assignments (
  id bigserial primary key,
  source_type text not null,
  source_id text not null,
  mission_title text null,
  mission_code text null,
  caregiver_id bigint null,
  caregiver_name text null,
  backup_caregiver_id bigint null,
  backup_caregiver_name text null,
  dispatch_status text not null default 'draft',
  assignment_status text not null default 'pending',
  route_from text null,
  route_to text null,
  transport_mode text null,
  scheduled_start_at timestamptz null,
  scheduled_end_at timestamptz null,
  city text null,
  zone text null,
  priority text not null default 'normal',
  risk_level text not null default 'normal',
  validation_notes text null,
  canonical_bridge_status text null,
  canonical_bridge_error text null,
  last_action text null,
  last_action_at timestamptz not null default now(),
  last_action_by text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_type, source_id)
);

create table if not exists public.carelink_dispatch_action_logs (
  id bigserial primary key,
  action_type text not null,
  source_type text null,
  source_id text null,
  assignment_id bigint null,
  caregiver_id bigint null,
  caregiver_name text null,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.carelink_dispatch_notifications (
  id bigserial primary key,
  audience_type text not null,
  caregiver_id bigint null,
  caregiver_name text null,
  title text not null,
  body text null,
  action_type text not null,
  source_type text null,
  source_id text null,
  assignment_id bigint null,
  priority text not null default 'normal',
  delivery_status text not null default 'queued',
  is_read boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_carelink_dispatch_assignments_source
  on public.carelink_dispatch_assignments(source_type, source_id);

create index if not exists idx_carelink_dispatch_assignments_caregiver
  on public.carelink_dispatch_assignments(caregiver_id);

create index if not exists idx_carelink_dispatch_assignments_status
  on public.carelink_dispatch_assignments(dispatch_status);

create index if not exists idx_carelink_dispatch_logs_source
  on public.carelink_dispatch_action_logs(source_type, source_id);

create index if not exists idx_carelink_dispatch_notifications_source
  on public.carelink_dispatch_notifications(source_type, source_id);

create index if not exists idx_carelink_dispatch_notifications_audience
  on public.carelink_dispatch_notifications(audience_type, is_read);
