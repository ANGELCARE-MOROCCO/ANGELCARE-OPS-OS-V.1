-- CareLink Mobile P0 production hardening
-- Locks field-agent execution behind OPS-provisioned mobile access and server-side idempotency.

alter table public.carelink_agent_app_access
  add column if not exists app_user_id uuid null,
  add column if not exists user_id uuid null,
  add column if not exists revoked_at timestamptz null,
  add column if not exists last_mobile_guard_at timestamptz null;

create index if not exists idx_carelink_agent_app_access_app_user_id
  on public.carelink_agent_app_access(app_user_id);

create index if not exists idx_carelink_agent_app_access_auth_user_id
  on public.carelink_agent_app_access(auth_user_id);

create index if not exists idx_carelink_agent_app_access_email
  on public.carelink_agent_app_access(lower(email));

create table if not exists public.carelink_mobile_action_requests (
  id bigserial primary key,
  idempotency_key text not null unique,
  mission_id bigint null,
  caregiver_id bigint not null,
  action_type text not null,
  status text not null default 'started',
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_carelink_mobile_action_requests_mission_id
  on public.carelink_mobile_action_requests(mission_id);

create index if not exists idx_carelink_mobile_action_requests_caregiver_id
  on public.carelink_mobile_action_requests(caregiver_id);

create index if not exists idx_carelink_mobile_action_requests_status
  on public.carelink_mobile_action_requests(status);
