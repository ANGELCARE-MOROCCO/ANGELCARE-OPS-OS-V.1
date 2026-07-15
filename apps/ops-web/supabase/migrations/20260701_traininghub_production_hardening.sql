-- AngelCare TrainingHub Production Hardening Helpers
-- Safe optional tables for lifecycle actions when you want a dedicated audit/action layer.
-- Existing app routes also fallback to audit_change_logs / audit_security_logs / auto_events.

create table if not exists public.traininghub_partner_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  actor_user_id uuid null,
  event_type text not null,
  event_status text not null default 'open',
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create index if not exists idx_traininghub_partner_lifecycle_events_org
  on public.traininghub_partner_lifecycle_events (organization_id);

create index if not exists idx_traininghub_partner_lifecycle_events_status
  on public.traininghub_partner_lifecycle_events (event_status);

alter table public.traininghub_partner_lifecycle_events enable row level security;
