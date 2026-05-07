-- Email OS V13 database schema for Supabase/Postgres.
-- Run in Supabase SQL editor before enabling SUPABASE_SERVICE_ROLE_KEY.

create table if not exists email_os_configuration (
  id text primary key,
  provider_mode text not null default 'mixed',
  default_sla_minutes int not null default 240,
  retry_limit int not null default 3,
  audit_retention_days int not null default 365,
  approval_policy text not null default '',
  routing_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists email_os_mailboxes (
  id text primary key,
  name text not null,
  address text not null unique,
  department text not null,
  owner text not null,
  provider text not null check (provider in ('google','microsoft','smtp_imap','alias')),
  status text not null check (status in ('healthy','warning','restricted','needs_setup')),
  inbound_host text,
  outbound_host text,
  signature text not null default '',
  routing_rule text not null default '',
  allow_send boolean not null default false,
  require_approval boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_threads (
  id text primary key,
  subject text not null,
  from_name text not null,
  from_email text not null,
  mailbox_id text references email_os_mailboxes(id) on delete set null,
  owner text not null,
  department text not null,
  status text not null,
  priority text not null,
  sla_minutes_left int not null default 0,
  client_name text not null default '',
  revenue_link text,
  partner_link text,
  tags text[] not null default '{}',
  last_message text not null default '',
  internal_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_drafts (
  id text primary key,
  thread_id text references email_os_threads(id) on delete set null,
  mailbox_id text references email_os_mailboxes(id) on delete set null,
  to_address text not null,
  cc text,
  bcc text,
  subject text not null,
  body text not null,
  status text not null,
  approval_reason text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_templates (
  id text primary key,
  name text not null,
  category text not null,
  subject text not null,
  body text not null,
  requires_approval boolean not null default false,
  variables text[] not null default '{}',
  quality_score int not null default 80
);

create table if not exists email_os_permissions (
  id text primary key,
  user_name text not null,
  role text not null,
  department text not null,
  mailbox_id text references email_os_mailboxes(id) on delete cascade,
  can_read boolean not null default false,
  can_send boolean not null default false,
  can_approve boolean not null default false,
  is_admin boolean not null default false,
  temporary_until timestamptz
);

create table if not exists email_os_queue (
  id text primary key,
  type text not null,
  mailbox_id text references email_os_mailboxes(id) on delete set null,
  state text not null,
  retry_count int not null default 0,
  payload jsonb not null default '{}',
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_audit (
  id text primary key,
  actor text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  result text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_email_os_threads_mailbox on email_os_threads(mailbox_id);
create index if not exists idx_email_os_threads_status on email_os_threads(status);
create index if not exists idx_email_os_queue_state on email_os_queue(state);
create index if not exists idx_email_os_audit_target on email_os_audit(target_type, target_id);
