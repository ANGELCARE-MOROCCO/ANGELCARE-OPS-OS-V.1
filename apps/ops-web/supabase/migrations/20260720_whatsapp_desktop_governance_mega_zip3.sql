-- ANGELCARE Desktop Mega ZIP 3
-- Central WhatsApp Desktop governance, assignment, device and lease control plane.
-- No WhatsApp cookies, message content, IndexedDB or linked-device secrets are stored here.

create extension if not exists pgcrypto;

create or replace function public.whatsapp_desktop_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.whatsapp_desktop_workspaces (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  phone_number_e164 text,
  department text,
  owner_user_id uuid not null,
  status text not null default 'draft' check (status in ('draft','active','suspended','retired')),
  maximum_devices integer not null default 4 check (maximum_devices between 1 and 20),
  security_level text not null default 'standard' check (security_level in ('standard','sensitive','executive')),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_workspace_policies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.whatsapp_desktop_workspaces(id) on delete cascade,
  lease_duration_minutes integer not null default 15 check (lease_duration_minutes between 5 and 240),
  offline_grace_minutes integer not null default 15 check (offline_grace_minutes between 0 and 1440),
  heartbeat_active_seconds integer not null default 45 check (heartbeat_active_seconds between 15 and 300),
  heartbeat_background_seconds integer not null default 180 check (heartbeat_background_seconds between 30 and 1800),
  maximum_users integer not null default 20 check (maximum_users between 1 and 500),
  maximum_devices_per_user integer not null default 2 check (maximum_devices_per_user between 1 and 20),
  require_new_device_approval boolean not null default true,
  clear_session_on_revocation boolean not null default false,
  allow_downloads boolean not null default true,
  allow_uploads boolean not null default true,
  allow_microphone boolean not null default true,
  allow_camera boolean not null default true,
  allow_notifications boolean not null default true,
  allow_external_open boolean not null default true,
  allow_local_cache_clear boolean not null default true,
  allow_local_session_clear boolean not null default true,
  minimum_desktop_version text not null default '1.2.0',
  blocked_versions jsonb not null default '[]'::jsonb,
  policy_json jsonb not null default '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'operator' check (role in ('owner','administrator','supervisor','operator','auditor')),
  permissions jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('pending','active','suspended','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  assigned_by uuid,
  revoked_by uuid,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.whatsapp_desktop_devices (
  id uuid primary key default gen_random_uuid(),
  installation_id text not null unique,
  device_name text not null,
  platform text not null check (platform in ('macos','windows','linux','unknown')),
  architecture text,
  desktop_version text,
  operating_system_version text,
  registered_user_id uuid not null,
  current_user_id uuid,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','suspended','revoked','compromised')),
  whatsapp_link_state text not null default 'unknown' check (whatsapp_link_state in ('unknown','not_linked','qr_required','linked','logged_out')),
  first_registered_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid,
  rejected_at timestamptz,
  rejected_by uuid,
  revoked_at timestamptz,
  revoked_by uuid,
  revoke_reason text,
  compromised_at timestamptz,
  last_heartbeat_at timestamptz,
  last_seen_at timestamptz,
  last_ip inet,
  runtime_health jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_device_workspace_access (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  status text not null default 'approved' check (status in ('pending','approved','suspended','revoked')),
  approved_by uuid,
  approved_at timestamptz,
  revoked_by uuid,
  revoked_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_id, workspace_id)
);

create table if not exists public.whatsapp_desktop_device_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  status text not null default 'active' check (status in ('active','grace','expired','revoked')),
  lease_token_digest text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  grace_expires_at timestamptz not null,
  last_renewed_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid,
  revoke_reason text,
  client_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_heartbeats (
  id bigint generated by default as identity primary key,
  device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  workspace_id uuid references public.whatsapp_desktop_workspaces(id) on delete set null,
  user_id uuid not null,
  desktop_version text,
  whatsapp_visible boolean not null default false,
  whatsapp_link_state text,
  authorization_state text,
  runtime_health jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_access_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null,
  business_reason text not null,
  requested_until timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled','expired')),
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  workspace_id uuid references public.whatsapp_desktop_workspaces(id) on delete set null,
  command_type text not null check (command_type in (
    'HIDE_WHATSAPP_VIEW','SHOW_ACCESS_REVOKED_NOTICE','RELOAD_WHATSAPP_VIEW',
    'RESTART_WHATSAPP_RENDERER','CLEAR_WHATSAPP_CACHE','CLEAR_WHATSAPP_SESSION',
    'REFRESH_AUTHORIZATION','LOG_OUT_ANGELCARE_DESKTOP'
  )),
  payload jsonb not null default '{}'::jsonb,
  reason text not null,
  status text not null default 'created' check (status in ('created','delivered','received','executing','completed','failed','expired','cancelled')),
  issued_by uuid not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  delivered_at timestamptz,
  received_at timestamptz,
  executing_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_command_receipts (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null references public.whatsapp_desktop_commands(id) on delete cascade,
  device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  state text not null check (state in ('received','executing','completed','failed')),
  detail text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_access_events (
  id bigint generated by default as identity primary key,
  event_type text not null,
  user_id uuid,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null,
  workspace_id uuid references public.whatsapp_desktop_workspaces(id) on delete set null,
  assignment_id uuid references public.whatsapp_desktop_assignments(id) on delete set null,
  outcome text not null default 'recorded',
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  request_ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_security_events (
  id bigint generated by default as identity primary key,
  severity text not null default 'informational' check (severity in ('informational','attention','high','critical')),
  event_type text not null,
  user_id uuid,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null,
  workspace_id uuid references public.whatsapp_desktop_workspaces(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','acknowledged','resolved','dismissed')),
  metadata jsonb not null default '{}'::jsonb,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_audit_events (
  id bigint generated by default as identity primary key,
  actor_user_id uuid,
  target_user_id uuid,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null,
  workspace_id uuid references public.whatsapp_desktop_workspaces(id) on delete set null,
  action text not null,
  reason text,
  previous_state jsonb,
  new_state jsonb,
  command_id uuid references public.whatsapp_desktop_commands(id) on delete set null,
  request_ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_desktop_assignment_user_idx on public.whatsapp_desktop_assignments(user_id, status);
create index if not exists whatsapp_desktop_device_user_idx on public.whatsapp_desktop_devices(current_user_id, approval_status);
create index if not exists whatsapp_desktop_device_seen_idx on public.whatsapp_desktop_devices(last_seen_at desc);
create index if not exists whatsapp_desktop_lease_lookup_idx on public.whatsapp_desktop_device_sessions(device_id, workspace_id, user_id, status, expires_at desc);
create index if not exists whatsapp_desktop_commands_pending_idx on public.whatsapp_desktop_commands(device_id, status, expires_at);
create index if not exists whatsapp_desktop_heartbeat_device_idx on public.whatsapp_desktop_heartbeats(device_id, received_at desc);
create index if not exists whatsapp_desktop_security_created_idx on public.whatsapp_desktop_security_events(created_at desc, severity);
create index if not exists whatsapp_desktop_audit_created_idx on public.whatsapp_desktop_audit_events(created_at desc);

create or replace trigger whatsapp_desktop_workspaces_touch
before update on public.whatsapp_desktop_workspaces
for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_desktop_policies_touch
before update on public.whatsapp_desktop_workspace_policies
for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_desktop_assignments_touch
before update on public.whatsapp_desktop_assignments
for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_desktop_devices_touch
before update on public.whatsapp_desktop_devices
for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_desktop_device_access_touch
before update on public.whatsapp_desktop_device_workspace_access
for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_desktop_sessions_touch
before update on public.whatsapp_desktop_device_sessions
for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_desktop_requests_touch
before update on public.whatsapp_desktop_access_requests
for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_desktop_commands_touch
before update on public.whatsapp_desktop_commands
for each row execute function public.whatsapp_desktop_touch_updated_at();

alter table public.whatsapp_desktop_workspaces enable row level security;
alter table public.whatsapp_desktop_workspace_policies enable row level security;
alter table public.whatsapp_desktop_assignments enable row level security;
alter table public.whatsapp_desktop_devices enable row level security;
alter table public.whatsapp_desktop_device_workspace_access enable row level security;
alter table public.whatsapp_desktop_device_sessions enable row level security;
alter table public.whatsapp_desktop_heartbeats enable row level security;
alter table public.whatsapp_desktop_access_requests enable row level security;
alter table public.whatsapp_desktop_commands enable row level security;
alter table public.whatsapp_desktop_command_receipts enable row level security;
alter table public.whatsapp_desktop_access_events enable row level security;
alter table public.whatsapp_desktop_security_events enable row level security;
alter table public.whatsapp_desktop_audit_events enable row level security;

comment on table public.whatsapp_desktop_devices is 'Governed ANGELCARE Desktop installations. Never stores WhatsApp browser-session secrets.';
comment on table public.whatsapp_desktop_device_sessions is 'Short-lived ANGELCARE authorization leases, not WhatsApp authentication sessions.';
comment on table public.whatsapp_desktop_audit_events is 'Immutable governance evidence. No WhatsApp message content or cookies.';
