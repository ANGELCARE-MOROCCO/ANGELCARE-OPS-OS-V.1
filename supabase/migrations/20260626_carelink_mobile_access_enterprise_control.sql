alter table public.carelink_agent_app_access
  add column if not exists suspended_at timestamptz null,
  add column if not exists suspended_by text null,
  add column if not exists suspension_reason text null,
  add column if not exists shutdown_until timestamptz null,
  add column if not exists restored_at timestamptz null,
  add column if not exists restored_by text null,
  add column if not exists revoked_at timestamptz null,
  add column if not exists session_limit integer null default 1,
  add column if not exists geo_fence_required boolean not null default false,
  add column if not exists pin_reset_required boolean not null default false,
  add column if not exists emergency_access_allowed boolean not null default false,
  add column if not exists security_notes text null,
  add column if not exists last_admin_action text null,
  add column if not exists last_admin_action_at timestamptz null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_carelink_agent_app_access_status
  on public.carelink_agent_app_access(access_status);

create index if not exists idx_carelink_agent_app_access_mobile_enabled
  on public.carelink_agent_app_access(mobile_enabled);

create index if not exists idx_carelink_agent_app_access_suspended_at
  on public.carelink_agent_app_access(suspended_at);
