create extension if not exists pgcrypto;

create table if not exists public.email_os_mailbox_user_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  mailbox_id text not null references public.email_os_core_mailboxes(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'operator', 'sender', 'manager', 'admin')),
  can_read boolean not null default false,
  can_send boolean not null default false,
  can_reply boolean not null default false,
  can_archive boolean not null default false,
  can_delete boolean not null default false,
  can_manage_templates boolean not null default false,
  can_view_logs boolean not null default false,
  can_manage_mailbox_settings boolean not null default false,
  pin_hash text,
  pin_status text not null default 'not_configured' check (pin_status in ('not_configured', 'active', 'reset_required', 'locked', 'revoked')),
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  failed_pin_attempts integer not null default 0,
  locked_until timestamptz,
  assigned_by text,
  assigned_at timestamptz not null default now(),
  revoked_by text,
  revoked_at timestamptz,
  revoke_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_os_mailbox_access_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  mailbox_id text not null,
  assignment_id uuid not null references public.email_os_mailbox_user_assignments(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  unlocked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  revoked_at timestamptz,
  revoked_by text,
  revoked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_os_mailbox_access_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id text,
  target_user_id text,
  mailbox_id text,
  assignment_id uuid,
  session_id uuid,
  event_type text not null,
  event_result text not null,
  severity text not null default 'info',
  ip_address text,
  user_agent text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.email_os_mailbox_user_assignments disable row level security;
alter table public.email_os_mailbox_access_sessions disable row level security;
alter table public.email_os_mailbox_access_audit disable row level security;

create unique index if not exists email_os_mailbox_user_assignments_active_unique
  on public.email_os_mailbox_user_assignments (user_id, mailbox_id)
  where status = 'active';

create index if not exists email_os_mailbox_user_assignments_user_idx
  on public.email_os_mailbox_user_assignments (user_id);

create index if not exists email_os_mailbox_user_assignments_mailbox_idx
  on public.email_os_mailbox_user_assignments (mailbox_id);

create index if not exists email_os_mailbox_user_assignments_user_mailbox_idx
  on public.email_os_mailbox_user_assignments (user_id, mailbox_id);

create index if not exists email_os_mailbox_user_assignments_status_idx
  on public.email_os_mailbox_user_assignments (status, pin_status);

create index if not exists email_os_mailbox_access_sessions_user_mailbox_status_idx
  on public.email_os_mailbox_access_sessions (user_id, mailbox_id, status);

create index if not exists email_os_mailbox_access_sessions_expires_idx
  on public.email_os_mailbox_access_sessions (expires_at);

create index if not exists email_os_mailbox_access_audit_actor_idx
  on public.email_os_mailbox_access_audit (actor_user_id);

create index if not exists email_os_mailbox_access_audit_target_idx
  on public.email_os_mailbox_access_audit (target_user_id);

create index if not exists email_os_mailbox_access_audit_mailbox_idx
  on public.email_os_mailbox_access_audit (mailbox_id);

create index if not exists email_os_mailbox_access_audit_event_idx
  on public.email_os_mailbox_access_audit (event_type);

create index if not exists email_os_mailbox_access_audit_created_idx
  on public.email_os_mailbox_access_audit (created_at desc);

